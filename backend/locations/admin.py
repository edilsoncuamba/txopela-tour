from django.contrib import admin
from .models import Location, Category, LocationImage, SavedLocation, LikedLocation, NearbyService


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'color', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


class LocationImageInline(admin.TabularInline):
    model = LocationImage
    extra = 1


class NearbyServiceInline(admin.TabularInline):
    model = NearbyService
    extra = 1


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'author', 'rating', 'reviews_count',
        'status', 'is_featured', 'created_at'
    ]
    list_filter = ['status', 'category', 'is_featured', 'created_at']
    search_fields = ['name', 'description', 'address']
    list_editable = ['status', 'is_featured']
    inlines = [LocationImageInline, NearbyServiceInline]
    date_hierarchy = 'created_at'


@admin.register(LocationImage)
class LocationImageAdmin(admin.ModelAdmin):
    list_display = ['location', 'caption', 'is_primary', 'uploaded_at']
    list_filter = ['is_primary', 'uploaded_at']


@admin.register(SavedLocation)
class SavedLocationAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__name', 'location__name']


@admin.register(LikedLocation)
class LikedLocationAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__name', 'location__name']


@admin.register(NearbyService)
class NearbyServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'service_type', 'distance_km', 'is_active']
    list_filter = ['service_type', 'is_active']
    search_fields = ['name', 'location__name']
