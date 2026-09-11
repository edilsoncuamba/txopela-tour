#!/usr/bin/env python
"""
Quick API test script - Run: python quick_test.py
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test(name, url, method="GET", data=None, token=None):
    """Test an endpoint"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            r = requests.post(url, json=data, headers=headers, timeout=5)
        else:
            r = requests.request(method, url, json=data, headers=headers, timeout=5)
        
        status = "✓" if r.status_code < 400 else "✗"
        print(f"{status} {name}: {r.status_code}")
        
        if r.status_code < 400:
            try:
                data = r.json()
                if isinstance(data, dict):
                    if 'access' in data:
                        return data['access']
                    if 'results' in data:
                        print(f"  → {len(data['results'])} items")
                    elif isinstance(data, dict) and len(data) > 0:
                        print(f"  → {list(data.keys())[:3]}")
            except:
                pass
        else:
            print(f"  Error: {r.text[:100]}")
        
        return None
    except requests.exceptions.ConnectionError:
        print(f"✗ {name}: Connection refused (backend not running?)")
        return None
    except Exception as e:
        print(f"✗ {name}: {str(e)}")
        return None

print("\n🌍 Txopela API - Quick Test\n")

# Test endpoints list
print("📋 API Documentation:")
test("GET /api/endpoints/", f"{BASE_URL}/endpoints/")
test("GET /api/doc/", f"{BASE_URL}/doc/")

print("\n🔐 Authentication:")
token = test("POST /api/auth/login/", f"{BASE_URL}/auth/login/", "POST", 
             {"email": "test@example.com", "password": "testpass123"})

print("\n👤 Users:")
test("GET /api/users/me/", f"{BASE_URL}/users/me/", token=token)

print("\n📍 Locations:")
test("GET /api/locations/", f"{BASE_URL}/locations/", token=token)
test("GET /api/locations/categories/", f"{BASE_URL}/locations/categories/", token=token)

print("\n📝 Posts:")
test("GET /api/posts/", f"{BASE_URL}/posts/", token=token)

print("\n🔔 Notifications:")
test("GET /api/notifications/", f"{BASE_URL}/notifications/", token=token)

print("\n📅 Bookings:")
test("GET /api/bookings/", f"{BASE_URL}/bookings/", token=token)

print("\n💬 Chat:")
test("GET /api/chat/", f"{BASE_URL}/chat/", token=token)

print("\n👥 Communities:")
test("GET /api/communities/", f"{BASE_URL}/communities/", token=token)

print("\n✅ Test complete!\n")
