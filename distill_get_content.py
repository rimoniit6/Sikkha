import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get actual text content from parts
print("=== GETTING TEXT CONTENT FROM PARTS ===")
c.execute("""
    SELECT p.id, p.message_id, p.data, p.time_created
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE m.session_id = 'ses_0852afbb1ffehZRhAikrL4WCb9'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY p.time_created ASC
    LIMIT 5
""")
parts = c.fetchall()

for part in parts:
    print(f"\nPart ID: {part[0]}")
    print(f"Raw data: {part[2][:500]}")
    try:
        data = json.loads(part[2])
        print(f"Parsed keys: {list(data.keys())}")
        if 'text' in data:
            print(f"Text: {data['text'][:300]}")
        if 'type' in data:
            print(f"Type: {data['type']}")
    except Exception as e:
        print(f"Parse error: {e}")

conn.close()
