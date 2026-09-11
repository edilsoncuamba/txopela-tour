from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import uuid
import random
import string

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = [
        ('traveler', _('Viajante')),
        ('guide', _('Guia Turístico')),
        ('business', _('Negócio')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    name = models.CharField(_('name'), max_length=150)
    
    # Profile fields
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(_('bio'), blank=True, max_length=500)
    location = models.CharField(_('location'), max_length=100, blank=True)
    type = models.CharField(
        _('user type'),
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='traveler'
    )
    
    # Social stats
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    
    # Account status
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_active = models.DateTimeField(default=timezone.now)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.name
    
    def get_full_name(self):
        return self.name
    
    def get_short_name(self):
        return self.name.split()[0] if self.name else ''
    
    def update_last_active(self):
        self.last_active = timezone.now()
        self.save(update_fields=['last_active'])


class EmailVerificationOTP(models.Model):
    """Model for storing email verification OTP codes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'))
    otp_code = models.CharField(_('OTP code'), max_length=6)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'OTP for {self.email}'
    
    @staticmethod
    def generate_otp():
        """Generate a random 6-digit OTP code."""
        return ''.join(random.choices(string.digits, k=6))
    
    @staticmethod
    def create_otp(email):
        """Create a new OTP for the given email."""
        otp_code = EmailVerificationOTP.generate_otp()
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        # Delete old unused OTPs for this email
        EmailVerificationOTP.objects.filter(email=email, is_used=False).delete()
        
        otp = EmailVerificationOTP.objects.create(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at
        )
        return otp
    
    def is_valid(self):
        """Check if OTP is valid (not used and not expired)."""
        return not self.is_used and timezone.now() <= self.expires_at


class Follow(models.Model):
    """Model for follow relationships between users."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='following_set'
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='followers_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['follower', 'following']
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.follower.name} follows {self.following.name}'
