from django.db import models
from django.conf import settings
import uuid


class Notification(models.Model):
    """User notifications."""
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('save', 'Save'),
        ('follow', 'Follow'),
        ('approval', 'Approval'),
        ('mention', 'Mention'),
        ('reply', 'Reply'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_notifications',
        null=True,
        blank=True
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    # Related objects
    location = models.ForeignKey(
        'locations.Location',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    review = models.ForeignKey(
        'reviews.Review',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    
    # Message
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f'{self.notification_type} - {self.recipient.name}'
    
    def mark_as_read(self):
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(models.Model):
    """User notification preferences."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Email notifications
    email_likes = models.BooleanField(default=True)
    email_comments = models.BooleanField(default=True)
    email_saves = models.BooleanField(default=False)
    email_follows = models.BooleanField(default=True)
    email_approvals = models.BooleanField(default=True)
    
    # Push notifications
    push_likes = models.BooleanField(default=True)
    push_comments = models.BooleanField(default=True)
    push_saves = models.BooleanField(default=True)
    push_follows = models.BooleanField(default=True)
    push_approvals = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'notification preferences'
    
    def __str__(self):
        return f'Preferences for {self.user.name}'
