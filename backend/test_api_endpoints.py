"""
Test API endpoints with GET requests
Run: python manage.py shell < test_api_endpoints.py
"""
import requests
import json
from django.contrib.auth import get_user_model

User = get_user_model()

BASE_URL = "http://localhost:8000/api"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"✓ {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(response.text)

def test_endpoints():
    """Test various GET endpoints"""
    
    # Get a user token first
    print("\n🔐 Getting authentication token...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    
    if login_response.status_code != 200:
        print("❌ Login failed. Creating test user first...")
        # Try to create a test user
        try:
            user = User.objects.create_user(
                email="test@example.com",
                name="Test User",
                password="testpass123"
            )
            print(f"✓ Created test user: {user.email}")
        except:
            print("⚠️  Could not create test user")
        
        # Try login again
        login_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json={"email": "test@example.com", "password": "testpass123"}
        )
    
    if login_response.status_code == 200:
        token = login_response.json()['access']
        print(f"✓ Got token: {token[:20]}...")
    else:
        print("❌ Could not get token")
        token = None
    
    headers = {
        "Authorization": f"Bearer {token}" if token else "",
        "Content-Type": "application/json"
    }
    
    # Test endpoints
    endpoints = [
        ("GET /api/endpoints/", f"{BASE_URL}/endpoints/", "GET", None),
        ("GET /api/users/me/", f"{BASE_URL}/users/me/", "GET", None),
        ("GET /api/locations/", f"{BASE_URL}/locations/", "GET", None),
        ("GET /api/locations/categories/", f"{BASE_URL}/locations/categories/", "GET", None),
        ("GET /api/posts/", f"{BASE_URL}/posts/", "GET", None),
        ("GET /api/notifications/", f"{BASE_URL}/notifications/", "GET", None),
        ("GET /api/bookings/", f"{BASE_URL}/bookings/", "GET", None),
        ("GET /api/chat/", f"{BASE_URL}/chat/", "GET", None),
        ("GET /api/communities/", f"{BASE_URL}/communities/", "GET", None),
    ]
    
    print("\n\n📡 Testing endpoints...\n")
    
    for title, url, method, data in endpoints:
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=5)
            else:
                response = requests.post(url, json=data, headers=headers, timeout=5)
            
            print_response(title, response)
            
        except requests.exceptions.ConnectionError:
            print(f"\n❌ {title}")
            print("Connection refused - Backend not running?")
        except Exception as e:
            print(f"\n❌ {title}")
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_endpoints()
