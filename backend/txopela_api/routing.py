"""
WebSocket routing for txopela_api project.
"""

from django.urls import re_path
from locations.consumers import LocationConsumer
from posts.consumers import PostConsumer
from reviews.consumers import ReviewConsumer
from notifications.consumers import NotificationConsumer
from bookings.consumers import BookingConsumer

websocket_urlpatterns = [
    re_path(r'ws/locations/$', LocationConsumer.as_asgi()),
    re_path(r'ws/posts/$', PostConsumer.as_asgi()),
    re_path(r'ws/reviews/$', ReviewConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/bookings/$', BookingConsumer.as_asgi()),
]
