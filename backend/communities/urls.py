"""
URLs for communities app.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Communities
    path('', views.CommunityListView.as_view(), name='community-list'),
    path('<str:id>/', views.CommunityDetailView.as_view(), name='community-detail'),
    path('<str:community_id>/join/', views.join_community, name='join-community'),
    path('<str:community_id>/leave/', views.leave_community, name='leave-community'),
    path('my-communities/', views.get_user_communities, name='my-communities'),
    
    # Community Posts
    path('<str:community_id>/posts/', views.CommunityPostListView.as_view(), name='community-post-list'),
    path('post/<str:id>/', views.CommunityPostDetailView.as_view(), name='community-post-detail'),
    
    # Community Comments
    path('post/<str:post_id>/comments/', views.CommunityCommentListView.as_view(), name='community-comment-list'),
    path('comment/<str:comment_id>/delete/', views.delete_comment, name='delete-comment'),
]
