import sqlite3
import json
import sys
from datetime import datetime, timedelta

DB_PATH = r'C:\Users\mdrim\.local\share\mimocode\mimocode.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 30 days ago in milliseconds
cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

print(f"=== RECENT SESSIONS (last 30 days, cutoff={cutoff_ms}) ===")
c.execute("""
    SELECT id, directory, title, time_created 
    FROM session 
    WHERE time_created > ? AND title NOT LIKE 'checkpoint-writer:%'
    ORDER BY time_created DESC 
    LIMIT 30
""", (cutoff_ms,))
sessions = c.fetchall()
for s in sessions:
    dt = datetime.fromtimestamp(s[3]/1000)
    print(f"  {s[0]} | {dt.strftime('%Y-%m-%d %H:%M')} | {s[1]} | {s[2][:80]}")

print("\n=== TOOL USAGE PATTERNS (recent sessions) ===")
c.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           substr(json_extract(p.data, '$.state.input'), 1, 150) as input_preview,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND m.time_created > ?
    GROUP BY tool, input_preview
    ORDER BY n DESC
    LIMIT 40
""", (cutoff_ms,))
tools = c.fetchall()
for t in tools:
    print(f"  {t[2]}x | {t[0]} | {t[1][:120]}")

print("\n=== USER KEYWORD SEARCH (repeated workflows) ===")
keywords = ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before']
for kw in keywords:
    c.execute("""
        SELECT count(*) FROM message m
        WHERE json_extract(m.data, '$.role') = 'user'
          AND json_extract(m.data, '$.content') LIKE ?
          AND m.time_created > ?
    """, (f'%{kw}%', cutoff_ms))
    count = c.fetchone()[0]
    if count > 0:
        print(f"  '{kw}': {count} occurrences")

print("\n=== REPEATED FILE PATHS IN TOOL INPUTS ===")
c.execute("""
    SELECT json_extract(p.data, '$.state.input') as input_data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND m.time_created > ?
""", (cutoff_ms,))
all_inputs = c.fetchall()

# Extract file paths from inputs
file_counts = {}
for inp in all_inputs:
    if inp[0]:
        try:
            data = json.loads(inp[0]) if isinstance(inp[0], str) else inp[0]
            # Look for file paths
            if isinstance(data, dict):
                for key in ['file_path', 'path', 'filePath']:
                    if key in data and isinstance(data[key], str) and ('/' in data[key] or '\\' in data[key]):
                        # Normalize path
                        path = data[key].replace('\\', '/')
                        # Extract just filename or common pattern
                        parts = path.split('/')
                        if len(parts) > 2:
                            pattern = '/'.join(parts[-2:])
                            file_counts[pattern] = file_counts.get(pattern, 0) + 1
        except:
            pass

print("Top repeated file patterns:")
for pattern, count in sorted(file_counts.items(), key=lambda x: -x[1])[:20]:
    if count > 1:
        print(f"  {count}x | {pattern}")

print("\n=== TASK SUMMARIES (repeated workflow shapes) ===")
c.execute("""
    SELECT t.summary, count(*) as n
    FROM task t
    JOIN session s ON s.id = t.session_id
    WHERE s.time_created > ?
    GROUP BY t.summary
    HAVING n > 1
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
tasks = c.fetchall()
for t in tasks:
    print(f"  {t[1]}x | {t[0][:120]}")

print("\n=== ACTOR REGISTRY (subagent patterns) ===")
c.execute("""
    SELECT description, count(*) as n
    FROM actor_registry
    WHERE time_created > ?
    GROUP BY description
    HAVING n > 1
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
actors = c.fetchall()
for a in actors:
    print(f"  {a[1]}x | {a[0][:120]}")

conn.close()
