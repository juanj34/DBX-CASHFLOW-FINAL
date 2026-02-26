import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles Supabase auth callbacks (email confirmation, password reset links).
 * Supabase redirects here with tokens in the URL hash/query. The JS client
 * automatically picks up the tokens from the URL and establishes a session.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase auto-detects tokens in the URL hash and exchanges them
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
        return;
      }

      // Check if this is a password recovery flow
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');

      if (type === 'recovery') {
        navigate('/reset-password', { replace: true });
      } else if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };

    // Listen for the auth event that fires when tokens are exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      } else if (event === 'SIGNED_IN') {
        navigate('/dashboard', { replace: true });
      }
    });

    handleCallback();

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse" />
        <p className="text-sm text-theme-text-muted mt-2">Verifying...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
