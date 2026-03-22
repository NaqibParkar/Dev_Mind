from app.database import engine
from app import models

def create_table():
    print("Creating ActivityFeature table...")
    # This will only create tables that don't exist
    models.Base.metadata.create_all(bind=engine)
    print("Table creation logic executed.")

if __name__ == "__main__":
    create_table()
