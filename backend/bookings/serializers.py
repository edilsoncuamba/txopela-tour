"""
Serializers for bookings app.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Booking, BookingReview, BookingAvailability
from locations.serializers import LocationListSerializer
from users.serializers import UserListSerializer


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for booking details."""
    location = LocationListSerializer(read_only=True)
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'location', 'user', 'check_in', 'check_out',
            'guests_count', 'special_requests', 'price_per_night',
            'total_price', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_price']


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings."""
    location_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'location_id', 'check_in', 'check_out', 'guests_count',
            'special_requests', 'price_per_night'
        ]
    
    def validate(self, attrs):
        """Validate booking dates."""
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        
        if check_in >= check_out:
            raise serializers.ValidationError(
                'Check-out date must be after check-in date.'
            )
        
        if check_in < timezone.now():
            raise serializers.ValidationError(
                'Check-in date cannot be in the past.'
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create booking and calculate total price."""
        location_id = validated_data.pop('location_id')
        booking = Booking.objects.create(
            location_id=location_id,
            **validated_data
        )
        booking.calculate_total_price()
        booking.save()
        return booking


class BookingReviewSerializer(serializers.ModelSerializer):
    """Serializer for booking reviews."""
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = BookingReview
        fields = ['id', 'booking', 'user', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class BookingAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for booking availability."""
    
    class Meta:
        model = BookingAvailability
        fields = ['id', 'location', 'date', 'is_available', 'price']
