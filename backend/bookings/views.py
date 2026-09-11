"""
Views for bookings app.
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Booking, BookingReview, BookingAvailability
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingReviewSerializer,
    BookingAvailabilitySerializer
)


class BookingListView(generics.ListAPIView):
    """List user's bookings."""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related(
            'location', 'location__category', 'location__author'
        )


class BookingCreateView(generics.CreateAPIView):
    """Create a new booking."""
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        
        # TODO: Broadcast to WebSocket when channels is installed
        # try:
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(
        #         'bookings',
        #         {
        #             'type': 'booking_created',
        #             'data': BookingSerializer(booking).data,
        #             'timestamp': booking.created_at.isoformat(),
        #             'userId': str(self.request.user.id),
        #         }
        #     )
        # except Exception as e:
        #     print(f"Error broadcasting booking_created: {e}")


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or cancel a booking."""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        booking = serializer.save()
        
        # TODO: Broadcast to WebSocket when channels is installed
        # try:
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(
        #         'bookings',
        #         {
        #             'type': 'booking_updated',
        #             'data': BookingSerializer(booking).data,
        #             'timestamp': booking.updated_at.isoformat(),
        #             'userId': str(self.request.user.id),
        #         }
        #     )
        # except Exception as e:
        #     print(f"Error broadcasting booking_updated: {e}")
    
    def perform_destroy(self, instance):
        booking_id = instance.id
        instance.delete()
        
        # TODO: Broadcast to WebSocket when channels is installed
        # try:
        #     channel_layer = get_channel_layer()
        #     async_to_sync(channel_layer.group_send)(
        #         'bookings',
        #         {
        #             'type': 'booking_cancelled',
        #             'data': {'id': str(booking_id)},
        #             'timestamp': timezone.now().isoformat(),
        #             'userId': str(self.request.user.id),
        #         }
        #     )
        # except Exception as e:
        #     print(f"Error broadcasting booking_cancelled: {e}")


class BookingReviewCreateView(generics.CreateAPIView):
    """Create a review for a completed booking."""
    serializer_class = BookingReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        booking_id = self.kwargs.get('booking_id')
        booking = get_object_or_404(Booking, id=booking_id, user=self.request.user)
        
        if not booking.is_past():
            return Response(
                {'error': 'Can only review completed bookings.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(user=self.request.user, booking=booking)


class BookingAvailabilityView(generics.ListAPIView):
    """Get availability calendar for a location."""
    serializer_class = BookingAvailabilitySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        location_id = self.kwargs.get('location_id')
        return BookingAvailability.objects.filter(
            location_id=location_id
        ).order_by('date')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_booking(request, booking_id):
    """Confirm a pending booking."""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    if booking.status != 'pending':
        return Response(
            {'error': 'Only pending bookings can be confirmed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    booking.status = 'confirmed'
    booking.save()
    
    # TODO: Broadcast to WebSocket when channels is installed
    # try:
    #     channel_layer = get_channel_layer()
    #     async_to_sync(channel_layer.group_send)(
    #         'bookings',
    #         {
    #             'type': 'booking_confirmed',
    #             'data': BookingSerializer(booking).data,
    #             'timestamp': booking.updated_at.isoformat(),
    #             'userId': str(request.user.id),
    #         }
    #     )
    # except Exception as e:
    #     print(f"Error broadcasting booking_confirmed: {e}")
    
    return Response(BookingSerializer(booking).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking(request, booking_id):
    """Cancel a booking."""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    if booking.status == 'completed':
        return Response(
            {'error': 'Cannot cancel completed bookings.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    booking.status = 'cancelled'
    booking.save()
    
    # TODO: Broadcast to WebSocket when channels is installed
    # try:
    #     channel_layer = get_channel_layer()
    #     async_to_sync(channel_layer.group_send)(
    #         'bookings',
    #         {
    #             'type': 'booking_cancelled',
    #             'data': BookingSerializer(booking).data,
    #             'timestamp': booking.updated_at.isoformat(),
    #             'userId': str(request.user.id),
    #         }
    #     )
    # except Exception as e:
    #     print(f"Error broadcasting booking_cancelled: {e}")
    
    return Response(BookingSerializer(booking).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_upcoming_bookings(request):
    """Get user's upcoming bookings."""
    bookings = Booking.objects.filter(
        user=request.user,
        check_in__gte=timezone.now()
    ).order_by('check_in').select_related('location', 'location__category')
    
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_past_bookings(request):
    """Get user's past bookings."""
    bookings = Booking.objects.filter(
        user=request.user,
        check_out__lt=timezone.now()
    ).order_by('-check_out').select_related('location', 'location__category')
    
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)
