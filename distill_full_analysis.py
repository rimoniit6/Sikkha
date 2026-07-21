import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Get user requests from all sessions
print("=== ALL USER REQUESTS (from parts) ===")
c.execute("""
    SELECT p.text, s.id, s.title, p.time_created
    FROM part p
    JOIN message m ON m.id = p.message_id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND s.time_created > ?
      AND s.title NOT LIKE 'checkpoint-writer:%'
    ORDER BY p.time_created DESC
""", (cutoff_ms,))
user_requests = c.fetchall()

# Group by session
session_requests = {}
for req in user_requests:
    session_id = req[1]
    if session_id not in session_requests:
        session_requests[session_id] = {
            'title': req[2],
            'requests': []
        }
    session_requests[session_id]['requests'].append(req[0][:500])

# Print unique session requests
for session_id, data in list(session_requests.items())[:20]:
    print(f"\n--- {session_id} | {data['title'][:60]} ---")
    for i, req in enumerate(data['requests'][:3]):
        print(f"  Request {i+1}: {req[:200]}")

# Look for repeated patterns
print("\n\n=== REPEATED PATTERNS IN USER REQUESTS ===")
patterns = {
    'audit': 0,
    'review': 0,
    'verify': 0,
    'check': 0,
    'fix': 0,
    'implement': 0,
    'create': 0,
    'add': 0,
    'update': 0,
    'delete': 0,
    'feature': 0,
    'bug': 0,
    'test': 0,
    'deploy': 0,
    'install': 0,
}

for req in user_requests:
    if req[0]:
        text = req[0].lower()
        for pattern in patterns:
            if pattern in text:
                patterns[pattern] += 1

print("Pattern counts:")
for pattern, count in sorted(patterns.items(), key=lambda x: -x[1]):
    if count > 0:
        print(f"  {pattern}: {count}")

conn.close()
