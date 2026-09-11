"""
Serializers for communities app.
"""

from rest_framework import serializers
from .models import Community, CommunityPost, CommunityComment
from users.serializers import UserListSerializer


class CommunitySerializer(serializers.ModelSerializer):
    """Serializer for communities."""
    creator = UserListSerializer(read_only=True)
    members = UserListSerializer(many=True, read_only=True)
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'image', 'creator', 'members', 'members_count', 'is_private', 'is_member', 'created_at']
        read_only_fields = ['id', 'creator', 'members_count', 'created_at']
    
    def get_is_member(self, obj):
        """Check if current user is a member."""
        request = self.context.get('request')
        if request and request.user:
            return obj.members.filter(id=request.user.id).exists()
        return False


class CommunityCommentSerializer(serializers.ModelSerializer):
    """Serializer for community comments."""
    author = UserListSerializer(read_only=True)
    
    class Meta:
        model = CommunityComment
        fields = ['id', 'post', 'author', 'content', 'likes_count', 'created_at']
        read_only_fields = ['id', 'author', 'likes_count', 'created_at']


class CommunityPostSerializer(serializers.ModelSerializer):
    """Serializer for community posts."""
    author = UserListSerializer(read_only=True)
    comments = CommunityCommentSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityPost
        fields = ['id', 'community', 'author', 'content', 'image', 'likes_count', 'comments_count', 'comments', 'is_liked', 'created_at']
        read_only_fields = ['id', 'author', 'likes_count', 'comments_count', 'created_at']
    
    def get_is_liked(self, obj):
        """Check if current user liked the post."""
        request = self.context.get('request')
        if request and request.user:
            # TODO: Implement like tracking
            return False
        return False
