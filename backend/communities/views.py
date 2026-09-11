"""
Views for communities app.
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Community, CommunityPost, CommunityComment
from .serializers import (
    CommunitySerializer,
    CommunityPostSerializer,
    CommunityCommentSerializer
)


class CommunityListView(generics.ListCreateAPIView):
    """List all communities or create a new one."""
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        community = serializer.save(creator=self.request.user)
        community.members.add(self.request.user)
        community.members_count = 1
        community.save()


class CommunityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a community."""
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'id'
    
    def perform_update(self, serializer):
        community = self.get_object()
        if community.creator != self.request.user:
            raise PermissionError('Only creator can update community.')
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.creator != self.request.user:
            raise PermissionError('Only creator can delete community.')
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_community(request, community_id):
    """Join a community."""
    community = get_object_or_404(Community, id=community_id)
    
    if community.members.filter(id=request.user.id).exists():
        return Response(
            {'error': 'Already a member.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    community.members.add(request.user)
    community.members_count += 1
    community.save()
    
    return Response(CommunitySerializer(community, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_community(request, community_id):
    """Leave a community."""
    community = get_object_or_404(Community, id=community_id)
    
    if not community.members.filter(id=request.user.id).exists():
        return Response(
            {'error': 'Not a member.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    community.members.remove(request.user)
    community.members_count = max(0, community.members_count - 1)
    community.save()
    
    return Response({'message': 'Left community.'})


class CommunityPostListView(generics.ListCreateAPIView):
    """List posts in a community or create a new post."""
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        community_id = self.kwargs.get('community_id')
        return CommunityPost.objects.filter(community_id=community_id)
    
    def perform_create(self, serializer):
        community_id = self.kwargs.get('community_id')
        community = get_object_or_404(Community, id=community_id)
        
        if not community.members.filter(id=self.request.user.id).exists():
            raise PermissionError('Must be a member to post.')
        
        post = serializer.save(author=self.request.user, community=community)
        community.posts.add(post)


class CommunityPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a community post."""
    queryset = CommunityPost.objects.all()
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'id'
    
    def perform_update(self, serializer):
        post = self.get_object()
        if post.author != self.request.user:
            raise PermissionError('Only author can update post.')
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionError('Only author can delete post.')
        instance.delete()


class CommunityCommentListView(generics.ListCreateAPIView):
    """List comments on a post or create a new comment."""
    serializer_class = CommunityCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return CommunityComment.objects.filter(post_id=post_id)
    
    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(CommunityPost, id=post_id)
        
        comment = serializer.save(author=self.request.user, post=post)
        post.comments_count += 1
        post.save()


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, comment_id):
    """Delete a comment."""
    comment = get_object_or_404(CommunityComment, id=comment_id)
    
    if comment.author != request.user:
        return Response(
            {'error': 'Only author can delete comment.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    post = comment.post
    post.comments_count = max(0, post.comments_count - 1)
    post.save()
    
    comment.delete()
    return Response({'message': 'Comment deleted.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_communities(request):
    """Get communities the user is a member of."""
    communities = request.user.communities.all()
    serializer = CommunitySerializer(communities, many=True, context={'request': request})
    return Response(serializer.data)
