import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Get non-checkpoint sessions with their user messages
print("=== USER REQUESTS (non-checkpoint sessions) ===")
c.execute("""
    SELECT s.id, s.title, s.time_created,
           (SELECT json_extract(m.data, '$.content') 
            FROM message m 
            WHERE m.session_id = s.id 
              AND json_extract(m.data, '$.role') = 'user'
            ORDER BY m.time_created ASC 
            LIMIT 1) as first_user_msg
    FROM session s
    WHERE s.time_created > ?
      AND s.title NOT LIKE 'checkpoint-writer:%'
    ORDER BY s.time_created DESC
""", (cutoff_ms,))
sessions = c.fetchall()

for s in sessions:
    dt = datetime.fromtimestamp(s[2]/1000)
    msg = s[3][:300] if s[3] else "N/A"
    print(f"\n--- {s[0]} | {dt.strftime('%Y-%m-%d %H:%M')} | {s[1][:60]} ---")
    print(f"  First user msg: {msg}")

# Look for audit-related sessions
print("\n\n=== AUDIT/REVIEW/VERIFY PATTERNS ===")
c.execute("""
    SELECT s.id, s.title, s.time_created
    FROM session s
    WHERE s.time_created > ?
      AND (s.title LIKE '%audit%' OR s.title LIKE '%review%' OR s.title LIKE '%verify%' 
           OR s.title LIKE '%check%' OR s.title LIKE '%certif%')
    ORDER BY s.time_created DESC
""", (cutoff_ms,))
audit_sessions = c.fetchall()
for s in audit_sessions:
    dt = datetime.fromtimestamp(s[2]/1000)
    print(f"  {dt.strftime('%Y-%m-%d')} | {s[1][:80]}")

# Look for delete-related sessions
print("\n\n=== DELETE OPERATION PATTERNS ===")
c.execute("""
    SELECT s.id, s.title, s.time_created
    FROM session s
    WHERE s.time_created > ?
      AND (s.title LIKE '%delete%' OR s.title LIKE '%trash%' OR s.title LIKE '%remove%')
    ORDER BY s.time_created DESC
""", (cutoff_ms,))
delete_sessions = c.fetchall()
for s in delete_sessions:
    dt = datetime.fromtimestamp(s[2]/1000)
    print(f"  {dt.strftime('%Y-%m-%d')} | {s[1][:80]}")

# Look for feature implementation sessions
print("\n\n=== FEATURE IMPLEMENTATION PATTERNS ===")
c.execute("""
    SELECT s.id, s.title, s.time_created
    FROM session s
    WHERE s.time_created > ?
      AND (s.title LIKE '%implement%' OR s.title LIKE '%create%' OR s.title LIKE '%add%' 
           OR s.title LIKE '%fix%' OR s.title LIKE '%update%')
    ORDER BY s.time_created DESC
""", (cutoff_ms,))
feature_sessions = c.fetchall()
for s in feature_sessions:
    dt = datetime.fromtimestamp(s[2]/1000)
    print(f"  {dt.strftime('%Y-%m-%d')} | {s[1][:80]}")

conn.close()
