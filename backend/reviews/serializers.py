from rest_framework import serializers
from .models import Review, ReviewImage, ReviewHelpful, ReviewReply
from users.serializers import UserListSerializer


class ReviewImageSerializer(serializers.ModelSerializer):
    """Serializer for review images."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewImage
        fields = ['id', 'image_url', 'caption']
    
    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None


class ReviewReplySerializer(serializers.ModelSerializer):
    """Serializer for review replies."""
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = ReviewReply
        fields = ['id', 'user', 'comment', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""
    user = UserListSerializer(read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    reply = ReviewReplySerializer(read_only=True)
    helpful_count = serializers.SerializerMethodField()
    is_helpful = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'rating', 'comment', 'images',
            'reply', 'helpful_count', 'is_helpful',
            'created_at', 'updated_at'
        ]
    
    def get_helpful_count(self, obj):
        return obj.helpful_votes.count()
    
    def get_is_helpful(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ReviewHelpful.objects.filter(
                review=obj,
                user=request.user
            ).exists()
        return False


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews."""
    location_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Review
        fields = ['location_id', 'rating', 'comment']
    
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
    
    def create(self, validated_data):
        location_id = validated_data.pop('location_id')
        from locations.models import Location
        location = Location.objects.get(id=location_id)
        
        # Check if user already reviewed this location
        existing = Review.objects.filter(
            location=location,
            user=self.context['request'].user
        ).first()
        
        if existing:
            # Update existing review
            existing.rating = validated_data['rating']
            existing.comment = validated_data['comment']
            existing.save()
            return existing
        
        return Review.objects.create(
            location=location,
            user=self.context['request'].user,
            **validated_data
        )


class ReviewListSerializer(serializers.ModelSerializer):
    """Serializer for review list (minimal data)."""
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'rating', 'comment', 'created_at']


class ReviewHelpfulSerializer(serializers.ModelSerializer):
    """Serializer for helpful votes."""
    
    class Meta:
        model = ReviewHelpful
        fields = ['id', 'review', 'user', 'created_at']
        read_only_fields = ['user']


class ReviewReplyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating review replies."""
    
    class Meta:
        model = ReviewReply
        fields = ['review', 'comment']
    
    def create(self, validated_data):
        return ReviewReply.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
