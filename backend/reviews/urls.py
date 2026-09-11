from django.urls import path
from . import views

urlpatterns = [
    # Reviews list
    path('', views.ReviewListView.as_view(), name='review-list'),
    
    # Reviews for a location
    path('location/<str:location_id>/', views.ReviewListView.as_view(), name='location-reviews'),
    path('location/<str:location_id>/stats/', views.get_location_rating_stats, name='location-rating-stats'),
    
    # Create/Update/Delete
    path('create/', views.ReviewCreateView.as_view(), name='review-create'),
    path('<str:id>/update/', views.ReviewUpdateView.as_view(), name='review-update'),
    path('<str:id>/delete/', views.ReviewDeleteView.as_view(), name='review-delete'),
    path('<str:review_id>/helpful/', views.toggle_helpful, name='review-helpful'),
    path('<str:review_id>/reply/', views.reply_to_review, name='review-reply'),
    
    # User reviews
    path('user/<str:user_id>/', views.UserReviewsView.as_view(), name='user-reviews'),
]
