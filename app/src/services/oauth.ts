/**
 * OAuth Service para autenticação com GitHub e Google
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const googleOAuth = {
  getAuthUrl: () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
    const scope = 'openid profile email';
    
    if (!clientId) {
      console.error('Google Client ID not configured');
      return '';
    }
    
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline`;
  },
  
  handleCallback: async (code: string) => {
    const response = await fetch(`${API_URL}/users/oauth/google/callback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'OAuth failed');
    }
    
    return response.json();
  }
};

export const githubOAuth = {
  getAuthUrl: () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    
    if (!clientId) {
      console.error('GitHub Client ID not configured');
      return '';
    }
    
    return `https://github.com/login/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `allow_signup=true`;
  },
  
  handleCallback: async (code: string) => {
    const response = await fetch(`${API_URL}/users/oauth/github/callback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'OAuth failed');
    }
    
    return response.json();
  }
};

export const facebookOAuth = {
  getAuthUrl: () => {
    const clientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI || `${window.location.origin}/auth/facebook/callback`;
    const scope = 'email,public_profile';
    
    if (!clientId) {
      console.error('Facebook Client ID not configured');
      return '';
    }
    
    return `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code`;
  },
  
  handleCallback: async (code: string) => {
    const response = await fetch(`${API_URL}/users/oauth/facebook/callback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'OAuth failed');
    }
    
    return response.json();
  }
};
