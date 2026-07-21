import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

print("=== USER MESSAGES WITH REPEAT KEYWORDS ===")
c.execute("""
    SELECT id, json_extract(data, '$.content') as content, time_created
    FROM message
    WHERE json_extract(data, '$.role') = 'user'
      AND time_created > ?
    ORDER BY time_created DESC
""", (cutoff_ms,))
user_msgs = c.fetchall()

repeat_keywords = ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before', 
                   'audit', 'check', 'review', 'verify', 'fix', 'pattern', 'workflow']
for msg in user_msgs:
    if msg[1]:
        content = msg[1].lower()
        for kw in repeat_keywords:
            if kw in content:
                dt = datetime.fromtimestamp(msg[2]/1000)
                print(f"  [{dt.strftime('%Y-%m-%d %H:%M')}] {kw}: {msg[1][:200]}")
                break

print("\n=== REPEATED COMMAND SEQUENCES (file reads in succession) ===")
# Look for sessions where the same files are read repeatedly
c.execute("""
    SELECT session_id, json_extract(p.data, '$.state.input') as input_data, time_created
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'read'
      AND m.time_created > ?
    ORDER BY session_id, time_created
""", (cutoff_ms,))
read_ops = c.fetchall()

# Group by session and find repeated file reads
session_reads = {}
for r in read_ops:
    if r[1]:
        try:
            data = json.loads(r[1]) if isinstance(r[1], str) else r[1]
            if isinstance(data, dict) and 'file_path' in data:
                path = data['file_path'].replace('\\', '/')
                session_id = r[0]
                if session_id not in session_reads:
                    session_reads[session_id] = {}
                session_reads[session_id][path] = session_reads[session_id].get(path, 0) + 1
        except:
            pass

print("Sessions with repeated file reads:")
for session_id, files in session_reads.items():
    repeated = {f: c for f, c in files.items() if c > 3}
    if repeated:
        print(f"\n  {session_id}:")
        for f, count in sorted(repeated.items(), key=lambda x: -x[1])[:5]:
            print(f"    {count}x | {f}")

print("\n=== COMMON EDIT PATTERNS ===")
c.execute("""
    SELECT json_extract(p.data, '$.state.input') as input_data, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'edit'
      AND m.time_created > ?
    GROUP BY json_extract(p.data, '$.state.input')
    HAVING n > 2
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
edits = c.fetchall()
for e in edits:
    if e[0]:
        try:
            data = json.loads(e[0]) if isinstance(e[0], str) else e[0]
            if isinstance(data, dict) and 'file_path' in data:
                path = data['file_path'].replace('\\', '/')
                # Extract just the file part
                parts = path.split('/')
                if len(parts) > 2:
                    file_pattern = '/'.join(parts[-2:])
                    print(f"  {e[1]}x | {file_pattern}")
        except:
            pass

print("\n=== WORKFLOW RUNS ===")
c.execute("""
    SELECT name, status, count(*) as n
    FROM workflow_run
    WHERE time_created > ?
    GROUP BY name, status
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
workflows = c.fetchall()
for w in workflows:
    print(f"  {w[2]}x | {w[0]} | {w[1]}")

conn.close()
