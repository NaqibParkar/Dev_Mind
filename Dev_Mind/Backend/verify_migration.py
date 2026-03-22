import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def verify_migration():
    print("--- Verifying Migration ---")
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        project_count = db.query(models.Project).count()
        log_count = db.query(models.ActivityLog).count()
        journal_count = db.query(models.JournalEntry).count()
        
        print(f"Users: {user_count}")
        print(f"Projects: {project_count}")
        print(f"Activity Logs: {log_count}")
        print(f"Journal Entries: {journal_count}")
        
        if user_count > 0 and project_count > 0:
            print(" Basic Data Present")
        else:
            print(" Missing Basic Data")
            
    except Exception as e:
        print(f" Error connecting or querying: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_migration()
