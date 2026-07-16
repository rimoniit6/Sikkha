import sqlite3, json

conn = sqlite3.connect(r'C:\Users\mdrim\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Check raw structure of a user message
sessions_to_inspect = [
    'ses_09692b823ffez14pdU6kzs1Vpn',
    'ses_09692b6c0ffeNr3EwBHTt5cZSj',
    'ses_09692b749ffeoUtSmoyZNG7WQP',
]

for sid in sessions_to_inspect:
    print(f"\n=== Session {sid} ===")
    cur.execute("SELECT data FROM message WHERE session_id=? AND json_extract(data, '$.role')='user' ORDER BY time_created LIMIT 2", (sid,))
    for row in cur.fetchall():
        d = json.loads(row[0])
        print(f"  Keys: {list(d.keys())}")
        for k, v in d.items():
            if k != 'content':
                print(f"  {k}: {str(v)[:100]}")
            else:
                if isinstance(v, str):
                    print(f"  content (str): {v[:300]}")
                elif isinstance(v, list):
                    print(f"  content (list len={len(v)}):")
                    for item in v[:3]:
                        print(f"    type={item.get('type','?')} text={str(item.get('text',''))[:200]}")
        print()

# Also check parts
print("\n=== Checking part structure ===")
cur.execute("SELECT data FROM part WHERE session_id='ses_09692b6c0ffeNr3EwBHTt5cZSj' ORDER BY time_created LIMIT 3")
for row in cur.fetchall():
    d = json.loads(row[0])
    print(f"  part type={d.get('type','?')} keys={list(d.keys())}")
    if 'text' in d:
        print(f"    text[:200]: {d['text'][:200]}")
    print()

# Check what tools were used in the feature check session
print("\n=== Tools used in feature check session ===")
cur.execute("SELECT DISTINCT json_extract(data, '$.tool') FROM part WHERE session_id='ses_09692b6c0ffeNr3EwBHTt5cZSj' AND json_extract(data, '$.type')='tool'")
for row in cur.fetchall():
    print(f"  tool: {row[0]}")

conn.close()
