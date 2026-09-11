from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Follow


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'type', 'is_verified', 'is_active', 'date_joined']
    list_filter = ['type', 'is_verified', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('name', 'avatar', 'bio', 'location')}),
        (_('Profile type'), {'fields': ('type',)}),
        (_('Social stats'), {'fields': ('followers_count', 'following_count', 'posts_count')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'last_active')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'type'),
        }),
    )


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__name', 'following__name']
    ordering = ['-created_at']
