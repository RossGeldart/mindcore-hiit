
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import PostCard from '@/components/PostCard';
import PostUploadForm from '@/components/PostUploadForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PostsFeed = ({ userId }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('posts')
        .select(`
            *,
            profiles (
                id,
                full_name,
                avatar_url
            ),
            post_likes (
                user_id
            )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  // Only show upload form if on main feed (no userId) or viewing own profile
  const showUploadForm = !userId || (user && userId === user.id);

  return (
    <div className="w-full max-w-xl mx-auto py-4">
      {showUploadForm && (
        <PostUploadForm onPostCreated={handlePostCreated} />
      )}

      {loading && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground text-sm">Loading posts...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
             <AlertCircle className="w-10 h-10 text-destructive mb-2" />
             <p className="text-destructive mb-4 font-medium">{error}</p>
             <Button variant="outline" onClick={fetchPosts}>Retry</Button>
        </div>
      ) : (
        <div className="space-y-4">
            {posts.length > 0 ? (
                posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={user?.id} 
                        onDelete={handlePostDeleted}
                    />
                ))
            ) : (
                <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground">No posts yet.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PostsFeed;
