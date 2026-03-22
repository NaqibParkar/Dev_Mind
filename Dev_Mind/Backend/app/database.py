from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Local SQLite Database (Fallback for stability)
# SQLALCHEMY_DATABASE_URL = "sqlite:///./devmind.db"

# Neon PostgreSQL Database
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_lcQCqBKU3n5F@ep-rapid-voice-a1jyo0em-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True # Helps with dropped connections in serverless environments
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
