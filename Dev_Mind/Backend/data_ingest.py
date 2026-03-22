import csv
import json
import os
import sys
from datetime import datetime, timedelta

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app import models
from app.models import User, Project, ActivityLog, Settings, JournalEntry
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

DATA_DIR = os.path.join(os.path.dirname(__file__), "Database")

def wipe_and_initialize_db():
    print("!!! WIPING DATABASE !!!")
    Base.metadata.drop_all(bind=engine)
    print("Database wiped.")
    print("Initializing tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables initialized.")

def create_initial_data(db):
    print("Skipping default user and project creation (User Requested Clean Slate).")
    
    # Create Settings (Safe to keep as app needs them, or crud creates them lazy)
    # Let's just create settings to be sure.
    settings = Settings(
        id=1,
        smart_breaks=True,
        comparative_mode=True,
        reflection_journal=True,
        passive_mode=False,
        alert_sensitivity="Medium"
    )
    db.add(settings)
    
    db.commit()
    print("Default settings initialized.")

def parse_date_time(date_str, time_str):
    return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")

def ingest_session_data(db):
    csv_path = os.path.join(DATA_DIR, "session_data.csv")
    if not os.path.exists(csv_path):
        print(f"Skipping {csv_path}: File not found.")
        return

    print(f"Ingesting {csv_path}...")
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # "date","session_id","project_name","session_type","start_time","end_time","keystroke_rate","mouse_activity","app_switches","idle_time_minutes","focus_score","cognitive_load","mental_state"
            # We map this to ActivityLog. 
            # Note: ActivityLog is usually granular, but we'll create a summary log or multiple logs? 
            # The prompt implies "Populate the activity_logs with the historical analysis".
            # unique log per session seems appropriate for history.
            
            project_id = "proj_001" if row['project_name'] == "DevMind" else "proj_other"
            
            if project_id == "proj_other":
                 # Create other project if needed, or just ignore logic for now. 
                 # Let's check if project exists, if not create.
                 p = db.query(Project).filter(Project.name == row['project_name']).first()
                 if not p:
                     p = Project(id=f"proj_{row['session_id']}", name=row['project_name'], status="Archived", color="#ccc")
                     db.add(p)
                     db.commit()
                     project_id = p.id
                 else:
                     project_id = p.id

            start_dt = parse_date_time(row['date'], row['start_time'])
            
            log = ActivityLog(
                project_id=project_id,
                timestamp=start_dt,
                keystrokes=int(row['keystroke_rate']), # Treating rate as total for this summary
                mouse_distance=float(row['mouse_activity']),
                active_window=row['session_type'], # storing type as "window" for now
                focus_score=int(row['focus_score']),
                cognitive_load=float(row['cognitive_load']) * 100, # Converting 0.xx to int per schema if needed? valid range check. Schema says int default 0. File has 0.42. Let's assume schema meant 0-100 or 0-1.
                # Schema: cognitive_load = Column(Integer, default=0). File: 0.42. 
                # I should probably store as integer percentage 42.
                mental_state=row['mental_state']
            )
            db.add(log)
    db.commit()
    print("Session data ingested.")

def ingest_json_data(db, filename, ingest_func):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"Skipping {filename}: File not found.")
        return
    
    print(f"Ingesting {filename}...")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        ingest_func(db, data)
    db.commit()
    print(f"{filename} ingested.")

def ingest_cognitive_timeline(db, data):
    # Data is list of {time, cognitive_load}
    # These are likely "today's" timeline or generic. I'll make them today's data for the "Live" feel?
    # Or just historical. Request says "historical analysis from these fresh files".
    # I will ingest them as "today" to make them populate the charts if they display "today".
    
    base_date = datetime.utcnow().date()
    for item in data:
        # time "09:00"
        t_str = item['time']
        dt = datetime.combine(base_date, datetime.strptime(t_str, "%H:%M").time())
        
        log = ActivityLog(
            project_id="proj_001",
            timestamp=dt,
            cognitive_load=int(item['cognitive_load'] * 100),
            focus_score=0, # Unknown
            mental_state="Simulated",
            keystrokes=0,
            mouse_distance=0
        )
        db.add(log)

def ingest_project_analytics(db, data):
    # data is list of project stats
    print("Ingesting Project Analytics...")
    for item in data:
        # Check if project exists
        p = db.query(Project).filter(Project.name == item['project']).first()
        if not p:
            # Create if not exists (though we created DevMind already)
            pid = f"proj_{item['project'].lower().replace(' ', '_')}"
            p = Project(
                id=pid,
                name=item['project'],
                description=f"Imported Project. Focus: {item['average_focus']}%",
                status="Active" if item['project'] == "DevMind" else "Archived",
                color="#6c757d" # Default gray
            )
            db.add(p)
    db.commit()

def ingest_comparative_data(db, data):
    # data: {"today": {...}, "last_week": {...}}
    # We will log this as a JournalEntry for reference
    print("Ingesting Comparative Data...")
    
    # Store "Today" summary
    today_stats = data.get("today", {})
    je_today = JournalEntry(
        id=f"comp_today_{datetime.utcnow().timestamp()}",
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        emoji="📊",
        note=f"Baseline Today: Focus {today_stats.get('focus_score')}, Deep Work {today_stats.get('deep_work_minutes')}m"
    )
    db.add(je_today)
    db.commit()

def ingest_break_recovery(db, data):
    # data: list of break stats
    print("Ingesting Break Recovery Data...")
    for i, item in enumerate(data):
        je = JournalEntry(
            id=f"break_{i}_{datetime.utcnow().timestamp()}",
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            emoji="🧘",
            note=f"Break Analysis: {item.get('break_type')} ({item.get('recovery_time_minutes')}m). Focus Delta: {item.get('pre_break_focus')} -> {item.get('post_break_focus')}"
        )
        db.add(je)
    db.commit()

def main():
    wipe_and_initialize_db()
    db = SessionLocal()
    try:
        create_initial_data(db)
        ingest_session_data(db)
        ingest_json_data(db, "cognitive_timeline.json", ingest_cognitive_timeline)
        ingest_json_data(db, "project_analytics.json", ingest_project_analytics)
        ingest_json_data(db, "comparative_data.json", ingest_comparative_data)
        ingest_json_data(db, "break_recovery.json", ingest_break_recovery)
    finally:
        db.close()

if __name__ == "__main__":
    main()
