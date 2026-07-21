import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Get messages from audit sessions
audit_session_ids = [
    'ses_07f324eb2ffey5YGHIjjQQ8WjG',  # Delete Operation Audit
    'ses_081f67ea6ffe2uow0TyAn9tZOB',  # Comprehensive Delete Operation Audit
    'ses_0852afbb1ffehZRhAikrL4WCb9',  # Editorial Workflow Certification Audit
    'ses_087313322ffeUrHDlrEBK6vVHV',  # Admin panel codebase file exploration
    'ses_096927d96ffemA5a5khI6nT5UB',  # Custom MCQ Exam Creator audit
    'ses_08fc86af4ffeH5n7Yey3mZGXT7',  # Admin Panel CRUD Audit Phase 5
]

for session_id in audit_session_ids:
    print(f"\n{'='*80}")
    print(f"SESSION: {session_id}")
    print('='*80)
    
    c.execute("""
        SELECT id, json_extract(data, '$.role') as role, json_extract(data, '$.content') as content, time_created
        FROM message
        WHERE session_id = ?
        ORDER BY time_created ASC
        LIMIT 5
    """, (session_id,))
    messages = c.fetchall()
    
    for msg in messages:
        dt = datetime.fromtimestamp(msg[3]/1000)
        role = msg[1]
        content = msg[2][:500] if msg[2] else "N/A"
        print(f"\n[{dt.strftime('%H:%M')}] {role}:")
        print(f"  {content}")

conn.close()
