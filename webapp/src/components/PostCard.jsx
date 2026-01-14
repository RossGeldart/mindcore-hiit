
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Flame, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PostCard = ({ post, currentUserId, onDelete }) => {
  const { toast } = useToast();
  // Check if current user has liked the post. 
  // post.post_likes is an array of objects { user_id: '...' }
  const initialIsLiked = post.post_likes && post.post_likes.some(like => like.user_id === currentUserId);
  const initialLikeCount = post.post_likes ? post.post_likes.length : 0;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLikeToggle = async () => {
    if (!currentUserId || isLikeLoading) return;

    // Optimistic Update
    const prevIsLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevIsLiked);
    setLikeCount(prevIsLiked ? prevCount - 1 : prevCount + 1);
    setIsLikeLoading(true);

    try {
      if (prevIsLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: currentUserId });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimism
      setIsLiked(prevIsLiked);
      setLikeCount(prevCount);
      toast({ title: "Error", description: "Failed to update like.", variant: "destructive" });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast({ title: "Post Deleted", description: "Your post has been removed." });
      if (onDelete) onDelete(post.id);

    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = currentUserId === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden mb-6 flex flex-col"
    >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border flex items-center justify-center">
                    {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
                <div>
                    <h4 className="font-bold text-sm text-foreground leading-none">
                        {post.profiles?.full_name || 'Unknown User'}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                </div>
            </div>

            {isOwner && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your post.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

        {/* Image - Updated for full uncropped display */}
        {post.image_url && (
            <div className="w-full bg-black/5 flex justify-center items-center overflow-hidden">
                <img 
                    src={post.image_url} 
                    alt={post.title || "Post Image"} 
                    className="w-full h-auto object-contain max-h-[80vh] sm:max-w-lg md:max-w-xl"
                    loading="lazy" 
                />
            </div>
        )}

        {/* Content */}
        <div className="p-4 pt-3 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                        "gap-2 px-2 h-8 rounded-full transition-all duration-300",
                        isLiked 
                            ? "text-[#FF6B35] bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20" 
                            : "text-muted-foreground hover:text-[#FF6B35] hover:bg-[#FF6B35]/5"
                    )}
                    onClick={handleLikeToggle}
                >
                    <Flame className={cn("w-5 h-5 transition-transform", isLiked && "fill-current scale-110")} />
                    <span className="font-bold text-sm">{likeCount}</span>
                </Button>
            </div>

            {post.title && (
                <h3 className="font-bold text-lg text-foreground mb-1 leading-snug">{post.title}</h3>
            )}
            
            {post.caption && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{post.caption}</p>
            )}
        </div>
    </motion.div>
  );
};

export default PostCard;
