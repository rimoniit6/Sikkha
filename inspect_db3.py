import sqlite3, json

conn = sqlite3.connect(r'C:\Users\mdrim\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

sessions = [
    ('ses_09692b823ffez14pdU6kzs1Vpn', 'interactive design frontend'),
    ('ses_09692b6c0ffeNr3EwBHTt5cZSj', 'FEATURES.md feature check'),
    ('ses_09692b749ffeoUtSmoyZNG7WQP', 'Principal Software Architect'),
    ('ses_096927d96ffemA5a5khI6nT5UB', 'Custom MCQ Exam Creator audit'),
]

for sid, title in sessions:
    print(f"\n=== {title} ({sid}) ===")
    # Get user messages via parts
    cur.execute("""
        SELECT p.data FROM part p
        JOIN message m ON p.message_id = m.id
        WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'user'
        AND json_extract(p.data, '$.type') = 'text'
        ORDER BY m.time_created
    """, (sid,))
    for row in cur.fetchall():
        d = json.loads(row[0])
        print(f"  USER: {d.get('text', '')[:400]}")

    # Get assistant tool calls summary
    print("  --- Tools used ---")
    cur.execute("""
        SELECT json_extract(p.data, '$.tool'), COUNT(*)
        FROM part p
        JOIN message m ON p.message_id = m.id
        WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'assistant'
        AND json_extract(p.data, '$.type') = 'tool'
        GROUP BY json_extract(p.data, '$.tool')
    """, (sid,))
    for row in cur.fetchall():
        print(f"    {row[0]}: {row[1]} calls")

conn.close()
