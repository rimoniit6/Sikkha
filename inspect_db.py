import sqlite3, json

conn = sqlite3.connect(r'C:\Users\mdrim\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# List all sessions for this project
cur.execute("SELECT id, title, time_created FROM session WHERE directory='E:\\Sikkhs' ORDER BY time_created DESC")
sessions = cur.fetchall()
print("=== All E:\\Sikkhs sessions ===")
for s in sessions:
    print(f"  {s[0]} | {s[1][:80]} | {s[2]}")
print()

# Get user statements from key sessions
for sid, title, _ in sessions[:6]:
    cur.execute("SELECT COUNT(*) FROM message WHERE session_id=?", (sid,))
    msg_count = cur.fetchone()[0]
    print(f"--- {title[:60]} ({sid}) : {msg_count} messages ---")
    cur.execute("SELECT data FROM message WHERE session_id=? AND json_extract(data, '$.role')='user' ORDER BY time_created", (sid,))
    for row in cur.fetchall():
        d = json.loads(row[0])
        content = d.get('content', '')
        if isinstance(content, list):
            texts = [c.get('text', '') for c in content if isinstance(c, dict)]
            content = ' '.join(texts)
        print(f"  USER: {str(content)[:300]}")
    print()

conn.close()
