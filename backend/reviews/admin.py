from django.contrib import admin
from .models import Review, ReviewImage, ReviewHelpful, ReviewReply


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 1


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'location', 'user', 'rating', 'is_approved',
        'created_at', 'updated_at'
    ]
    list_filter = ['rating', 'is_approved', 'created_at']
    search_fields = ['comment', 'user__name', 'location__name']
    list_editable = ['is_approved']
    inlines = [ReviewImageInline]
    date_hierarchy = 'created_at'


@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ['review', 'caption', 'uploaded_at']
    list_filter = ['uploaded_at']


@admin.register(ReviewHelpful)
class ReviewHelpfulAdmin(admin.ModelAdmin):
    list_display = ['review', 'user', 'created_at']
    list_filter = ['created_at']


@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    list_display = ['review', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['comment', 'user__name']
