from django.urls import path
from . import views

urlpatterns = [
    # Notifications
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('unread/', views.UnreadNotificationsView.as_view(), name='notification-unread'),
    path('count/', views.get_notification_count, name='notification-count'),
    path('<str:notification_id>/read/', views.mark_notification_read, name='notification-read'),
    path('<str:notification_id>/delete/', views.delete_notification, name='notification-delete'),
    path('mark-all-read/', views.mark_all_notifications_read, name='notification-mark-all-read'),
    
    # Preferences
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
]
