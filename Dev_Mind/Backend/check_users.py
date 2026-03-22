from sqlalchemy import create_engine
from app.models import User
from sqlalchemy.orm import sessionmaker
import traceback

# Using sslmode=require for better stability
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_lcQCqBKU3n5F@ep-rapid-voice-a1jyo0em-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def check_users():
    print(f"Connecting to: {SQLALCHEMY_DATABASE_URL}")
    # ADDED pool_pre_ping=True to handle disconnects
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"- {u.email} (ID: {u.id})")
            
        if not users:
            print("No users found! You need to seed the database.")
    except Exception as e:
        print("FULL ERROR TRACEBACK:")
        traceback.print_exc()
        print(f"Error Report: {e}")
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
