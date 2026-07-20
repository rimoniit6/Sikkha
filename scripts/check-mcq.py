import sqlite3
conn = sqlite3.connect('E:/Sikkhs/db/custom.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute('SELECT count(*) FROM MCQ')
print('Total MCQs:', c.fetchone()[0])
c.execute('SELECT count(*) FROM MCQ WHERE deletedAt IS NOT NULL')
print('Soft-deleted MCQs:', c.fetchone()[0])
c.execute('SELECT id, isActive, deletedAt, deletedBy, deleteReason FROM MCQ WHERE id=?', ('cmrp2r5dl007jgkfin2xivjju',))
r = c.fetchone()
if r:
    print('Target MCQ:', dict(r))
else:
    print('Target MCQ: NOT FOUND (hard deleted)')
conn.close()
