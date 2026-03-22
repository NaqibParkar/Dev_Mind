
import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

try:
    from app.database import SessionLocal
    from app.models import User
    from app.routers.auth import get_password_hash
except ImportError:
    try:
        from database import SessionLocal
        from models import User
        from routers.auth import get_password_hash
    except ImportError:
        print("Import Error")
        sys.exit(1)

def reset_password(email, new_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User found: {user.email}")
            # Force set verification to True just in case
            user.is_verified = True
            # Update password
            user.hashed_password = get_password_hash(new_password)
            db.commit()
            print(f"Password has been reset to '{new_password}' for user {email}")
        else:
            print(f"User {email} not found. Creating it...")
            new_user = User(
                email=email,
                hashed_password=get_password_hash(new_password),
                full_name="Demo User",
                is_verified=True
            )
            db.add(new_user)
            db.commit()
            print(f"User {email} created with password '{new_password}'")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password("demo@gmail.com", "password")
