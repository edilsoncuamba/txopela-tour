"""
URLs for chat app.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Conversations
    path('', views.ConversationListView.as_view(), name='conversation-list'),
    path('<str:id>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('start/<str:user_id>/', views.start_conversation, name='start-conversation'),
    
    # Messages
    path('<str:conversation_id>/message/', views.MessageCreateView.as_view(), name='message-create'),
    path('message/<str:message_id>/read/', views.mark_as_read, name='mark-as-read'),
    
    # Utilities
    path('<str:conversation_id>/mark-read/', views.mark_conversation_as_read, name='mark-conversation-read'),
    path('unread-count/', views.get_unread_count, name='unread-count'),
    path('ai/response/', views.get_ai_response, name='ai-response'),
]
