from sqlalchemy.orm import Session
from . import models, schemas
import uuid
from typing import Optional


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def derive_activity_metrics(keystrokes: int, mouse_distance: float, context_switches: int = 0):
    """Derive 0-100 cognitive metrics from latest interval activity."""
    keys_per_min = max(0, keystrokes) * 12
    mouse_per_min = max(0.0, mouse_distance) * 12

    typing_score = _clamp((keys_per_min / 120.0) * 100.0)
    mouse_score = _clamp((mouse_per_min / 5000.0) * 100.0)
    switch_penalty = min(max(0, context_switches) * 6, 24)

    focus_score = int(round(_clamp((typing_score * 0.62) + (mouse_score * 0.28) - switch_penalty)))
    cognitive_load = int(round(_clamp((typing_score * 0.30) + (mouse_score * 0.45) + (max(0, context_switches) * 8))))
    workload_score = int(round(_clamp((cognitive_load * 0.70) + ((100 - focus_score) * 0.30))))

    if focus_score >= 78 and cognitive_load <= 58:
        mental_state = "Deep Focus"
    elif focus_score >= 62 and cognitive_load <= 72:
        mental_state = "Optimal Focus"
    elif cognitive_load >= 84:
        mental_state = "Overloaded"
    elif focus_score <= 35:
        mental_state = "Distracted"
    else:
        mental_state = "Balanced"

    return {
        "focus_score": focus_score,
        "cognitive_load": cognitive_load,
        "workload_score": workload_score,
        "mental_state": mental_state,
    }

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(email=user.email, hashed_password=fake_hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_projects(db: Session):
    return db.query(models.Project).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(
        id=project.id,
        name=project.name,
        description=project.description,
        # color=project.color, # Removed
        status=project.status
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_status(db: Session, project_id: str, status: str):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project:
        project.status = status
        db.commit()
        db.refresh(project)
    return project

def delete_project(db: Session, project_id: str):
    # Delete associated activity logs first (Manual Cascade)
    db.query(models.ActivityLog).filter(models.ActivityLog.project_id == project_id).delete()
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project:
        db.delete(project)
        db.commit()
    return project

def get_settings(db: Session):
    settings = db.query(models.Settings).first()
    if not settings:
        # Create default
        settings = models.Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def update_settings(db: Session, settings: schemas.AppSettingsBase):
    db_settings = db.query(models.Settings).first()
    if not db_settings:
        db_settings = models.Settings()
        db.add(db_settings)
    
    db_settings.smart_breaks = settings.smartBreaks
    db_settings.comparative_mode = settings.comparativeMode
    db_settings.reflection_journal = settings.reflectionJournal
    db_settings.passive_mode = settings.passiveMode
    
    # Store alerts config flat for now (simplification)
    db_settings.alert_sensitivity = settings.alerts.sensitivity
    db_settings.alert_burnout = settings.alerts.types.get('burnout', True)
    db_settings.alert_focus_drop = settings.alerts.types.get('focusDrop', True)
    db_settings.alert_context_switching = settings.alerts.types.get('contextSwitching', True)
    db_settings.alert_prolonged_work = settings.alerts.types.get('prolongedWork', True)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

def log_activity(db: Session, activity: schemas.ActivityData):
    metrics = derive_activity_metrics(
        keystrokes=activity.keystrokes,
        mouse_distance=activity.mouse_distance,
    )

    db_activity = models.ActivityLog(
        timestamp=activity.timestamp,
        keystrokes=activity.keystrokes,
        mouse_distance=activity.mouse_distance,
        active_window=activity.active_window,
        project_id=activity.project_id,
        focus_score=metrics["focus_score"],
        cognitive_load=metrics["cognitive_load"],
        workload_score=metrics["workload_score"],
        mental_state=metrics["mental_state"],
    )

    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def get_dashboard_stats(db: Session):
    """
    Returns aggregated stats for the Dashboard from the activity_data_log table.
    """
    total_logs = db.query(models.ActivityDataLog).count()
    if total_logs == 0:
        return {
            "current_zone": "No Data",
            "focus_score": 0,
            "burnout_risk": "Low",
            "deep_work_minutes": 0,
            "chart_data": []
        }
    
    # Query all rows ordered by timestamp (time-only TEXT, sorts correctly as HH:MM:SS)
    logs = db.query(models.ActivityDataLog).order_by(models.ActivityDataLog.timestamp.asc()).all()
    
    # Average focus score
    avg_focus = sum(l.focus_score or 0 for l in logs) / total_logs
    
    # Determine current mental zone from latest log
    latest = logs[-1]
    current_zone = latest.mental_state or "Unknown"
    
    # Burnout risk heuristic: high cognitive load + low focus = risk
    avg_cog = sum(l.cognitive_load or 0 for l in logs) / total_logs
    if avg_cog > 70 and avg_focus < 40:
        burnout_risk = "High"
    elif avg_cog > 50 and avg_focus < 60:
        burnout_risk = "Moderate"
    else:
        burnout_risk = "Low"
    
    # Deep work estimate: count logs where mental_state indicates deep focus
    deep_states = {"Deep Focus", "Flow", "Optimal Focus", "Deep Work"}
    deep_count = sum(1 for l in logs if l.mental_state in deep_states)
    # Each log roughly represents ~1 minute of activity (300 logs across a day)
    deep_work_minutes = deep_count
    
    # Chart data: Cognitive Load timeline (sample every few points to avoid overcrowding)
    step = max(1, len(logs) // 20)  # ~20 data points for the chart
    chart_data = []
    for i in range(0, len(logs), step):
        log = logs[i]
        # Format timestamp: take HH:MM from "HH:MM:SS"
        time_label = log.timestamp[:5] if log.timestamp and len(log.timestamp) >= 5 else log.timestamp
        chart_data.append({
            "name": time_label,
            "val": log.cognitive_load or 0
        })
    
    return {
        "current_zone": current_zone,
        "focus_score": int(avg_focus),
        "burnout_risk": burnout_risk,
        "deep_work_minutes": deep_work_minutes,
        "chart_data": chart_data
    }

def get_analytics_data(db: Session, project_id: Optional[str] = None, granularity: str = 'hourly'):
    """
    Returns analytics data from the activity_data_log table.
    Groups by hour for 'hourly', or returns summarized data for other granularities.
    """
    query = db.query(models.ActivityDataLog)
    if project_id:
        # The frontend sends a Project ID (e.g. "proj_001").
        # However, the imported activity_data_log might use project names or slugs (e.g. "Dev_Mind").
        # We try to match: project_id == input OR project_id == Project.name OR project == Project.name
        
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        
        from sqlalchemy import or_
        conditions = [models.ActivityDataLog.project_id == project_id]
        
        if project:
            # Add name-based matching
            conditions.append(models.ActivityDataLog.project_id == project.name)
            conditions.append(models.ActivityDataLog.project == project.name)
            
            # Special case for "DevMind" -> "Dev_Mind" (common in import data)
            if project.name == "DevMind":
                conditions.append(models.ActivityDataLog.project_id == "Dev_Mind")
                conditions.append(models.ActivityDataLog.project == "Dev_Mind")

        query = query.filter(or_(*conditions))
        
    logs = query.order_by(models.ActivityDataLog.timestamp.asc()).all()
    
    if not logs:
        return []
    
    if granularity == 'hourly':
        # Group by hour bucket (HH:00) from time-only timestamp "HH:MM:SS"
        from collections import OrderedDict
        buckets = OrderedDict()
        for log in logs:
            hour = log.timestamp[:2] + ":00" if log.timestamp and len(log.timestamp) >= 2 else "00:00"
            if hour not in buckets:
                buckets[hour] = {"focus": [], "workload": [], "cogLoad": []}
            buckets[hour]["focus"].append(log.focus_score or 0)
            buckets[hour]["workload"].append(log.workload_score or 0)
            buckets[hour]["cogLoad"].append(log.cognitive_load or 0)
        
        data = []
        for label, vals in buckets.items():
            data.append({
                "label": label,
                "focus": int(sum(vals["focus"]) / len(vals["focus"])),
                "workload": int(sum(vals["workload"]) / len(vals["workload"])),
                "cognitiveLoad": int(sum(vals["cogLoad"]) / len(vals["cogLoad"])),
                "prevFocus": 0,
                "prevWorkload": 0
            })
        return data
    
    else:
        # For daily/weekly: just return sampled data points
        step = max(1, len(logs) // 7)
        data = []
        for i in range(0, len(logs), step):
            log = logs[i]
            time_label = log.timestamp[:5] if log.timestamp and len(log.timestamp) >= 5 else log.timestamp
            data.append({
                "label": time_label,
                "focus": log.focus_score or 0,
                "workload": log.workload_score or 0,
                "cognitiveLoad": log.cognitive_load or 0,
                "prevFocus": 0,
                "prevWorkload": 0
            })
        return data
