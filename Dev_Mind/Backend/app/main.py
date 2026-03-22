from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import json
import csv
import io

# ... (rest of imports)

# Local imports
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
from .tracker import ActivityTracker
from .routers import auth
from .ml_service import BurnoutPredictor

# 1. Initialize Database Tables
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database connection failed. Tables not created. Error: {e}")

# 2. Global Tracker Instance
tracker = ActivityTracker()
predictor = BurnoutPredictor()

# 3. Lifespan Context Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start hardware listeners (keyboard and mouse)
    tracker.start()
    
    # Database Clean-up: Ensure Settings exist
    db = SessionLocal()
    try:
        if not crud.get_settings(db):
            print("Initializing default settings...")
    except Exception as e:
        print(f"Error initializing settings: {e}")
    finally:
        db.close()

    yield
    # Shutdown: Stop hardware listeners safely
    tracker.stop()

# 4. FastAPI Application Initialization
app = FastAPI(
    title="DevMind Backend",
    description="Cognitive Load & Activity Monitoring API",
    lifespan=lifespan
)

app.include_router(auth.router)

# 5. CORS Configuration
# 5. CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Online", "message": "DevMind Backend is running"}

@app.get("/activity/live")
def get_live_activity(db: Session = Depends(get_db)):
    # Get un-saved raw numbers directly from tracker memory.
    memory_stats = tracker.get_current_stats()

    # Latest processed record is only used as fallback during idle intervals.
    latest = db.query(models.ActivityLog).order_by(models.ActivityLog.timestamp.desc()).first()

    interval_keys = int(memory_stats.get("last_interval_keystrokes", 0) or 0)
    interval_mouse = float(memory_stats.get("last_interval_mouse", 0) or 0)
    interval_switches = int(memory_stats.get("last_interval_context_switches", 0) or 0)

    derived_metrics = crud.derive_activity_metrics(
        keystrokes=interval_keys,
        mouse_distance=interval_mouse,
        context_switches=interval_switches,
    )

    focus = derived_metrics["focus_score"]
    cog_load = derived_metrics["cognitive_load"]

    if interval_keys == 0 and interval_mouse <= 0 and interval_switches == 0 and latest:
        focus = latest.focus_score or 0
        cog_load = latest.cognitive_load or 0
    
    # ML Prediction for Burnout Risk.
    burnout_risk = "Low"
    try:
        # Multiplier: 5s interval * 12 = 60s (KPM).
        kpm = interval_keys * 12
        mouse_activity = interval_mouse
        print(f"ML Input: KPM={kpm}, Mouse={mouse_activity}")

        burnout_risk = predictor.predict(
            cognitive_load=cog_load,
            focus_score=focus,
            keystrokes=kpm,
            mouse_dist=mouse_activity
        )
    except Exception as e:
        print(f"ML Prediction Warning: {e}")
        burnout_risk = "Error"

    # Active Window Logic
    live_window = memory_stats.get("active_window")
    if not live_window:
        live_window = "Unknown"
        
    return {
        "keystrokes": memory_stats.get("keystrokes", 0),
        "mouse_intensity": int(memory_stats.get("mouse_distance", 0)),
        "focus_score": focus,
        "cognitive_load": cog_load,
        "active_window": live_window,
        "burnout_risk": burnout_risk,
        "context_switches": memory_stats.get("context_switches", 0)
    }

@app.get("/activity/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns aggregated stats for the main dashboard.
    """
    return crud.get_dashboard_stats(db)

@app.get("/activity/analytics")
def get_analytics_data(project_id: str = None, granularity: str = 'hourly', db: Session = Depends(get_db)):
    """
    Returns historical analytics data.
    """
    return crud.get_analytics_data(db, project_id, granularity)

# --- Project Management Routes ---
@app.get("/projects", response_model=list[schemas.Project])
def read_projects(db: Session = Depends(get_db)):
    projects = crud.get_projects(db)
    return projects

@app.post("/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@app.put("/projects/{project_id}/status")
def update_project_status(project_id: str, status: str, db: Session = Depends(get_db)):
    updated_project = crud.update_project_status(db=db, project_id=project_id, status=status)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@app.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    deleted_project = crud.delete_project(db=db, project_id=project_id)
    if not deleted_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully", "id": project_id}

# --- Settings & Configuration ---
@app.get("/settings", response_model=schemas.AppSettings)
def read_settings(db: Session = Depends(get_db)):
    settings_db = crud.get_settings(db)
    if not settings_db:
        raise HTTPException(status_code=404, detail="Settings not found")
        
    return {
        "id": settings_db.id,
        "smartBreaks": settings_db.smart_breaks,
        "comparativeMode": settings_db.comparative_mode,
        "reflectionJournal": settings_db.reflection_journal,
        "passiveMode": settings_db.passive_mode,
        "alerts": {
            "enabled": True,
            "sensitivity": settings_db.alert_sensitivity,
            "types": {
                "burnout": settings_db.alert_burnout,
                "focusDrop": settings_db.alert_focus_drop,
                "contextSwitching": settings_db.alert_context_switching,
                "prolongedWork": settings_db.alert_prolonged_work
            }
        }
    }

@app.put("/settings", response_model=schemas.AppSettings)
def update_settings(settings: schemas.AppSettingsBase, db: Session = Depends(get_db)):
    return crud.update_settings(db=db, settings=settings)

@app.post("/upload/data")
async def upload_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload CSV or JSON file containing activity data.
    """
    content = await file.read()
    filename = file.filename.lower()
    data_to_store = None

    try:
        if filename.endswith('.json'):
            data_to_store = json.loads(content)
        elif filename.endswith('.csv'):
            # Parse CSV to JSON-like list of dicts
            csv_file = io.StringIO(content.decode('utf-8'))
            reader = csv.DictReader(csv_file)
            data_to_store = [row for row in reader]
        else:
            raise HTTPException(status_code=400, detail="Invalid file type. Only .json and .csv are supported.")
            
        # Create DB Entry
        new_upload = models.UploadedActivity(
            filename=file.filename,
            data=data_to_store
        )
        db.add(new_upload)
        db.commit()
        db.refresh(new_upload)
        
        return {"message": "File uploaded successfully", "id": new_upload.id, "rows": len(data_to_store) if isinstance(data_to_store, list) else 1}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")