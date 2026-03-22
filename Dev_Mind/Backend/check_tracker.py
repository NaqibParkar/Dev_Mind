
import sys
import os
import time
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
from app.database import SessionLocal
from app import models

db = SessionLocal()
initial_count = db.query(models.ActivityLog).count()
print(f"Initial count: {initial_count}")
# Short sleep to fit in execution window
time.sleep(2)
new_count = db.query(models.ActivityLog).count()
print(f"New count: {new_count}")
if new_count > initial_count:
    print("Tracker is WORKING (Rows adding)")
else:
    print("Tracker is STALLED (No new rows)")
db.close()
