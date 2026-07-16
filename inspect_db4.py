import sqlite3, json

conn = sqlite3.connect(r'C:\Users\mdrim\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Session: FEATURES.md feature check - get assistant text outputs
sid = 'ses_09692b6c0ffeNr3EwBHTt5cZSj'
print(f"=== Assistant responses from FEATURES.md check ===")
cur.execute("""
    SELECT p.data FROM part p
    JOIN message m ON p.message_id = m.id
    WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'text'
    ORDER BY m.time_created
""", (sid,))
for i, row in enumerate(cur.fetchall()):
    d = json.loads(row[0])
    text = d.get('text', '')
    if text.strip():
        print(f"\n--- Response {i+1} ---")
        print(text[:1500])

conn.close()
