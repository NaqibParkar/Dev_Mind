from app.database import SessionLocal
from app.models import Project

db = SessionLocal()
projects = db.query(Project).all()
print(f"Found {len(projects)} projects:")
for p in projects:
    print(f"- ID: {p.id}, Name: {p.name}, Status: {p.status}")
db.close()
