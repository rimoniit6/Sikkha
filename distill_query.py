import sqlite3
import json
import sys

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# List tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print("=== TABLES ===")
for t in tables:
    print(t)

# Get schema for key tables
print("\n=== SCHEMA ===")
for t in tables:
    c.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{t}'")
    row = c.fetchone()
    if row:
        print(row[0])
        print()

# Recent sessions (last 30 days)
print("\n=== RECENT SESSIONS ===")
c.execute("SELECT id, directory, title, time_created FROM session ORDER BY time_created DESC LIMIT 50")
sessions = c.fetchall()
for s in sessions:
    print(f"  {s[0]} | dir={s[1]} | title={s[2]} | time={s[3]}")

conn.close()
