from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class UploadedActivity(Base):
    __tablename__ = "uploaded_activities"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    data = Column(JSON) # Stores the raw data


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True) # Using UUID string to match frontend
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    # color = Column(String) # Removed per user request
    status = Column(String, default="Active") # Active, Archived, Inactive
    
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Metrics
    keystrokes = Column(Integer, default=0)
    mouse_distance = Column(Float, default=0.0)
    active_window = Column(String, nullable=True)
    
    # Derived Metrics (stored for easier querying)
    focus_score = Column(Integer, default=0)
    workload_score = Column(Integer, default=0)
    cognitive_load = Column(Integer, default=0)
    mental_state = Column(String, nullable=True)
    
class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String, primary_key=True, index=True)
    date = Column(String, index=True) # ISO Date string YYYY-MM-DD
    emoji = Column(String)
    note = Column(String, nullable=True)
    
class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, default=1) # Single row for local app
    smart_breaks = Column(Boolean, default=True)
    comparative_mode = Column(Boolean, default=True)
    reflection_journal = Column(Boolean, default=True)
    passive_mode = Column(Boolean, default=False)
    
    # Alert Config (stored as JSON or separate columns, simple columns for now)
    alert_burnout = Column(Boolean, default=True)
    alert_focus_drop = Column(Boolean, default=True)
    alert_context_switching = Column(Boolean, default=True)
    alert_prolonged_work = Column(Boolean, default=True)
    alert_sensitivity = Column(String, default="Medium")

class ActivityFeature(Base):
    __tablename__ = "activity_feature"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    project_id = Column(String, nullable=True)
    
    # Core Features (Schema from CSV)
    focus_score = Column(Float, nullable=True)
    cognitive_load = Column(Float, nullable=True)
    keystrokes = Column(Integer, nullable=True)
    mouse_distance = Column(Float, nullable=True)
    
    # Extended Metrics (from session/break data)
    context_switches = Column(Integer, nullable=True)
    deep_work_minutes = Column(Float, nullable=True)
    recovery_minutes = Column(Float, nullable=True)
    activity_type = Column(String, nullable=True) # e.g. "Session", "Break", "Project"
    
    # Metadata / Flexible Data
    source_file = Column(String, nullable=True)
    feature_data = Column(JSON, nullable=True) # To store full JSON row or extras

class ActivityDataLog(Base):
    """Maps to the user-created 'activity_data_log' table in Neon PostgreSQL."""
    __tablename__ = "activity_data_log"
    
    # This table has no explicit PK in Neon, so we use an automap-style approach.
    # SQLAlchemy requires a PK; we use a synthetic row_number or the implicit ctid.
    # Workaround: define all columns and mark one as PK (project_id + timestamp combo).
    # Safest: add an autoincrement id if possible, or use __mapper_args__.
    # Since we only READ from this table, we use a composite approach.
    
    project_id = Column(String, primary_key=True)
    timestamp = Column(String, primary_key=True)  # Time-only TEXT e.g. "09:01:11"
    keystrokes = Column(Integer, nullable=True)
    mouse_distance = Column(Integer, nullable=True)
    active_window = Column(String, nullable=True)
    focus_score = Column(Integer, nullable=True)
    workload_score = Column(Integer, nullable=True)
    cognitive_load = Column(Integer, nullable=True)
    mental_state = Column(String, nullable=True)
    project = Column(String, nullable=True)
