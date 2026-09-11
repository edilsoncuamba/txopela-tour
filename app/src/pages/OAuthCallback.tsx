import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { googleOAuth, githubOAuth } from '@/services/oauth';
import { useScrollTop } from '@/hooks/useScrollTop';

export default function OAuthCallback() {
  useScrollTop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const provider = window.location.pathname.includes('google') ? 'google' : 'github';
      
      if (!code) {
        navigate('/');
        return;
      }
      
      try {
        const oauthService = provider === 'google' ? googleOAuth : githubOAuth;
        const data = await oauthService.handleCallback(code);
        
        // Save tokens
        localStorage.setItem('txopela_token', data.access);
        localStorage.setItem('txopela_refresh_token', data.refresh);
        
        // Refresh user to update auth context
        await refreshUser();
        
        // Redirect to home
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/');
      }
    };
    
    handleCallback();
  }, [searchParams, navigate, refreshUser]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Autenticando...</h1>
        <div className="flex gap-1 justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
