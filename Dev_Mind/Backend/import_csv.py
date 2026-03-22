import pandas as pd
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from datetime import datetime
import sys
import os

def import_csv(file_path):
    print(f"Reading file: {file_path}")
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    db = SessionLocal()
    
    # Map CSV columns to Database columns
    # Expected CSV columns: timestamp, focus_score, cognitive_load, keystrokes, mouse_distance, etc.
    # Adjust valid_columns based on your actual CSV header
    
    count = 0
    for index, row in df.iterrows():
        try:
            # Parse timestamp - adjust format if necessary
            # Assuming ISO format or standard date string
            ts_str = str(row.get('timestamp', datetime.utcnow()))
            try:
                ts = pd.to_datetime(ts_str).to_pydatetime()
            except:
                ts = datetime.utcnow()

            log = models.ActivityLog(
                timestamp=ts,
                focus_score=int(row.get('focus_score', 0)),
                cognitive_load=float(row.get('cognitive_load', 0)),
                keystrokes=int(row.get('keystrokes', 0)),
                mouse_distance=float(row.get('mouse_distance', 0)),
                active_window=str(row.get('active_window', 'Imported')),
                # project_id can be added if your CSV has it, or valid default
                project_id=str(row.get('project_id', None)) if pd.notna(row.get('project_id', None)) else None
            )
            db.add(log)
            count += 1
            if count % 100 == 0:
                print(f"Processed {count} rows...")
        except Exception as row_err:
            print(f"Skipping row {index}: {row_err}")

    try:
        db.commit()
        print(f"Successfully imported {count} records.")
    except Exception as e:
        db.rollback()
        print(f"Error committing to database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        # Default filename if not provided
        csv_file = "database/analytics_hourly_2weeks.csv"
    
    if os.path.exists(csv_file):
        import_csv(csv_file)
    else:
        print(f"File not found: {csv_file}")
        print("Usage: python import_csv.py <path_to_csv>")
