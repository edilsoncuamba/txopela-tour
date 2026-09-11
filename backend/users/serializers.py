from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Follow

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'avatar', 'bio', 'location',
            'type', 'followers_count', 'following_count', 'posts_count',
            'is_verified', 'date_joined', 'stats'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'followers_count', 
                           'following_count', 'posts_count', 'is_verified', 'stats']
    
    def get_stats(self, obj):
        """Calculate user stats from related models."""
        # Count locals (locations) owned by user
        try:
            locals_count = obj.locations.count()
        except:
            locals_count = 0
        
        # Count services/bookings created by user
        # Bookings are services that any user can create
        try:
            services_count = obj.bookings.count()
        except:
            services_count = 0
        
        # Count reviews submitted by user
        try:
            reviews_count = obj.reviews.count()
        except:
            reviews_count = 0
        
        return {
            'postsCount': obj.posts_count,
            'followersCount': obj.followers_count,
            'followingCount': obj.following_count,
            'servicesCount': services_count,
            'localsCount': locals_count,
            'reviewsCount': reviews_count,
        }


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password_confirm', 'type']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {'password_confirm': 'Passwords do not match.'}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = ['name', 'avatar', 'bio', 'location']


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list (minimal data)."""
    
    class Meta:
        model = User
        fields = ['id', 'name', 'avatar', 'type', 'is_verified']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for follow relationships."""
    follower = UserListSerializer(read_only=True)
    following = UserListSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']


class SendOTPSerializer(serializers.Serializer):
    """Serializer for sending OTP."""
    email = serializers.EmailField(required=True)


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP."""
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True, max_length=6, min_length=6)
