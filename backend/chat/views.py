"""
Views for chat app.
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    MessageSerializer
)


class ConversationListView(generics.ListAPIView):
    """List user's conversations."""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')


class ConversationDetailView(generics.RetrieveAPIView):
    """Get conversation details with messages."""
    queryset = Conversation.objects.all()
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """Mark all messages as read when viewing conversation."""
        response = super().retrieve(request, *args, **kwargs)
        
        # Mark all messages as read
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        
        return response


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_conversation(request, user_id):
    """Start or get existing conversation with a user."""
    other_user_id = user_id
    
    if str(other_user_id) == str(request.user.id):
        return Response(
            {'error': 'Cannot start conversation with yourself.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find or create conversation
    conversation = Conversation.objects.filter(
        participants=request.user
    ).filter(
        participants__id=other_user_id
    ).first()
    
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user)
        conversation.participants.add(other_user_id)
    
    serializer = ConversationSerializer(conversation, context={'request': request})
    return Response(serializer.data)


class MessageCreateView(generics.CreateAPIView):
    """Send a message in a conversation."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=self.request.user
        )
        
        message = serializer.save(sender=self.request.user, conversation=conversation)
        
        # Update conversation updated_at
        conversation.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_as_read(request, message_id):
    """Mark a message as read."""
    message = get_object_or_404(Message, id=message_id)
    
    # Check if user is in the conversation
    if request.user not in message.conversation.participants.all():
        return Response(
            {'error': 'Not authorized.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    message.is_read = True
    message.save()
    
    return Response(MessageSerializer(message).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_conversation_as_read(request, conversation_id):
    """Mark all messages in a conversation as read."""
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        participants=request.user
    )
    
    conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    
    return Response({'message': 'All messages marked as read.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_count(request):
    """Get total unread message count."""
    unread_count = Message.objects.filter(
        conversation__participants=request.user,
        is_read=False
    ).exclude(sender=request.user).count()
    
    return Response({'unread_count': unread_count})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def get_ai_response(request):
    """Get AI response for a message."""
    try:
        from ai_service import ai_service
        
        message = request.data.get('message')
        conversation_history = request.data.get('history', [])
        
        if not message:
            return Response(
                {'error': 'Message is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response = ai_service.get_chat_response(message, conversation_history)
        
        return Response({
            'response': response,
            'message': message
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
