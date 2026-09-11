from rest_framework import serializers
from .models import Location, Category, LocationImage, SavedLocation, LikedLocation, NearbyService
from users.serializers import UserListSerializer


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'color', 'description']


class NearbyServiceSerializer(serializers.ModelSerializer):
    """Serializer for nearby services."""
    
    class Meta:
        model = NearbyService
        fields = ['id', 'name', 'service_type', 'description', 'phone', 'website', 'distance_km']


class LocationImageSerializer(serializers.ModelSerializer):
    """Serializer for location images."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LocationImage
        fields = ['id', 'image_url', 'caption', 'is_primary']
    
    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None


class LocationListSerializer(serializers.ModelSerializer):
    """Serializer for location list (minimal data)."""
    category = CategorySerializer(read_only=True)
    author = UserListSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'description', 'category', 'image',
            'address', 'rating', 'reviews_count', 'likes_count',
            'author', 'is_saved', 'is_liked', 'created_at'
        ]
    
    def get_image(self, obj):
        if obj.images:
            return obj.images[0] if isinstance(obj.images, list) else obj.images
        return None
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedLocation.objects.filter(user=request.user, location=obj).exists()
        return False
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return LikedLocation.objects.filter(user=request.user, location=obj).exists()
        return False


class LocationDetailSerializer(serializers.ModelSerializer):
    """Serializer for location details."""
    category = CategorySerializer(read_only=True)
    author = UserListSerializer(read_only=True)
    nearby_services = NearbyServiceSerializer(many=True, read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'description', 'category', 'images',
            'address', 'latitude', 'longitude',
            'rating', 'reviews_count', 'likes_count', 'saves_count',
            'author', 'nearby_services', 'is_saved', 'is_liked',
            'created_at', 'updated_at'
        ]
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedLocation.objects.filter(user=request.user, location=obj).exists()
        return False
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return LikedLocation.objects.filter(user=request.user, location=obj).exists()
        return False


class LocationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating locations."""
    category_id = serializers.UUIDField(write_only=True)
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Location
        fields = [
            'name', 'description', 'category_id',
            'address', 'latitude', 'longitude', 'images'
        ]
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id')
        images = validated_data.pop('images', [])
        
        from .models import Category
        category = Category.objects.get(id=category_id)
        
        # Create location with empty images list first
        location = Location.objects.create(
            category=category,
            author=self.context['request'].user,
            images=[],
            **validated_data
        )
        
        # Handle image uploads
        if images:
            image_urls = []
            for image in images:
                # Save image to media folder
                from django.core.files.storage import default_storage
                import os
                filename = f"locations/{location.id}/{image.name}"
                path = default_storage.save(filename, image)
                image_url = default_storage.url(path)
                image_urls.append(image_url)
            
            location.images = image_urls
            location.save(update_fields=['images'])
        
        # Update user's post count
        user = self.context['request'].user
        user.posts_count += 1
        user.save(update_fields=['posts_count'])
        
        return location


class SavedLocationSerializer(serializers.ModelSerializer):
    """Serializer for saved locations."""
    location = LocationListSerializer(read_only=True)
    
    class Meta:
        model = SavedLocation
        fields = ['id', 'location', 'created_at']


class LikedLocationSerializer(serializers.ModelSerializer):
    """Serializer for liked locations."""
    location = LocationListSerializer(read_only=True)
    
    class Meta:
        model = LikedLocation
        fields = ['id', 'location', 'created_at']
