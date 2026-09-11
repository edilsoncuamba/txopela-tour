"""
Models for chat app.
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Conversation(models.Model):
    """Model for 1-to-1 conversations."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name='conversations')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f'Conversation {self.id}'
    
    def get_other_user(self, user):
        """Get the other participant in the conversation."""
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    """Model for chat messages."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f'Message from {self.sender.name}'
