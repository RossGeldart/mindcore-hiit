
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, X, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const PostUploadForm = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive"
        });
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() && !caption.trim() && !imageFile) {
        toast({ title: "Empty Post", description: "Please add some content to your post.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          caption: caption.trim(),
          image_url: imageUrl
        });

      if (dbError) throw dbError;

      toast({
        title: "Posted!",
        description: "Your fitness journey update is live.",
      });

      // Reset form
      setTitle('');
      setCaption('');
      removeImage();
      setIsOpen(false);
      if (onPostCreated) onPostCreated();

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mb-6">
       {!isOpen ? (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             onClick={() => setIsOpen(true)}
             className="bg-card hover:bg-card/80 border border-border/50 rounded-xl p-4 shadow-sm cursor-pointer transition-all flex items-center gap-3 group"
           >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors">
                    <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Share your workout progress...</p>
                </div>
           </motion.div>
       ) : (
           <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border/50 rounded-xl p-4 shadow-lg"
           >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Create Post</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input 
                            placeholder="Title (e.g., Morning HIIT Crushed!)" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-background font-semibold"
                            maxLength={100}
                        />
                        <textarea 
                            placeholder="Share your thoughts, stats, or how you felt..." 
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="hidden"
                        />
                        
                        {previewUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-border bg-black/5 aspect-video flex items-center justify-center">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                                    onClick={removeImage}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full h-20 border-dashed border-2 flex flex-col gap-1 hover:bg-muted/50 hover:border-primary/50 text-muted-foreground"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs">Add Photo</span>
                            </Button>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                         <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    Post Update <Send className="ml-2 h-4 w-4" />
                                </>
                            )}
                         </Button>
                    </div>
                </form>
           </motion.div>
       )}
    </div>
  );
};

export default PostUploadForm;
