
import cx_Oracle
import sys
from collections import deque

def deletion(a):
	con = cx_Oracle.connect('admin/admin@localhost')
	cur = con.cursor()
	nodesParentDelete = []
	nodesParentDelete = deque(nodesParentDelete)
	parentsSet = []
	parentsSet.append(a)
	
	# Get Parent Nodes
	while(len(parentsSet) != 0):
		toCheck = parentsSet.pop()
		if toCheck not in nodesParentDelete:
			nodesParentDelete.append(toCheck)
			sql = "SELECT GUID_1 FROM DAGR_DAGR WHERE GUID_2 = :1"
			cur.execute(sql, [toCheck])
			res = cur.fetchall()
			for row in res:
				parentsSet.append(row[0])

	nodesParentDelete.remove(a)
	print "Following Parent Nodes will be deleted"
	for results in nodesParentDelete:
		print results

	
	# Get verification
	while True:
		input_var = raw_input("Delete Parent Nodes? (Y/N)")
		if(input_var.lower() == "y"):
			break
		elif(input_var.lower() == "n"):
			print "Process Aborted"
			sys.exit(0)

	# Get DAGR_FILE references
	parent_DAGR_fGUID = []
	for rows in nodesParentDelete:
		sql = "SELECT GUID_FILE FROM DAGR_FILE WHERE GUID_DAGR = :1"
		cur.execute(sql, [row[0]])
		res = cur.fetchall()
		for row in res:
			parent_DAGR_fGUID.append(row[0])


	#DELETE from DAGR-DAGR
	for rows in nodesParentDelete:
		sql = "DELETE FROM DAGR_DAGR WHERE GUID_1 = :1 or GUID_2 = :2"
		cur.execute(sql, [rows[0], rows[0]])

	#DELETE from DAGR-FILE
	for rows in parent_DAGR_fGUID:
		sql = "DELETE FROM DAGR_FILE WHERE GUID_DAGR = :1 or GUID_FILE = :2"
		cur.execute(sql, [rows[0], rows[0]])
	
	#DELETE FROM FILE
	for rows in parent_DAGR_fGUID:
		sql = "DELETE FROM FILES WHERE GUID = :1"
		cur.execute(sql, [rows[0]])

	# Delete Parent DAGRs
	for rows in nodesParentDelete:
		sql = "DELETE FROM DAGR WHERE GUID = :1"
		cur.execute(sql, [rows[0]])

	con.commit()

	
	# Deleting Daughter DAGRs
	nodesDaughterDelete = []
	nodesDaughterDelete = deque(nodesDaughterDelete)

	# Get GUID of Child Node
	sql = "SELECT GUID_2 FROM DAGR_DAGR WHERE GUID_1 = :1"
	cur.execute(sql, [a])
	res = cur.fetchall()
	for row in res:
		nodesDaughterDelete.append(row[0])


	# Get the GUID_FILE of deleted node
	sql = "SELECT GUID_FILE FROM DAGR_FILE WHERE GUID_DAGR = :1"
	cur.execute(sql, [a])
	delete_node = cur.fetchall()

	# Delete from DAGR_FILE
	sql = "DELETE FROM DAGR_FILE WHERE GUID_DAGR = :1"
	cur.execute(sql, [a])

	# Delete from FILE
	for row in delete_node:
		sql = "DELETE FROM FILES WHERE GUID = :1"
		cur.execute(sql, row[0])

	# Delete from DAGR
	sql = "DELETE FROM DAGR WHERE GUID = :1"
	cur.execute(sql, [a])

	con.commit()
	for row in res:
		print "Following Daughter Nodes will be deleted " + row[0]
		input_var = raw_input("Deleting Shallow or Deep? (S/D)")
		if(input_var.lower() == "s"):
			#Shallow deletion, only deletes the reference in DAGR_DAGR
			sql = "DELETE FROM DAGR_DAGR WHERE GUID_2 = :1"
			cur.execute(sql, [row[0]])
		elif(input_var.lower() == "d"):
			deletion(row[0])
		else:
			pass

	con.commit()
	cur.close()
	con.close()
	

if(len(sys.argv) == 2):
	deletion(sys.argv[1])
else:
	print "Usage: python Delete_DAGR.py DAGRGUID"