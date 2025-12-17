"""
Test script for PIN-based authentication

Usage:
    python test_auth.py
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def test_login():
    """Test login with deviceId and PIN"""
    print("\n=== Testing Login ===")
    
    payload = {
        "deviceId": "test-device-123",
        "username": "1234",
        "password": "1234"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    return None

def test_me(token):
    """Test getting current user with token"""
    print("\n=== Testing /auth/me ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_logout(token):
    """Test logout"""
    print("\n=== Testing Logout ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_invalid_credentials():
    """Test login with mismatched username and password"""
    print("\n=== Testing Invalid Credentials (username != password) ===")
    
    payload = {
        "deviceId": "test-device-123",
        "username": "1234",
        "password": "5678"  # Different from username
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def main():
    print("=" * 50)
    print("PIN-Based Authentication Test")
    print("=" * 50)
    
    # Test invalid credentials
    test_invalid_credentials()
    
    # Test valid login
    token = test_login()
    
    if token:
        # Test getting current user
        test_me(token)
        
        # Test logout
        test_logout(token)
        
        # Verify token is invalidated
        print("\n=== Testing /auth/me after logout (should fail) ===")
        test_me(token)
    
    print("\n" + "=" * 50)
    print("Tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    main()
