"""
Admin configuration for communities app.
"""

from django.contrib import admin
from .models import Community, CommunityPost, CommunityComment


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator', 'members_count', 'is_private', 'created_at']
    list_filter = ['is_private', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['members']


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ['id', 'community', 'author', 'likes_count', 'comments_count', 'created_at']
    list_filter = ['community', 'created_at']
    search_fields = ['content', 'author__email']


@admin.register(CommunityComment)
class CommunityCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'author', 'likes_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__email']
