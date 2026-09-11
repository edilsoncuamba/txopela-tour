from django.urls import path
from . import views, oauth_views

urlpatterns = [
    # Authentication
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('register/', views.UserRegisterView.as_view(), name='user-register'),
    
    # Email Verification
    path('send-otp/', views.SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    
    # Profile
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/update/', views.UserUpdateView.as_view(), name='user-update'),
    path('me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # User actions
    path('<str:id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('<str:id>/follow/', views.follow_user, name='follow-user'),
    path('<str:id>/followers/', views.get_followers, name='user-followers'),
    path('<str:id>/following/', views.get_following, name='user-following'),
    
    # OAuth
    path('oauth/google/callback/', oauth_views.google_oauth_callback, name='google-oauth-callback'),
    path('oauth/github/callback/', oauth_views.github_oauth_callback, name='github-oauth-callback'),
    
    # List
    path('', views.UserListView.as_view(), name='user-list'),
]
