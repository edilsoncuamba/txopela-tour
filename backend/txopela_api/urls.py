"""
URL configuration for txopela_api project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from docs_view import endpoints_list, docs_page

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/endpoints/', endpoints_list, name='endpoints_list'),
    path('api/doc/', docs_page, name='docs_page'),
    
    # JWT Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API Endpoints
    path('api/users/', include('users.urls')),
    path('api/locations/', include('locations.urls')),
    path('api/locals/', include('locations.urls')),   # alias usado pelo frontend e OpenAPI remoto
    path('api/reviews/', include('reviews.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/communities/', include('communities.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
