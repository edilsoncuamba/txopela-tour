"""
Admin configuration for bookings app.
"""

from django.contrib import admin
from .models import Booking, BookingReview, BookingAvailability


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'location', 'user', 'check_in', 'check_out', 'status', 'total_price']
    list_filter = ['status', 'created_at']
    search_fields = ['location__name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(BookingReview)
class BookingReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['booking__location__name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(BookingAvailability)
class BookingAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['id', 'location', 'date', 'is_available', 'price']
    list_filter = ['is_available', 'date']
    search_fields = ['location__name']
    readonly_fields = ['id']
