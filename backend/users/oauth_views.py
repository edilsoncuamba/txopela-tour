"""
OAuth Views para autenticação com GitHub e Google
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
import requests
import os


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_callback(request):
    """Handle Google OAuth callback"""
    code = request.data.get('code')
    
    if not code:
        return Response(
            {'error': 'Code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Exchange code for token
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'redirect_uri': 'http://localhost:3000/auth/google/callback',
                'grant_type': 'authorization_code',
            }
        )
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response(
                {'error': 'Failed to get access token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get user info from Google
        user_response = requests.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        user_data = user_response.json()
        email = user_data.get('email')
        name = user_data.get('name')
        picture = user_data.get('picture')
        
        if not email:
            return Response(
                {'error': 'Could not get email from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': name or 'User',
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.first_name,
                'avatar': picture,
            }
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def github_oauth_callback(request):
    """Handle GitHub OAuth callback"""
    code = request.data.get('code')
    
    if not code:
        return Response(
            {'error': 'Code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Exchange code for token
        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': os.getenv('GITHUB_CLIENT_ID'),
                'client_secret': os.getenv('GITHUB_CLIENT_SECRET'),
                'code': code,
            },
            headers={'Accept': 'application/json'}
        )
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response(
                {'error': 'Failed to get access token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get user info from GitHub
        user_response = requests.get(
            'https://api.github.com/user',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        user_data = user_response.json()
        
        # Get email from GitHub
        email_response = requests.get(
            'https://api.github.com/user/emails',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        emails = email_response.json()
        email = next((e['email'] for e in emails if e['primary']), None)
        
        if not email:
            return Response(
                {'error': 'Could not get email from GitHub'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        name = user_data.get('name') or user_data.get('login')
        avatar = user_data.get('avatar_url')
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': user_data.get('login'),
                'first_name': name,
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.first_name,
                'avatar': avatar,
            }
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
