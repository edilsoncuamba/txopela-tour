from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    UserListSerializer
)

User = get_user_model()


class UserLoginView(APIView):
    """Login with email and password."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'User account is disabled.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class UserRegisterView(APIView):
    """Register a new user."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserUpdateView(generics.UpdateAPIView):
    """Update user profile."""
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    """Get user details by ID."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'id'


class UserListView(generics.ListAPIView):
    """List all users."""
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ChangePasswordView(APIView):
    """Change user password."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'old_password': 'Wrong password.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, id):
    """Follow or unfollow a user."""
    from .models import Follow
    
    user_to_follow = get_object_or_404(User, id=id)
    
    if user_to_follow == request.user:
        return Response(
            {'error': 'You cannot follow yourself.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    follow_obj, created = Follow.objects.get_or_create(
        follower=request.user,
        following=user_to_follow
    )
    
    if not created:
        follow_obj.delete()
        request.user.following_count = max(0, request.user.following_count - 1)
        user_to_follow.followers_count = max(0, user_to_follow.followers_count - 1)
        message = 'Unfollowed successfully.'
        followed = False
    else:
        request.user.following_count += 1
        user_to_follow.followers_count += 1
        message = 'Followed successfully.'
        followed = True
    
    request.user.save(update_fields=['following_count'])
    user_to_follow.save(update_fields=['followers_count'])
    
    return Response({'message': message, 'followed': followed})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_followers(request, id):
    """Get user's followers."""
    from .models import Follow
    
    user = get_object_or_404(User, id=id)
    followers = User.objects.filter(
        following_set__following=user
    )
    serializer = UserListSerializer(followers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_following(request, id):
    """Get users that a user is following."""
    from .models import Follow
    
    user = get_object_or_404(User, id=id)
    following = User.objects.filter(
        following_set__follower=user
    )
    serializer = UserListSerializer(following, many=True)
    return Response(serializer.data)



class SendOTPView(APIView):
    """Send OTP code to email for verification."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .models import EmailVerificationOTP
            from django.core.mail import send_mail
            from django.template.loader import render_to_string
            
            # Create OTP
            otp = EmailVerificationOTP.create_otp(email)
            
            # Prepare email content
            subject = 'Código de Verificação - Txopela Tour'
            
            # HTML email template
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #0077B6; margin: 0;">Txopela Tour</h1>
                            <p style="color: #666; margin: 5px 0 0 0;">Plataforma de Turismo</p>
                        </div>
                        
                        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Verifique seu Email</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Olá,
                        </p>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Você solicitou verificação de email para sua conta Txopela Tour. Use o código abaixo para confirmar seu email:
                        </p>
                        
                        <div style="background-color: #f0f0f0; border: 2px solid #0077B6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                            <p style="margin: 0; color: #999; font-size: 12px; margin-bottom: 10px;">Código de Verificação</p>
                            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #0077B6; letter-spacing: 5px;">{otp.otp_code}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            <strong>Este código expira em 10 minutos.</strong>
                        </p>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            Se você não solicitou este código, ignore este email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            © 2024 Txopela Tour. Todos os direitos reservados.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            # Plain text version
            plain_message = f"""
Txopela Tour - Verificação de Email

Olá,

Você solicitou verificação de email para sua conta Txopela Tour.

Código de Verificação: {otp.otp_code}

Este código expira em 10 minutos.

Se você não solicitou este código, ignore este email.

© 2024 Txopela Tour
            """
            
            # Send email
            send_mail(
                subject,
                plain_message,
                None,  # Uses DEFAULT_FROM_EMAIL from settings
                [email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return Response({
                'message': 'OTP sent successfully to your email.',
                'email': email
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyOTPView(APIView):
    """Verify OTP code and mark email as verified."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return Response(
                {'error': 'Email and OTP code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .models import EmailVerificationOTP
            
            # Find OTP
            otp = EmailVerificationOTP.objects.filter(
                email=email,
                otp_code=otp_code
            ).first()
            
            if not otp:
                return Response(
                    {'error': 'Invalid OTP code.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not otp.is_valid():
                return Response(
                    {'error': 'OTP code has expired.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Mark OTP as used
            otp.is_used = True
            otp.save()
            
            # Mark user email as verified
            try:
                user = User.objects.get(email=email)
                user.email_verified = True
                user.save(update_fields=['email_verified'])
            except User.DoesNotExist:
                pass
            
            return Response({
                'message': 'Email verified successfully.',
                'email': email
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
