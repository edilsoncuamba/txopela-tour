"""
WebSocket consumers for reviews app.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class ReviewConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for review updates."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = None
        self.room_group_name = 'reviews'
        
        try:
            await self.authenticate_user()
            
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"✅ Review consumer connected: {self.user}")
        except Exception as e:
            print(f"❌ Review consumer connection error: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"Review consumer disconnected: {close_code}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'review_created':
                await self.handle_review_created(data)
            elif message_type == 'review_updated':
                await self.handle_review_updated(data)
            elif message_type == 'review_deleted':
                await self.handle_review_deleted(data)
        except json.JSONDecodeError:
            print("Invalid JSON received")
        except Exception as e:
            print(f"Error processing message: {e}")
    
    async def handle_review_created(self, data):
        """Broadcast review created event."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'review_created',
                'data': data.get('data'),
                'timestamp': data.get('timestamp'),
                'userId': str(self.user.id) if self.user else None,
            }
        )
    
    async def handle_review_updated(self, data):
        """Broadcast review updated event."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'review_updated',
                'data': data.get('data'),
                'timestamp': data.get('timestamp'),
                'userId': str(self.user.id) if self.user else None,
            }
        )
    
    async def handle_review_deleted(self, data):
        """Broadcast review deleted event."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'review_deleted',
                'data': data.get('data'),
                'timestamp': data.get('timestamp'),
                'userId': str(self.user.id) if self.user else None,
            }
        )
    
    # Event handlers for group messages
    async def review_created(self, event):
        """Send review_created event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'review_created',
            'data': event['data'],
            'timestamp': event['timestamp'],
            'userId': event['userId'],
        }))
    
    async def review_updated(self, event):
        """Send review_updated event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'review_updated',
            'data': event['data'],
            'timestamp': event['timestamp'],
            'userId': event['userId'],
        }))
    
    async def review_deleted(self, event):
        """Send review_deleted event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'review_deleted',
            'data': event['data'],
            'timestamp': event['timestamp'],
            'userId': event['userId'],
        }))
    
    @database_sync_to_async
    def authenticate_user(self):
        """Authenticate user from query parameters."""
        query_string = self.scope.get('query_string', b'').decode()
        token_str = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token_str = param.split('=')[1]
                break
        
        headers = dict(self.scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode()
        
        if auth_header.startswith('Bearer '):
            token_str = auth_header[7:]
        
        if not token_str:
            raise Exception("No token provided")
        
        try:
            token = AccessToken(token_str)
            user_id = token['user_id']
            self.user = User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            raise Exception(f"Invalid token: {e}")
