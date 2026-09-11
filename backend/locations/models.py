from django.db import models
from django.conf import settings
import uuid


class Category(models.Model):
    """Category for locations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=10, default='📍')
    color = models.CharField(max_length=7, default='#0077B6')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Location(models.Model):
    """Location/Place model for tourist destinations."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='locations'
    )
    
    # Location data
    address = models.CharField(max_length=300)
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    
    # Media
    images = models.JSONField(default=list)  # List of image URLs
    
    # Stats
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0)
    reviews_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    saves_count = models.PositiveIntegerField(default=0)
    
    # Author
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='locations'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['rating', 'reviews_count']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return self.name
    
    def update_rating(self):
        """Update average rating from reviews."""
        reviews = self.reviews.filter(is_approved=True)
        if reviews.exists():
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
            self.rating = round(avg_rating, 1)
            self.reviews_count = reviews.count()
            self.save(update_fields=['rating', 'reviews_count'])


class LocationImage(models.Model):
    """Individual images for locations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='location_images'
    )
    image = models.ImageField(upload_to='locations/%Y/%m/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_primary', '-uploaded_at']
    
    def __str__(self):
        return f'{self.location.name} - {self.caption or "Image"}'


class SavedLocation(models.Model):
    """User saved locations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_locations'
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='saves'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'location']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.name} saved {self.location.name}'


class LikedLocation(models.Model):
    """User liked locations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='liked_locations'
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'location']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.name} liked {self.location.name}'


class NearbyService(models.Model):
    """Services near a location (hotels, restaurants, etc)."""
    SERVICE_TYPES = [
        ('hotel', 'Hotel'),
        ('restaurant', 'Restaurant'),
        ('guide', 'Tour Guide'),
        ('shop', 'Shop'),
        ('transport', 'Transport'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='nearby_services'
    )
    name = models.CharField(max_length=200)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    distance_km = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['service_type', 'distance_km']
    
    def __str__(self):
        return f'{self.name} near {self.location.name}'
