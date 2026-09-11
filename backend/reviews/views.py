from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Review, ReviewHelpful, ReviewReply
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewListSerializer,
    ReviewReplyCreateSerializer
)


class ReviewListView(generics.ListAPIView):
    """List reviews (all or for a specific location)."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        location_id = self.kwargs.get('location_id')
        
        if location_id:
            try:
                # Get reviews for a specific location
                return Review.objects.filter(
                    location_id=location_id,
                    is_approved=True
                ).select_related('user', 'reply', 'reply__user')
            except Exception:
                # Return empty queryset if location_id is invalid
                return Review.objects.none()
        else:
            # Get all approved reviews
            return Review.objects.filter(
                is_approved=True
            ).select_related('user', 'location', 'reply', 'reply__user').order_by('-created_at')


class ReviewCreateView(generics.CreateAPIView):
    """Create a new review."""
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class ReviewUpdateView(generics.UpdateAPIView):
    """Update a review."""
    queryset = Review.objects.all()
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)


class ReviewDeleteView(generics.DestroyAPIView):
    """Delete a review."""
    queryset = Review.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)
    
    def perform_destroy(self, instance):
        location = instance.location
        instance.delete()
        location.update_rating()


class UserReviewsView(generics.ListAPIView):
    """Get reviews by a user."""
    serializer_class = ReviewListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        try:
            return Review.objects.filter(
                user_id=user_id,
                is_approved=True
            ).select_related('user')
        except Exception:
            # Return empty queryset if user_id is invalid
            return Review.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_helpful(request, review_id):
    """Mark a review as helpful or unmark it."""
    review = get_object_or_404(Review, id=review_id, is_approved=True)
    
    helpful, created = ReviewHelpful.objects.get_or_create(
        review=review,
        user=request.user
    )
    
    if not created:
        helpful.delete()
        message = 'Review marked as not helpful.'
    else:
        message = 'Review marked as helpful.'
    
    return Response({
        'message': message,
        'helpful_count': review.helpful_votes.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reply_to_review(request, review_id):
    """Reply to a review (for business owners or location authors)."""
    review = get_object_or_404(Review, id=review_id, is_approved=True)
    
    # Check if user can reply (location author or business owner)
    location = review.location
    if request.user != location.author and request.user.type != 'business':
        return Response(
            {'error': 'You do not have permission to reply to this review.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if reply already exists
    if hasattr(review, 'reply'):
        return Response(
            {'error': 'A reply already exists for this review.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = ReviewReplyCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save(review=review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_location_rating_stats(request, location_id):
    """Get rating statistics for a location."""
    from locations.models import Location
    try:
        location = get_object_or_404(Location, id=location_id, status='approved')
    except Exception:
        # Return empty stats if location_id is invalid
        return Response({
            'average': 0,
            'total': 0,
            'distribution': {i: 0 for i in range(1, 6)}
        })
    
    reviews = Review.objects.filter(location=location, is_approved=True)
    total = reviews.count()
    
    if total == 0:
        return Response({
            'average': 0,
            'total': 0,
            'distribution': {i: 0 for i in range(1, 6)}
        })
    
    distribution = {}
    for i in range(1, 6):
        count = reviews.filter(rating=i).count()
        distribution[i] = {
            'count': count,
            'percentage': round((count / total) * 100, 1)
        }
    
    return Response({
        'average': float(location.rating),
        'total': total,
        'distribution': distribution
    })
