from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Post, Like, Comment, SavedPost, Share
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateSerializer,
    CommentSerializer,
    SavedPostSerializer
)


class PostListView(generics.ListAPIView):
    """List all posts (feed)."""
    serializer_class = PostListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Post.objects.select_related('author').prefetch_related('comments')


class PostCreateView(generics.CreateAPIView):
    """Create a new post."""
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class PostDetailView(generics.RetrieveAPIView):
    """Get post details."""
    queryset = Post.objects.all()
    serializer_class = PostDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'


class PostUpdateView(generics.UpdateAPIView):
    """Update a post."""
    queryset = Post.objects.all()
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)


class PostDeleteView(generics.DestroyAPIView):
    """Delete a post."""
    queryset = Post.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)
    
    def perform_destroy(self, instance):
        # Decrement user's post count
        user = instance.author
        user.posts_count = max(0, user.posts_count - 1)
        user.save(update_fields=['posts_count'])
        instance.delete()


class UserPostsView(generics.ListAPIView):
    """Get posts by a specific user."""
    serializer_class = PostListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        try:
            return Post.objects.filter(author_id=user_id).select_related('author')
        except Exception:
            # Return empty queryset if user_id is invalid
            return Post.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like_post(request, post_id):
    """Like or unlike a post."""
    post = get_object_or_404(Post, id=post_id)
    
    like, created = Like.objects.get_or_create(
        user=request.user,
        post=post
    )
    
    if not created:
        like.delete()
        post.likes_count = max(0, post.likes_count - 1)
        message = 'Post unliked.'
        liked = False
    else:
        post.likes_count += 1
        message = 'Post liked.'
        liked = True
    
    post.save(update_fields=['likes_count'])
    return Response({'message': message, 'liked': liked, 'likes_count': post.likes_count})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_comment(request, post_id):
    """Add a comment to a post."""
    post = get_object_or_404(Post, id=post_id)
    
    content = request.data.get('content')
    if not content:
        return Response(
            {'error': 'Content is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    comment = Comment.objects.create(
        post=post,
        author=request.user,
        content=content
    )
    
    post.comments_count += 1
    post.save(update_fields=['comments_count'])
    
    serializer = CommentSerializer(comment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, comment_id):
    """Delete a comment."""
    comment = get_object_or_404(Comment, id=comment_id)
    
    if comment.author != request.user:
        return Response(
            {'error': 'You can only delete your own comments.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    post = comment.post
    post.comments_count = max(0, post.comments_count - 1)
    post.save(update_fields=['comments_count'])
    
    comment.delete()
    return Response({'message': 'Comment deleted.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_save_post(request, post_id):
    """Save or unsave a post."""
    post = get_object_or_404(Post, id=post_id)
    
    saved, created = SavedPost.objects.get_or_create(
        user=request.user,
        post=post
    )
    
    if not created:
        saved.delete()
        post.saves_count = max(0, post.saves_count - 1)
        message = 'Post unsaved.'
    else:
        post.saves_count += 1
        message = 'Post saved.'
    
    post.save(update_fields=['saves_count'])
    return Response({'message': message, 'saved': created, 'saves_count': post.saves_count})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def share_post(request, post_id):
    """Share a post."""
    post = get_object_or_404(Post, id=post_id)
    
    share, created = Share.objects.get_or_create(
        user=request.user,
        post=post
    )
    
    if created:
        post.shares_count += 1
        post.save(update_fields=['shares_count'])
        message = 'Post shared.'
    else:
        message = 'Already shared.'
    
    return Response({'message': message, 'shares_count': post.shares_count})


class SavedPostsView(generics.ListAPIView):
    """Get user's saved posts."""
    serializer_class = SavedPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedPost.objects.filter(
            user=self.request.user
        ).select_related('post', 'post__author')
