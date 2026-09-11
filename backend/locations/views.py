from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count
from django_filters.rest_framework import DjangoFilterBackend

from .models import Location, Category, SavedLocation, LikedLocation
from .serializers import (
    LocationListSerializer,
    LocationDetailSerializer,
    LocationCreateSerializer,
    CategorySerializer,
    SavedLocationSerializer
)


class CategoryListView(generics.ListAPIView):
    """List all categories."""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class LocationListView(generics.ListAPIView):
    """List all approved locations with filtering."""
    serializer_class = LocationListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug']
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['rating', 'reviews_count', 'created_at', 'likes_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Location.objects.filter(status='approved')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search)
            )
        
        # Filter by rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        return queryset.select_related('category', 'author')


class LocationDetailView(generics.RetrieveAPIView):
    """Get location details."""
    queryset = Location.objects.filter(status='approved')
    serializer_class = LocationDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'


class LocationCreateView(generics.CreateAPIView):
    """Create a new location."""
    serializer_class = LocationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        location = serializer.save(author=self.request.user)
        
        # Increment user's post count
        user = self.request.user
        user.posts_count += 1
        user.save(update_fields=['posts_count'])
        
        # TODO: Broadcast to WebSocket when channels is installed
        # try:
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(
        #         'locations',
        #         {
        #             'type': 'location_created',
        #             'data': LocationDetailSerializer(location).data,
        #             'timestamp': location.created_at.isoformat(),
        #             'userId': str(self.request.user.id),
        #         }
        #     )
        # except Exception as e:
        #     print(f"Error broadcasting location_created: {e}")


class LocationUpdateView(generics.UpdateAPIView):
    """Update a location."""
    queryset = Location.objects.all()
    serializer_class = LocationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Location.objects.filter(author=self.request.user)
    
    def perform_update(self, serializer):
        location = serializer.save()
        
        # TODO: Broadcast to WebSocket when channels is installed
        # try:
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(
        #         'locations',
        #         {
        #             'type': 'location_updated',
        #             'data': LocationDetailSerializer(location).data,
        #             'timestamp': location.updated_at.isoformat() if hasattr(location, 'updated_at') else location.created_at.isoformat(),
        #             'userId': str(self.request.user.id),
        #         }
        #     )
        # except Exception as e:
        #     print(f"Error broadcasting location_updated: {e}")


class LocationDeleteView(generics.DestroyAPIView):
    """Delete a location."""
    queryset = Location.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Location.objects.filter(author=self.request.user)
    
    def perform_destroy(self, instance):
        location_id = instance.id
        
        # Decrement user's post count
        user = instance.author
        user.posts_count = max(0, user.posts_count - 1)
        user.save(update_fields=['posts_count'])
        
        instance.delete()
        
        # TODO: Broadcast to WebSocket when channels is installed
        # try:
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(
        #         'locations',
        #         {
        #             'type': 'location_deleted',
        #             'data': {'id': str(location_id)},
        #             'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat(),
        #             'userId': str(self.request.user.id),
        #         }
        #     )
        # except Exception as e:
        #     print(f"Error broadcasting location_deleted: {e}")


class UserLocationsView(generics.ListAPIView):
    """Get locations created by a user."""
    serializer_class = LocationListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        try:
            return Location.objects.filter(
                author_id=user_id,
                status='approved'
            ).select_related('category', 'author')
        except Exception:
            # Return empty queryset if user_id is invalid
            return Location.objects.none()


class SavedLocationsView(generics.ListAPIView):
    """Get user's saved locations."""
    serializer_class = SavedLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedLocation.objects.filter(
            user=self.request.user
        ).select_related('location', 'location__category', 'location__author')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_save_location(request, location_id):
    """Save or unsave a location."""
    location = get_object_or_404(Location, id=location_id, status='approved')
    
    saved, created = SavedLocation.objects.get_or_create(
        user=request.user,
        location=location
    )
    
    if not created:
        saved.delete()
        location.saves_count = max(0, location.saves_count - 1)
        message = 'Location unsaved.'
    else:
        location.saves_count += 1
        message = 'Location saved.'
    
    location.save(update_fields=['saves_count'])
    return Response({'message': message, 'saved': created})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like_location(request, location_id):
    """Like or unlike a location."""
    location = get_object_or_404(Location, id=location_id, status='approved')
    
    liked, created = LikedLocation.objects.get_or_create(
        user=request.user,
        location=location
    )
    
    if not created:
        liked.delete()
        location.likes_count = max(0, location.likes_count - 1)
        message = 'Location unliked.'
    else:
        location.likes_count += 1
        message = 'Location liked.'
    
    location.save(update_fields=['likes_count'])
    return Response({'message': message, 'liked': created})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_nearby_locations(request):
    """Get locations near a specific point."""
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    radius = request.query_params.get('radius', 10)  # km
    
    if not lat or not lng:
        return Response(
            {'error': 'Latitude and longitude are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lat = float(lat)
        lng = float(lng)
        radius = float(radius)
    except ValueError:
        return Response(
            {'error': 'Invalid coordinates.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Simple distance filter (not precise but fast)
    # For production, use PostGIS or similar
    from decimal import Decimal
    lat_range = Decimal(radius / 111)
    lng_range = Decimal(radius / (111 * abs(lat)))
    
    locations = Location.objects.filter(
        status='approved',
        latitude__range=(lat - float(lat_range), lat + float(lat_range)),
        longitude__range=(lng - float(lng_range), lng + float(lng_range))
    ).select_related('category', 'author')
    
    serializer = LocationListSerializer(
        locations,
        many=True,
        context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_trending_locations(request):
    """Get trending locations."""
    locations = Location.objects.filter(
        status='approved'
    ).order_by('-likes_count', '-reviews_count', '-created_at')[:10]
    
    serializer = LocationListSerializer(
        locations,
        many=True,
        context={'request': request}
    )
    return Response(serializer.data)
