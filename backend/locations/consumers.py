"""
WebSocket consumers for locations app.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class LocationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for location updates."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = None
        self.room_group_name = 'locations'
        
        # Try to authenticate user
        try:
            await self.authenticate_user()
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"✅ Location consumer connected: {self.user}")
        except Exception as e:
            print(f"❌ Location consumer connection error: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"Location consumer disconnected: {close_code}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'location_created':
                await self.handle_location_created(data)
            elif message_type == 'location_updated':
                await self.handle_location_updated(data)
            elif message_type == 'location_deleted':
                await self.handle_location_deleted(data)
            elif message_type == 'user_online':
                await self.handle_user_online(data)
        except json.JSONDecodeError:
            print("Invalid JSON received")
        except Exception as e:
            print(f"Error processing message: {e}")
    
    async def handle_location_created(self, data):
        """Broadcast location created event."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'location_created',
                'data': data.get('data'),
                'timestamp': data.get('timestamp'),
                'userId': str(self.user.id) if self.user else None,
            }
        )
    
    async def handle_location_updated(self, data):
        """Broadcast location updated event."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'location_updated',
                'data': data.get('data'),
                'timestamp': data.get('timestamp'),
                'userId': str(self.user.id) if self.user else None,
            }
        )
    
    async def handle_location_deleted(self, data):
        """Broadcast location deleted event."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'location_deleted',
                'data': data.get('data'),
                'timestamp': data.get('timestamp'),
                'userId': str(self.user.id) if self.user else None,
            }
        )
    
    async def handle_user_online(self, data):
        """Handle user online status."""
        # User is already authenticated in connect()
        pass
    
    # Event handlers for group messages
    async def location_created(self, event):
        """Send location_created event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'location_created',
            'data': event['data'],
            'timestamp': event['timestamp'],
            'userId': event['userId'],
        }))
    
    async def location_updated(self, event):
        """Send location_updated event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'location_updated',
            'data': event['data'],
            'timestamp': event['timestamp'],
            'userId': event['userId'],
        }))
    
    async def location_deleted(self, event):
        """Send location_deleted event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'location_deleted',
            'data': event['data'],
            'timestamp': event['timestamp'],
            'userId': event['userId'],
        }))
    
    @database_sync_to_async
    def authenticate_user(self):
        """Authenticate user from query parameters."""
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token_str = None
        
        # Parse query string for token
        for param in query_string.split('&'):
            if param.startswith('token='):
                token_str = param.split('=')[1]
                break
        
        # Also try to get from headers (Authorization header)
        headers = dict(self.scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode()
        
        if auth_header.startswith('Bearer '):
            token_str = auth_header[7:]
        
        if not token_str:
            raise Exception("No token provided")
        
        try:
            # Validate token
            token = AccessToken(token_str)
            user_id = token['user_id']
            self.user = User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            raise Exception(f"Invalid token: {e}")
