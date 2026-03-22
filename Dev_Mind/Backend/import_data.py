import pandas as pd
import json
import os
from datetime import datetime, timedelta
from app.database import SessionLocal
from app import models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_projects(db):
    projects = {
        "proj_backend": "Backend Development",
        "proj_frontend": "Frontend Development"
    }
    for pid, name in projects.items():
        existing = db.query(models.Project).filter(models.Project.id == pid).first()
        if not existing:
            print(f"Creating project: {name} ({pid})")
            p = models.Project(id=pid, name=name, description=f"Imported {name} project", status="Active")
            db.add(p)
    db.commit()

def import_analytics_hourly(db, file_path):
    print(f"Importing {file_path}...")
    try:
        df = pd.read_csv(file_path)
        count = 0
        for _, row in df.iterrows():
            ts = pd.to_datetime(row['timestamp']).to_pydatetime()
            log = models.ActivityLog(
                timestamp=ts,
                project_id=row['project_id'],
                focus_score=int(row['focus_level']),
                cognitive_load=float(row['workload']), # Assuming 0-100 matches
                keystrokes=0, # Not in CSV
                mouse_distance=0, # Not in CSV
                active_window=f"Work on {row['project_id']}"
            )
            db.add(log)
            count += 1
        db.commit()
        print(f"Imported {count} hourly logs.")
    except Exception as e:
        print(f"Error importing hourly: {e}")
        db.rollback()

def import_session_data(db, file_path):
    print(f"Importing {file_path}...")
    try:
        df = pd.read_csv(file_path)
        count = 0
        for _, row in df.iterrows():
            date_str = row['date']
            # Create a log at 6 PM for summary
            ts = pd.to_datetime(f"{date_str} 18:00:00").to_pydatetime()
            
            # Using this to backfill 'context_switches' which isn't easy to store in single log
            # We'll store it as a generic log but with high context switch metric if we had it.
            # Actually, `ActivityLog` has `keystrokes`, `mouse_distance`. 
            # It DOES NOT have `context_switches` column in `models.py` (ActivityLog).
            # `tracker.py` calculates it but `ActivityLog` model in `models.py` (lines 24-40) DOES NOT have it.
            # Wait, `get_current_stats` returns it, but `log_activity` CRUD (lines 86-93) doesn't explicitly save it
            # UNLESS `models.py` was updated.
            # Let's check `models.py` content I read earlier.
            # Line 32-40: keystrokes, mouse_distance, active_window, focus_score, workload_score, cognitive_load, mental_state.
            # NO `context_switches` column.
            # So I cannot strictly store context switches in DB without schema change.
            # I will store it in `mental_state` as JSON or string "Context Switches: X" for now?
            # Or just ignore common import pattern to separate concerns.
            # I'll store it in `mental_state`.
            
            log = models.ActivityLog(
                timestamp=ts,
                focus_score=int(row['focus_score']),
                mental_state=f"Context Switches: {row['context_switches']}, Deep Work: {row['deep_work_minutes']}m",
                active_window="Daily Session Summary"
            )
            db.add(log)
            count += 1
        db.commit()
        print(f"Imported {count} session summaries.")
    except Exception as e:
        print(f"Error importing sessions: {e}")
        db.rollback()

def import_project_analytics(db, file_path):
    print(f"Importing {file_path}...")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        count = 0
        for item in data:
            # item: {date, project, hours, focus}
            # Create a log for this
            ts = pd.to_datetime(f"{item['date']} 12:00:00").to_pydatetime()
            pid = "proj_backend" if item['project'] == "Backend" else "proj_frontend"
            
            log = models.ActivityLog(
                timestamp=ts,
                project_id=pid,
                focus_score=int(item['focus']),
                active_window=f"Project Work: {item['project']}",
                # heuristic for workload based on hours?? No, just leave 0
            )
            db.add(log)
            count += 1
        db.commit()
        print(f"Imported {count} project analytic entries.")
    except Exception as e:
        print(f"Error importing project json: {e}")
        db.rollback()

def import_break_recovery(db, file_path):
    print(f"Importing {file_path}...")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        count = 0
        for item in data:
            # item: {date, break_type, pre_focus, post_focus, recovery_minutes}
            ts = pd.to_datetime(f"{item['date']} 15:00:00").to_pydatetime()
            
            log = models.ActivityLog(
                timestamp=ts,
                active_window=f"Break: {item['break_type']}",
                mental_state=f"Recovery: {item['recovery_minutes']}m",
                focus_score=int(item['post_focus'])
            )
            db.add(log)
            count += 1
        db.commit()
        print(f"Imported {count} break entries.")
    except Exception as e:
        print(f"Error importing breaks: {e}")
        db.rollback()

def main():
    db = SessionLocal()
    ensure_projects(db)
    
    base_dir = "database"
    if os.path.exists(os.path.join(base_dir, "analytics_hourly_2weeks.csv")):
        import_analytics_hourly(db, os.path.join(base_dir, "analytics_hourly_2weeks.csv"))
    
    if os.path.exists(os.path.join(base_dir, "session_data_2weeks.csv")):
        import_session_data(db, os.path.join(base_dir, "session_data_2weeks.csv"))
        
    if os.path.exists(os.path.join(base_dir, "project_analytics_2weeks.json")):
        import_project_analytics(db, os.path.join(base_dir, "project_analytics_2weeks.json"))
        
    if os.path.exists(os.path.join(base_dir, "break_recovery_2weeks.json")):
        import_break_recovery(db, os.path.join(base_dir, "break_recovery_2weeks.json"))
    
    db.close()

if __name__ == "__main__":
    main()
