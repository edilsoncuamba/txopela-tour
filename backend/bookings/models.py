"""
Models for bookings/reservations app.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class Booking(models.Model):
    """Model for location bookings/reservations."""
    
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('confirmed', 'Confirmada'),
        ('cancelled', 'Cancelada'),
        ('completed', 'Concluída'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    
    # Booking details
    check_in = models.DateTimeField()
    check_out = models.DateTimeField()
    guests_count = models.PositiveIntegerField(default=1)
    special_requests = models.TextField(blank=True)
    
    # Pricing
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['location', 'user', 'check_in', 'check_out']
    
    def __str__(self):
        return f'Booking {self.id} - {self.location.name}'
    
    def calculate_total_price(self):
        """Calculate total price based on nights and price per night."""
        nights = (self.check_out - self.check_in).days
        if nights <= 0:
            nights = 1
        self.total_price = self.price_per_night * nights
        return self.total_price
    
    def is_upcoming(self):
        """Check if booking is in the future."""
        return self.check_in > timezone.now()
    
    def is_past(self):
        """Check if booking is in the past."""
        return self.check_out < timezone.now()


class BookingReview(models.Model):
    """Model for reviews of completed bookings."""
    
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='booking_reviews'
    )
    
    # Review content
    rating = models.PositiveIntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Review for {self.booking.location.name}'


class BookingAvailability(models.Model):
    """Model for location availability calendar."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.CASCADE,
        related_name='availability'
    )
    
    # Date range
    date = models.DateField()
    is_available = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['date']
        unique_together = ['location', 'date']
    
    def __str__(self):
        return f'{self.location.name} - {self.date}'
