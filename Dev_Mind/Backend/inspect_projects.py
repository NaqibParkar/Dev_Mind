import sys, os
print("Starting inspection...")
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from sqlalchemy import text
    from app.database import engine

    with engine.connect() as conn:
        print("\n=== PROJECTS Table ===")
        result = conn.execute(text("SELECT * FROM projects LIMIT 5"))
        rows = list(result)
        if not rows:
            print("No projects found.")
        else:
            for row in rows:
                print(dict(row._mapping))
except Exception as e:
    print(f"Error reading projects: {e}")
