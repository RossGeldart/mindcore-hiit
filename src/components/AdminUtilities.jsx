
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { resetUserWorkoutStats } from '@/lib/adminUtils';

const AdminUtilities = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user } = useAuth(); // Can be used to double-check admin status or display info
  const { toast } = useToast();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await resetUserWorkoutStats(email);
      
      if (response.success) {
        setResult({ type: 'success', message: `Successfully reset stats for User ID: ${response.userId}` });
        toast({
          title: "Stats Reset Successful",
          description: `Workout stats for ${email} have been cleared.`,
        });
        setEmail(''); // Clear input on success
      } else {
        setResult({ type: 'error', message: response.error });
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: response.error,
        });
      }
    } catch (err) {
      setResult({ type: 'error', message: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="pl-0 hover:bg-transparent">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border shadow-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-6 h-6 text-destructive" />
                <CardTitle className="text-2xl">Admin Utilities</CardTitle>
              </div>
              <CardDescription>
                Perform sensitive administrative actions. Use with caution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <h3 className="font-semibold flex items-center gap-2 text-foreground mb-2">
                      <RefreshCw className="w-4 h-4" /> Reset User Stats
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will reset <strong>Total Minutes</strong> and <strong>Total Workouts</strong> to zero for the specified user. 
                      This action cannot be undone.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background"
                        disabled={loading}
                      />
                      <Button 
                        type="submit" 
                        variant="destructive" 
                        disabled={!email || loading}
                        className="w-full sm:w-auto self-end"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Reset Stats"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`mt-6 p-4 rounded-lg border flex items-start gap-3 ${
                    result.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                  }`}
                >
                  {result.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-medium">
                      {result.type === 'success' ? 'Success' : 'Error'}
                    </h4>
                    <p className="text-sm opacity-90">{result.message}</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border mt-4 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                These actions are logged. Please ensure you have the necessary authorization before modifying user data.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUtilities;
