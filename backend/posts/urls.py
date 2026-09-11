from django.urls import path
from . import views

urlpatterns = [
    # Posts
    path('', views.PostListView.as_view(), name='post-list'),
    path('create/', views.PostCreateView.as_view(), name='post-create'),
    path('saved/', views.SavedPostsView.as_view(), name='saved-posts'),
    
    # Single post
    path('<str:id>/', views.PostDetailView.as_view(), name='post-detail'),
    path('<str:id>/update/', views.PostUpdateView.as_view(), name='post-update'),
    path('<str:id>/delete/', views.PostDeleteView.as_view(), name='post-delete'),
    
    # Post interactions
    path('<str:post_id>/like/', views.toggle_like_post, name='post-like'),
    path('<str:post_id>/save/', views.toggle_save_post, name='post-save'),
    path('<str:post_id>/share/', views.share_post, name='post-share'),
    
    # Comments
    path('<str:post_id>/comment/', views.add_comment, name='add-comment'),
    path('comment/<str:comment_id>/delete/', views.delete_comment, name='delete-comment'),
    
    # User posts
    path('user/<str:user_id>/', views.UserPostsView.as_view(), name='user-posts'),
]
