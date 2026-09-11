from rest_framework import serializers
from .models import Notification, NotificationPreference
from users.serializers import UserListSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    sender = UserListSerializer(read_only=True)
    location_name = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'sender', 'notification_type', 'title', 'message',
            'location', 'location_name', 'review', 'is_read', 'time_ago', 'created_at'
        ]
    
    def get_location_name(self, obj):
        if obj.location:
            return obj.location.name
        return None
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'Agora'
        elif diff < timedelta(hours=1):
            minutes = int(diff.seconds / 60)
            return f'{minutes}min'
        elif diff < timedelta(days=1):
            hours = int(diff.seconds / 3600)
            return f'{hours}h'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days}d'
        else:
            return obj.created_at.strftime('%d/%m/%Y')


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_likes', 'email_comments', 'email_saves', 'email_follows', 'email_approvals',
            'push_likes', 'push_comments', 'push_saves', 'push_follows', 'push_approvals'
        ]


class NotificationCountSerializer(serializers.Serializer):
    """Serializer for notification counts."""
    unread_count = serializers.IntegerField()
    total_count = serializers.IntegerField()
