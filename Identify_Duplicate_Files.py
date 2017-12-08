
import cx_Oracle

con = cx_Oracle.connect('admin/admin@localhost')
cur = con.cursor()

sql = "WITH duplicates_files AS (SELECT FILENAME, FILE_SIZE, COUNT(FILENAME) FROM FILES GROUP BY FILENAME, FILE_SIZE HAVING COUNT(FILENAME) >= 2), duplicates_next AS (SELECT f1.GUID, f1.FILENAME FROM FILES f1, duplicates_files df1 WHERE (f1.FILENAME = df1.FILENAME) AND (f1.FILE_SIZE = df1.FILE_SIZE)) SELECT * FROM duplicates_next WHERE ROWNUM <= 1"
cur.execute(sql)
toDelete = []

sql = "DELETE FROM FILES WHERE (GUID != :1) and (FILENAME = :2)"
res = cur.fetchone()
cur.execute(sql, [res[0], res[1]])
con.commit()
cur.close()
con.close()