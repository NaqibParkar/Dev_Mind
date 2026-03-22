
import requests
import json

url = "http://localhost:8000/auth/login"
payload = {
    "email": "demo@gmail.com",
    "password": "password"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending POST to {url} with {payload}")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
