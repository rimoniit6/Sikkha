import sqlite3, json

conn = sqlite3.connect(r'C:\Users\mdrim\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Session: Principal Software Architect - get assistant text outputs
sid = 'ses_09692b749ffeoUtSmoyZNG7WQP'
print(f"=== Assistant responses from Principal Software Architect session ===")
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
        print(text[:2000])

# Also check tool results for key operations
print("\n\n=== Tool results from Principal Software Architect session ===")
cur.execute("""
    SELECT p.data FROM part p
    JOIN message m ON p.message_id = m.id
    WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') IN ('Write', 'Edit')
    ORDER BY m.time_created
""", (sid,))
for i, row in enumerate(cur.fetchall()):
    d = json.loads(row[0])
    tool = d.get('tool', '')
    state = d.get('state', {})
    inp = state.get('input', {})
    if tool == 'Edit':
        fp = inp.get('file_path', '')
        print(f"  Edit: {fp}")
    elif tool == 'Write':
        fp = inp.get('file_path', '')
        print(f"  Write: {fp}")

conn.close()
