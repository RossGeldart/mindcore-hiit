import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Sending password reset email to:', email);

    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // PKCE Flow Implementation
      // We set the redirect URL to the /reset path.
      // Supabase will append a 'code' parameter to this URL when the user clicks the email link.
      // This is more secure and resilient than the implicit flow (hash fragment).
      const redirectUrl = `${window.location.origin}/reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      console.log('Password reset email sent successfully to', email);
      setIsSuccess(true);
      toast({
        title: "Email Sent",
        description: "Check your inbox for the password reset link.",
        className: "bg-green-600 text-white border-none",
      });
    } catch (err) {
      console.error('Password reset error:', err);
      // Supabase sometimes returns ambiguous errors for security, but usually "User not found" or rate limits
      setError(err.message || "Failed to send reset email");
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Check your email</h3>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              <br/><br/>
              <span className="text-xs text-muted-foreground">Don't see it? Check your spam folder.</span>
            </p>
            <Button onClick={onClose} className="w-full">
              Back to Login
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Reset Password</h3>
              <p className="text-muted-foreground text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {error && (
               <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 text-sm text-destructive items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background"
                    placeholder="name@example.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                    </div>
                  ) : (
                    "Send Link"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordModal;