"""
Models for communities app.
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Community(models.Model):
    """Model for user communities/groups."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='communities/', blank=True, null=True)
    
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_communities'
    )
    members = models.ManyToManyField(
        User,
        related_name='communities'
    )
    
    members_count = models.PositiveIntegerField(default=0)
    is_private = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class CommunityPost(models.Model):
    """Model for posts in communities."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_posts'
    )
    
    content = models.TextField()
    image = models.ImageField(upload_to='community_posts/', blank=True, null=True)
    
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Post in {self.community.name}'


class CommunityComment(models.Model):
    """Model for comments on community posts."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_comments'
    )
    
    content = models.TextField()
    likes_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f'Comment by {self.author.name}'
