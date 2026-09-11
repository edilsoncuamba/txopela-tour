from rest_framework import serializers
from .models import Post, Like, Comment, SavedPost, Share
from users.serializers import UserListSerializer


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""
    author = UserListSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'likes_count', 'created_at']


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for post list (minimal data)."""
    author = UserListSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'description', 'image', 'external_link',
            'location', 'likes_count', 'comments_count', 'shares_count',
            'saves_count', 'is_liked', 'is_saved', 'comments', 'created_at'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False


class PostDetailSerializer(serializers.ModelSerializer):
    """Serializer for post details."""
    author = UserListSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'description', 'image', 'external_link',
            'location', 'likes_count', 'comments_count', 'shares_count',
            'saves_count', 'is_liked', 'is_saved', 'comments',
            'created_at', 'updated_at'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts."""
    
    class Meta:
        model = Post
        fields = ['description', 'image', 'external_link', 'location']
    
    def create(self, validated_data):
        post = Post.objects.create(
            author=self.context['request'].user,
            **validated_data
        )
        
        # Update user's post count
        user = self.context['request'].user
        user.posts_count += 1
        user.save(update_fields=['posts_count'])
        
        return post


class SavedPostSerializer(serializers.ModelSerializer):
    """Serializer for saved posts."""
    post = PostListSerializer(read_only=True)
    
    class Meta:
        model = SavedPost
        fields = ['id', 'post', 'created_at']
