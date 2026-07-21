import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Get user requests from all sessions - text is in JSON data field
print("=== ALL USER REQUESTS (from parts) ===")
c.execute("""
    SELECT p.data, s.id, s.title, p.time_created
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
    try:
        data = json.loads(req[0])
        text = data.get('text', '')[:500]
    except:
        text = str(req[0])[:500]
    session_requests[session_id]['requests'].append(text)

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
    try:
        data = json.loads(req[0])
        text = data.get('text', '').lower()
    except:
        text = str(req[0]).lower()
    for pattern in patterns:
        if pattern in text:
            patterns[pattern] += 1

print("Pattern counts:")
for pattern, count in sorted(patterns.items(), key=lambda x: -x[1]):
    if count > 0:
        print(f"  {pattern}: {count}")

# Get assistant responses to understand workflows
print("\n\n=== ASSISTANT WORKFLOW PATTERNS ===")
c.execute("""
    SELECT p.data, s.id, s.title, p.time_created
    FROM part p
    JOIN message m ON m.id = p.message_id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND s.time_created > ?
      AND s.title NOT LIKE 'checkpoint-writer:%'
    ORDER BY p.time_created DESC
""", (cutoff_ms,))
bash_calls = c.fetchall()

# Count bash commands
bash_commands = {}
for call in bash_calls:
    try:
        data = json.loads(call[0])
        input_data = data.get('state', {}).get('input', '')
        if isinstance(input_data, str):
            input_json = json.loads(input_data)
            cmd = input_json.get('command', '')[:100]
        else:
            cmd = str(input_data)[:100]
        # Extract just the command name
        parts = cmd.split()
        if parts:
            bash_commands[parts[0]] = bash_commands.get(parts[0], 0) + 1
    except:
        pass

print("Top bash commands:")
for cmd, count in sorted(bash_commands.items(), key=lambda x: -x[1])[:20]:
    print(f"  {count}x | {cmd}")

conn.close()
