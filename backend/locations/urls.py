from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    
    # Locations
    path('', views.LocationListView.as_view(), name='location-list'),
    path('create/', views.LocationCreateView.as_view(), name='location-create'),
    path('trending/', views.get_trending_locations, name='location-trending'),
    path('nearby/', views.get_nearby_locations, name='location-nearby'),
    path('saved/', views.SavedLocationsView.as_view(), name='saved-locations'),
    
    # Single location
    path('<str:id>/', views.LocationDetailView.as_view(), name='location-detail'),
    path('<str:id>/update/', views.LocationUpdateView.as_view(), name='location-update'),
    path('<str:id>/delete/', views.LocationDeleteView.as_view(), name='location-delete'),
    path('<str:id>/save/', views.toggle_save_location, name='location-save'),
    path('<str:id>/like/', views.toggle_like_location, name='location-like'),
    
    # User locations
    path('user/<str:user_id>/', views.UserLocationsView.as_view(), name='user-locations'),
]
