from django.contrib import admin
from .models import Post, Like, Comment, SavedPost, Share


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'created_at', 'likes_count', 'comments_count')
    list_filter = ('created_at', 'author')
    search_fields = ('description', 'author__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__name', 'post__id')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('author__name', 'content')


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__name', 'post__id')


@admin.register(Share)
class ShareAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__name', 'post__id')
