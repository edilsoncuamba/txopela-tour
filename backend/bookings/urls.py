"""
URLs for bookings app.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Bookings
    path('', views.BookingListView.as_view(), name='booking-list'),
    path('create/', views.BookingCreateView.as_view(), name='booking-create'),
    path('<str:id>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('<str:id>/confirm/', views.confirm_booking, name='booking-confirm'),
    path('<str:id>/cancel/', views.cancel_booking, name='booking-cancel'),
    
    # Booking reviews
    path('<str:booking_id>/review/', views.BookingReviewCreateView.as_view(), name='booking-review-create'),
    
    # Availability
    path('location/<str:location_id>/availability/', views.BookingAvailabilityView.as_view(), name='booking-availability'),
    
    # Filters
    path('upcoming/', views.get_upcoming_bookings, name='upcoming-bookings'),
    path('past/', views.get_past_bookings, name='past-bookings'),
]
