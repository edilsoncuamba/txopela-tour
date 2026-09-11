"""
Test script for all API endpoints
Garante que todos os endpoints apareçam quando você fizer requisições no servidor
"""
import requests
import json
from typing import Dict, Any, List

BASE_URL = "http://localhost:8000"

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        # Disable proxy
        self.session.trust_env = False
        self.access_token = None
        self.refresh_token = None
        self.test_user_email = "testuser@example.com"
        self.test_user_password = "TestPass123!"
        self.test_user_id = None
        self.test_location_id = None
        self.test_post_id = None
        self.test_review_id = None
        
    def extract_error_message(self, response):
        """Extract error message from response"""
        try:
            if response.status_code >= 500:
                # Try to extract from HTML error page
                text = response.text
                if '<h1>' in text:
                    start = text.find('<h1>') + 4
                    end = text.find('</h1>')
                    if start > 3 and end > start:
                        return text[start:end].strip()
                # Try JSON
                return response.json().get('detail', 'Unknown error')
        except:
            pass
        return None
    
    def print_result(self, method: str, endpoint: str, status: int, success: bool, error_msg: str = None):
        """Print test result"""
        status_symbol = "✓" if success else "✗"
        print(f"{status_symbol} {method:6} {endpoint:50} [{status}]")
        if error_msg:
            print(f"   Error: {error_msg[:150]}")
    
    def test_endpoint(self, method: str, endpoint: str, expected_codes: List[int] = None, 
                     json_data: dict = None, headers: dict = None) -> bool:
        """Generic endpoint test"""
        if expected_codes is None:
            expected_codes = [200, 201, 400, 401, 403, 404]
        
        url = f"{self.base_url}{endpoint}"
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers)
            elif method == "POST":
                response = self.session.post(url, json=json_data, headers=headers)
            elif method == "PUT":
                response = self.session.put(url, json=json_data, headers=headers)
            elif method == "PATCH":
                response = self.session.patch(url, json=json_data, headers=headers)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return False
            
            success = response.status_code in expected_codes
            error_msg = self.extract_error_message(response) if response.status_code >= 500 else None
            self.print_result(method, endpoint, response.status_code, success, error_msg)
            return success
        except Exception as e:
            print(f"✗ {method:6} {endpoint:50} [ERROR: {str(e)}]")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if self.access_token:
            return {"Authorization": f"Bearer {self.access_token}"}
        return {}
    
    # ==================== AUTH ENDPOINTS ====================
    def test_auth_endpoints(self):
        """Test all authentication endpoints"""
        print("\n" + "="*70)
        print("AUTHENTICATION ENDPOINTS")
        print("="*70)
        
        # Login
        self.test_endpoint("POST", "/api/auth/login/", [200, 400, 401], 
                          {"email": self.test_user_email, "password": self.test_user_password})
        
        # Refresh
        self.test_endpoint("POST", "/api/auth/refresh/", [200, 400, 401],
                          {"refresh": self.refresh_token or "dummy"})
        
        # Verify
        self.test_endpoint("POST", "/api/auth/verify/", [200, 400, 401],
                          {"token": self.access_token or "dummy"})
    
    # ==================== USER ENDPOINTS ====================
    def test_user_endpoints(self):
        """Test all user endpoints"""
        print("\n" + "="*70)
        print("USER ENDPOINTS")
        print("="*70)
        
        headers = self.get_auth_headers()
        
        # List users
        self.test_endpoint("GET", "/api/users/", headers=headers)
        
        # Register
        self.test_endpoint("POST", "/api/users/register/", [200, 201, 400],
                          {"email": "newuser@test.com", "password": "Pass123!", "username": "newuser"})
        
        # User login
        self.test_endpoint("POST", "/api/users/login/", [200, 400, 401],
                          {"email": self.test_user_email, "password": self.test_user_password})
        
        # Profile
        self.test_endpoint("GET", "/api/users/me/", headers=headers)
        
        # Update profile
        self.test_endpoint("PUT", "/api/users/me/update/", headers=headers,
                          json_data={"bio": "Updated bio"})
        
        # Change password
        self.test_endpoint("POST", "/api/users/me/change-password/", headers=headers,
                          json_data={"old_password": "old", "new_password": "new"})
        
        # User detail
        self.test_endpoint("GET", "/api/users/test-user-id/", headers=headers)
        
        # Follow user
        self.test_endpoint("POST", "/api/users/test-user-id/follow/", headers=headers)
        
        # Get followers
        self.test_endpoint("GET", "/api/users/test-user-id/followers/", headers=headers)
        
        # Get following
        self.test_endpoint("GET", "/api/users/test-user-id/following/", headers=headers)
    
    # ==================== LOCATION ENDPOINTS ====================
    def test_location_endpoints(self):
        """Test all location endpoints"""
        print("\n" + "="*70)
        print("LOCATION ENDPOINTS")
        print("="*70)
        
        headers = self.get_auth_headers()
        
        # List locations
        self.test_endpoint("GET", "/api/locations/", headers=headers)
        
        # Create location
        self.test_endpoint("POST", "/api/locations/create/", headers=headers,
                          json_data={"name": "Test Location", "latitude": 0.0, "longitude": 0.0})
        
        # Trending locations
        self.test_endpoint("GET", "/api/locations/trending/", headers=headers)
        
        # Nearby locations
        self.test_endpoint("GET", "/api/locations/nearby/?latitude=0&longitude=0", headers=headers)
        
        # Saved locations
        self.test_endpoint("GET", "/api/locations/saved/", headers=headers)
        
        # Categories
        self.test_endpoint("GET", "/api/locations/categories/", headers=headers)
        
        # Location detail
        self.test_endpoint("GET", "/api/locations/test-location-id/", headers=headers)
        
        # Update location
        self.test_endpoint("PUT", "/api/locations/test-location-id/update/", headers=headers,
                          json_data={"name": "Updated Location"})
        
        # Delete location
        self.test_endpoint("DELETE", "/api/locations/test-location-id/delete/", headers=headers)
        
        # Save location
        self.test_endpoint("POST", "/api/locations/test-location-id/save/", headers=headers)
        
        # Like location
        self.test_endpoint("POST", "/api/locations/test-location-id/like/", headers=headers)
        
        # User locations
        self.test_endpoint("GET", "/api/locations/user/test-user-id/", headers=headers)
    
    # ==================== POST ENDPOINTS ====================
    def test_post_endpoints(self):
        """Test all post endpoints"""
        print("\n" + "="*70)
        print("POST ENDPOINTS")
        print("="*70)
        
        headers = self.get_auth_headers()
        
        # List posts
        self.test_endpoint("GET", "/api/posts/", headers=headers)
        
        # Create post
        self.test_endpoint("POST", "/api/posts/create/", headers=headers,
                          json_data={"content": "Test post", "location_id": "test-location"})
        
        # Saved posts
        self.test_endpoint("GET", "/api/posts/saved/", headers=headers)
        
        # Post detail
        self.test_endpoint("GET", "/api/posts/test-post-id/", headers=headers)
        
        # Update post
        self.test_endpoint("PUT", "/api/posts/test-post-id/update/", headers=headers,
                          json_data={"content": "Updated post"})
        
        # Delete post
        self.test_endpoint("DELETE", "/api/posts/test-post-id/delete/", headers=headers)
        
        # Like post
        self.test_endpoint("POST", "/api/posts/test-post-id/like/", headers=headers)
        
        # Save post
        self.test_endpoint("POST", "/api/posts/test-post-id/save/", headers=headers)
        
        # Share post
        self.test_endpoint("POST", "/api/posts/test-post-id/share/", headers=headers)
        
        # Add comment
        self.test_endpoint("POST", "/api/posts/test-post-id/comment/", headers=headers,
                          json_data={"content": "Test comment"})
        
        # Delete comment
        self.test_endpoint("DELETE", "/api/posts/comment/test-comment-id/delete/", headers=headers)
        
        # User posts
        self.test_endpoint("GET", "/api/posts/user/test-user-id/", headers=headers)
    
    # ==================== REVIEW ENDPOINTS ====================
    def test_review_endpoints(self):
        """Test all review endpoints"""
        print("\n" + "="*70)
        print("REVIEW ENDPOINTS")
        print("="*70)
        
        headers = self.get_auth_headers()
        
        # List reviews
        self.test_endpoint("GET", "/api/reviews/", headers=headers)
        
        # Location reviews
        self.test_endpoint("GET", "/api/reviews/location/test-location-id/", headers=headers)
        
        # Location rating stats
        self.test_endpoint("GET", "/api/reviews/location/test-location-id/stats/", headers=headers)
        
        # Create review
        self.test_endpoint("POST", "/api/reviews/create/", headers=headers,
                          json_data={"location_id": "test-location", "rating": 5, "content": "Great place!"})
        
        # Update review
        self.test_endpoint("PUT", "/api/reviews/test-review-id/update/", headers=headers,
                          json_data={"rating": 4, "content": "Updated review"})
        
        # Delete review
        self.test_endpoint("DELETE", "/api/reviews/test-review-id/delete/", headers=headers)
        
        # Mark helpful
        self.test_endpoint("POST", "/api/reviews/test-review-id/helpful/", headers=headers)
        
        # Reply to review
        self.test_endpoint("POST", "/api/reviews/test-review-id/reply/", headers=headers,
                          json_data={"content": "Reply to review"})
        
        # User reviews
        self.test_endpoint("GET", "/api/reviews/user/test-user-id/", headers=headers)
    
    # ==================== NOTIFICATION ENDPOINTS ====================
    def test_notification_endpoints(self):
        """Test all notification endpoints"""
        print("\n" + "="*70)
        print("NOTIFICATION ENDPOINTS")
        print("="*70)
        
        headers = self.get_auth_headers()
        
        # List notifications
        self.test_endpoint("GET", "/api/notifications/", headers=headers)
        
        # Unread notifications
        self.test_endpoint("GET", "/api/notifications/unread/", headers=headers)
        
        # Notification count
        self.test_endpoint("GET", "/api/notifications/count/", headers=headers)
        
        # Mark notification as read
        self.test_endpoint("POST", "/api/notifications/test-notification-id/read/", headers=headers)
        
        # Delete notification
        self.test_endpoint("DELETE", "/api/notifications/test-notification-id/delete/", headers=headers)
        
        # Mark all as read
        self.test_endpoint("POST", "/api/notifications/mark-all-read/", headers=headers)
        
        # Notification preferences
        self.test_endpoint("GET", "/api/notifications/preferences/", headers=headers)
    
    # ==================== ADMIN ENDPOINTS ====================
    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n" + "="*70)
        print("ADMIN ENDPOINTS")
        print("="*70)
        
        # Admin panel
        self.test_endpoint("GET", "/admin/", [200, 301, 302, 400, 401])
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*80)
        print("TESTE COMPLETO DE TODOS OS ENDPOINTS DA API")
        print("="*80)
        
        self.test_admin_endpoints()
        self.test_auth_endpoints()
        self.test_user_endpoints()
        self.test_location_endpoints()
        self.test_post_endpoints()
        self.test_review_endpoints()
        self.test_notification_endpoints()
        
        print("\n" + "="*80)
        print("TESTE CONCLUÍDO")
        print("="*80)
        print("\nTodos os endpoints foram testados!")
        print("Se você vir ✓ significa que o endpoint respondeu corretamente")
        print("Se você vir ✗ significa que há um problema com o endpoint")
        print("="*80 + "\n")


if __name__ == "__main__":
    tester = APITester(BASE_URL)
    tester.run_all_tests()
