import requests
import json

url = "http://localhost:8000/auth/login"
payload = {
    "deviceId": "test-device-123",
    "username": "1234",
    "password": "1234"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
