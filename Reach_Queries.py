
import cx_Oracle
import math
import sys
from collections import deque

down = 0
up = 0
if(len(sys.argv) > 4):
	print "Usage: python Reach_Queries.py GUID <-Down> <+Upper>"
	sys.exit(0)
elif(len(sys.argv) < 2):
	print "Usage: python Reach_Queries.py GUID <-Down> <+Upper>"
	sys.exit(0)
elif(len(sys.argv) == 2):
	down = 1
	up = 1
elif(int(sys.argv[2]) > 0 or int(sys.argv[3]) < 0):
	print "Usage: python Reach_Queries.py GUID <-Down> <+Upper>"
	sys.exit(0)


if(len(sys.argv) == 4):
	down = int(sys.argv[2])
	up = int(sys.argv[3])

checkDown = []
checkDown.append(sys.argv[1])
checkDown = deque(checkDown)
alreadyCheckedDown = []
accumulator = []
accumulator = deque(accumulator)

con = cx_Oracle.connect('admin/admin@localhost')
cur = con.cursor()

# Check the descendants
for a in range(0, abs(down)):
	while(len(checkDown) != 0):
		sql = "SELECT dd1.GUID_2 from DAGR_DAGR dd1 WHERE dd1.GUID_1 = :1"
		toCheck = checkDown.popleft()
		cur.execute(sql, [toCheck])
		alreadyCheckedDown.append(toCheck)
		res = cur.fetchall()
		for x in res:
			if(x[0] not in alreadyCheckedDown):
				if(x[0] not in accumulator):
					accumulator.append(x[0])
	for b in range(0, len(accumulator)):
		checkDown.append(accumulator.popleft())

for c in range(0, len(checkDown)):
	alreadyCheckedDown.append(checkDown.popleft())

checkUp = []
checkUp.append(sys.argv[1])
checkUp = deque(checkUp)
alreadyCheckedUp = []
accumulator = []
accumulator = deque(accumulator)

for a in range(0, abs(up)):
	while(len(checkUp) != 0):
		sql = "SELECT dd1.GUID_1 from DAGR_DAGR dd1 WHERE dd1.GUID_2 = :1"
		toCheck = checkUp.popleft()
		alreadyCheckedUp.append(toCheck)
		cur.execute(sql, [toCheck])
		res = cur.fetchall()
		for x in res:
			if(x[0] not in alreadyCheckedUp):
				if(x[0] not in accumulator):
					accumulator.append(x[0])
	for b in range(0, len(accumulator)):
		checkUp.append(accumulator.popleft())

for c in range(0, len(checkUp)):
	alreadyCheckedUp.append(checkUp.popleft())

final = []
for results in alreadyCheckedDown:
	if(results not in final):
		final.append(results)
for results in alreadyCheckedUp:
	if(results not in final):
		final.append(results)

print "Reach Query"
for results in final:
	print results
print "\n\n\n\n\n"
print "Orphan Query"

orphans = []
sql = "SELECT d1.GUID FROM DAGR d1"
cur.execute(sql)
res = cur.fetchall()
for results in res:
	if results not in final:
		orphans.append(results[0])

for results in orphans:
	print results

cur.close()
con.close()