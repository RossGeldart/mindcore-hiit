
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, Save, X, User, Target, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';

const ProfileEdit = ({ onClose, onProfileUpdated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    weekly_goal: 3
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      let { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('weekly_goal')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profileData) {
        profileData = {
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
        };
      }

      setFormData({
        full_name: profileData.full_name || '',
        avatar_url: profileData.avatar_url || '',
        weekly_goal: statsData?.weekly_goal || 3
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const profileUpdates = {
        id: user.id,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        updated_at: new Date(),
      };
      const { error: profileError } = await supabase.from('profiles').upsert(profileUpdates);
      if (profileError) throw profileError;
      
      const { error: statsError } = await supabase.from('user_stats').upsert({
         user_id: user.id,
         weekly_goal: formData.weekly_goal,
         updated_at: new Date()
      }, { onConflict: 'user_id' });

      if (statsError) throw statsError;

      await supabase.auth.updateUser({
        data: { full_name: formData.full_name, avatar_url: formData.avatar_url }
      });

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });
      
      if (onProfileUpdated) onProfileUpdated();
      if (onClose) onClose();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading avatar",
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const adjustGoal = (amount) => {
    setFormData(prev => ({
        ...prev,
        weekly_goal: Math.max(1, Math.min(14, prev.weekly_goal + amount))
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-10 px-4 bg-background/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">Edit Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={updateProfile} className="p-5 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" id="avatar-upload" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Click camera icon to change photo</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Weekly Session Goal
                  </label>
                  <span className="text-xl font-black text-primary">{formData.weekly_goal}</span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground text-center">
                      How many workouts do you want to complete per week?
                  </p>
                  
                  <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => adjustGoal(-1)} disabled={formData.weekly_goal <= 1}>
                          <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <div className="flex-1 px-1">
                        <Slider value={[formData.weekly_goal]} min={1} max={14} step={1} onValueChange={(val) => setFormData({...formData, weekly_goal: val[0]})} className="w-full" />
                      </div>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => adjustGoal(1)} disabled={formData.weekly_goal >= 14}>
                          <Plus className="w-3.5 h-3.5" />
                      </Button>
                  </div>
              </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 px-3">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading} className="h-9 px-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileEdit;
