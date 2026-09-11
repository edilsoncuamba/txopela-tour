from django.db import models
from django.conf import settings
import uuid


class Review(models.Model):
    """Reviews for locations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['location', 'user']  # One review per user per location
        indexes = [
            models.Index(fields=['location', 'is_approved']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f'{self.user.name} - {self.location.name} ({self.rating}★)'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update location rating
        self.location.update_rating()


class ReviewImage(models.Model):
    """Images attached to reviews."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='reviews/%Y/%m/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f'Image for {self.review}'


class ReviewHelpful(models.Model):
    """Track helpful votes on reviews."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='helpful_votes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='helpful_reviews'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.name} found {self.review} helpful'


class ReviewReply(models.Model):
    """Replies to reviews (for business owners)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.OneToOneField(
        Review,
        on_delete=models.CASCADE,
        related_name='reply'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_replies'
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'review replies'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Reply to {self.review}'
