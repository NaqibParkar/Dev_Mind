import requests
import sys

BASE_URL = "http://localhost:8000"

def test_root():
    try:
        r = requests.get(f"{BASE_URL}/")
        if r.status_code == 200:
            print("ROOT: OK")
        else:
            print(f"ROOT: FAILED ({r.status_code})")
    except Exception as e:
        print(f"ROOT: FAILED ({e})")

def test_settings():
    try:
        r = requests.get(f"{BASE_URL}/settings")
        if r.status_code == 200:
            print("GET SETTINGS: OK")
        else:
            print(f"GET SETTINGS: FAILED ({r.status_code})")
            
        # Update
        data = r.json()
        data['smartBreaks'] = False
        r2 = requests.put(f"{BASE_URL}/settings", json=data)
        if r2.status_code == 200 and r2.json()['smartBreaks'] == False:
             print("UPDATE SETTINGS: OK")
        else:
             print(f"UPDATE SETTINGS: FAILED ({r2.status_code}) - {r2.text}")

    except Exception as e:
        print(f"SETTINGS: FAILED ({e})")

def test_projects():
    try:
        # Create
        new_proj = {
            "id": "test-123", # client generated ID
            "name": "API Test Project",
            "description": "Created via verification script",
            "color": "bg-red-500",
            "status": "Active"
        }
        r = requests.post(f"{BASE_URL}/projects", json=new_proj)
        if r.status_code == 200:
            print("CREATE PROJECT: OK")
        else:
            print(f"CREATE PROJECT: FAILED ({r.status_code}) {r.text}")
            
        # List
        r2 = requests.get(f"{BASE_URL}/projects")
        projects = r2.json()
        found = any(p['id'] == 'test-123' for p in projects)
        if found:
            print("LIST PROJECTS: OK")
        else:
            print("LIST PROJECTS: FAILED (Project not found)")
            
    except Exception as e:
        print(f"PROJECTS: FAILED ({e})")

if __name__ == "__main__":
    print(f"Testing API at {BASE_URL}...")
    test_root()
    test_settings()
    test_projects()
