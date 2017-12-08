
import cx_Oracle

con = cx_Oracle.connect('admin/admin@localhost')
cur = con.cursor()

sql = "SELECT FILENAME, FILE_SIZE, COUNT(FILENAME) FROM FILES GROUP BY FILENAME, FILE_SIZE HAVING COUNT(FILENAME) >= 2"
cur.execute(sql)
res = cur.fetchall()
for results in res:

	#Get first file GUID, Filename, File_Size to replace
	sql = "SELECT * FROM (SELECT GUID, FILENAME, FILE_SIZE FROM FILES WHERE FILENAME = :1 and FILE_SIZE = :2) WHERE ROWNUM <= 1"
	cur.execute(sql,[results[0],results[1]])
	res2 = cur.fetchall()

	#Get DAGR GUID of file
	sql = "SELECT GUID_DAGR FROM DAGR_FILE WHERE GUID_FILE = :1"
	cur.execute(sql,[res2[0][0]])
	res5 = cur.fetchall()

	#Find GUIDS of Files to replace
	sql = "SELECT GUID FROM FILES WHERE GUID != :1 and FILENAME = :2 and File_SIZE = :3"
	cur.execute(sql,[res2[0][0], res2[0][1], res2[0][2]])
	res3 = cur.fetchall()

	res4 = []
	#Find GUIDS of DAGRs to replace
	for row in res3:
		sql = "SELECT GUID_DAGR FROM DAGR_FILE WHERE DAGR_FILE.GUID_FILE = :1"
		cur.execute(sql, [row[0]])
		for newrow in cur.fetchall():
			res4.append(newrow)

	#Update the Files table
	for row in res3:
		sql = "DELETE FROM FILES WHERE GUID = :1"
		cur.execute(sql, [row[0]])

	#Update the DAGR Table
	for row in res4:
		sqk = "DELETE FROM DAGR WHERE DAGR.GUID = :1"
		cur.execute(sql, [row[0]])

	#Delete the DAGR_FILE TABLE
	for row in res3:
		sql = "DELETE FROM DAGR_FILE WHERE GUID_FILE = :1"
		cur.execute(sql, [row[0]])

	#Update the DAGR_DAGR Table
	for row in res4:
		sql = "UPDATE DAGR_DAGR SET DAGR_DAGR.GUID_1 = :1 WHERE DAGR_DAGR.GUID_2 = :2"
		cur.execute(sql, [res5[0][0], row[0]]) 
		sql = "UPDATE DAGR_DAGR SET DAGR_DAGR.GUID_2 = :1 WHERE DAGR_DAGR.GUID_1 = :2"
		cur.execute(sql, [res5[0][0], row[0]]) 

	con.commit()

cur.close()
con.close()