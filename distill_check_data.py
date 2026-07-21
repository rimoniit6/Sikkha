import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check the actual data format
print("=== CHECKING MESSAGE DATA FORMAT ===")
c.execute("""
    SELECT id, data, time_created
    FROM message
    WHERE session_id = 'ses_0852afbb1ffehZRhAikrL4WCb9'
    ORDER BY time_created ASC
    LIMIT 3
""")
messages = c.fetchall()

for msg in messages:
    print(f"\nMessage ID: {msg[0]}")
    print(f"Raw data: {msg[1][:500]}")
    try:
        data = json.loads(msg[1])
        print(f"Parsed keys: {list(data.keys())}")
        if 'content' in data:
            print(f"Content: {str(data['content'])[:300]}")
        if 'role' in data:
            print(f"Role: {data['role']}")
    except Exception as e:
        print(f"Parse error: {e}")

conn.close()
