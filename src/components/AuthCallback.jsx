import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';

/**
 * AuthCallback handles Supabase auth redirects for:
 * - Email verification after signup
 * - Password reset flow
 * - OAuth callbacks
 */
const AuthCallback = ({ onComplete, onError }) => {
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Completing authentication...');
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        const hashParams = new URLSearchParams(url.hash.replace('#', ''));

        // Check if this is a recovery flow
        const type = params.get('type') || hashParams.get('type');
        const isPasswordRecovery = type === 'recovery';
        setIsRecovery(isPasswordRecovery);

        // Check for errors in URL
        const error = params.get('error') || hashParams.get('error');
        const errorDesc = params.get('error_description') || hashParams.get('error_description');

        if (error) {
          throw new Error(errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : 'Authentication failed');
        }

        // Check for PKCE code
        const code = params.get('code');

        if (code) {
          setMessage('Verifying your credentials...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Handle PKCE flow state error (different browser)
            if (exchangeError.message?.includes('flow state') || exchangeError.message?.includes('PKCE')) {
              throw new Error('This link was opened in a different browser. Please use the same browser where you requested the link, or request a new one.');
            }
            throw exchangeError;
          }

          if (data?.session) {
            setStatus('success');
            setMessage(isPasswordRecovery ? 'Link verified! Redirecting to set your new password...' : 'Email verified successfully!');
            
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);

            // Redirect after short delay
            setTimeout(() => {
              onComplete(isPasswordRecovery ? 'reset_password' : 'profile');
            }, 1500);
            return;
          }
        }

        // Check for hash tokens (implicit flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          setMessage('Setting up your session...');
          
          if (refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (sessionError) throw sessionError;
          }

          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);

          setStatus('success');
          setMessage(isPasswordRecovery ? 'Redirecting to set your new password...' : 'Authentication successful!');
          
          setTimeout(() => {
            onComplete(isPasswordRecovery ? 'reset_password' : 'profile');
          }, 1500);
          return;
        }

        // No tokens found - check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setMessage('Session found! Redirecting...');
          window.history.replaceState({}, '', window.location.pathname);
          
          setTimeout(() => {
            onComplete(isPasswordRecovery ? 'reset_password' : 'profile');
          }, 1000);
          return;
        }

        // No auth data found
        throw new Error('No authentication data found. Please try again.');

      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        setStatus('error');
        setMessage(err.message || 'Authentication failed. Please try again.');
        onError?.(err.message);
      }
    };

    handleCallback();
  }, [onComplete, onError]);

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
        <Button onClick={() => onComplete('auth')}>
          Back to Login
        </Button>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Success!</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Processing state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <h2 className="text-2xl font-bold mb-2">Please Wait</h2>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default AuthCallback;
