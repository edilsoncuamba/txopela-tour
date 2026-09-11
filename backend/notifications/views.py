from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    NotificationCountSerializer
)


class NotificationListView(generics.ListAPIView):
    """List user's notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender', 'location', 'review')


class UnreadNotificationsView(generics.ListAPIView):
    """List unread notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
            is_read=False
        ).select_related('sender', 'location', 'review')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_notification_count(request):
    """Get notification counts."""
    unread = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    total = Notification.objects.filter(recipient=request.user).count()
    
    return Response({
        'unread_count': unread,
        'total_count': total
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read."""
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )
    notification.mark_as_read()
    return Response({'message': 'Notification marked as read.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read."""
    Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    
    return Response({'message': 'All notifications marked as read.'})


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_notification(request, notification_id):
    """Delete a notification."""
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )
    notification.delete()
    return Response({'message': 'Notification deleted.'})


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """Get or update notification preferences."""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        preference, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preference


def create_notification(recipient, notification_type, title, message, 
                       sender=None, location=None, review=None):
    """Helper function to create notifications."""
    # Don't create notification if recipient is the sender
    if sender and recipient == sender:
        return None
    
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        title=title,
        message=message,
        location=location,
        review=review
    )
    
    # TODO: Send push notification if enabled
    # TODO: Send email notification if enabled
    
    return notification
