import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder, File, Loader2, ChevronRight, Home, Download, Eye, HardDrive, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const BUCKET_NAME = 'Workouts';

const StorageBrowser = ({ onBack }) => {
  const [currentPath, setCurrentPath] = useState([]); // Array of folder names
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [currentPath]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use null for root path to be safe with Supabase client (undefined can sometimes behave unexpectedly)
      const pathString = currentPath.length > 0 ? currentPath.join('/') : null;
      
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list(pathString, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });
      
      if (error) {
        throw error;
      }
      
      // Filter out empty placeholders
      const filteredData = (data || []).filter(item => item.name !== '.emptyFolderPlaceholder');

      // Sort: Folders (no id) first, then files
      const sortedData = filteredData.sort((a, b) => {
        const aIsFolder = !a.id;
        const bIsFolder = !b.id;
        
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      setItems(sortedData);
    } catch (err) {
      console.error('Error fetching storage items:', err);
      setError('Failed to load folder contents. Please check console for details.');
      toast({
        title: "Error loading storage",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderName) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const handleFileClick = async (fileName) => {
    const pathString = currentPath.length > 0 ? `${currentPath.join('/')}/${fileName}` : fileName;
    
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(pathString);
    
    if (data?.publicUrl) {
      setPreviewUrl(data.publicUrl);
      setIsPreviewOpen(true);
    }
  };

  const isImage = (fileName) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 hover:bg-muted">
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Storage Browser: {BUCKET_NAME}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => handleBreadcrumbClick(-1)}
              className={`flex items-center p-1 rounded hover:bg-muted ${currentPath.length === 0 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
            >
              <Home className="h-4 w-4 mr-1" />
              Root
            </button>
            
            {currentPath.map((folder, index) => (
              <div key={index} className="flex items-center shrink-0">
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                <button 
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`p-1 rounded hover:bg-muted ${index === currentPath.length - 1 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
                >
                  {folder}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading contents...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p>{error}</p>
            <Button onClick={fetchItems} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40">
              Try Again
            </Button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
          >
            {items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>This folder is empty</p>
                <p className="text-xs mt-2">Check browser console for debug details.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const isFolder = !item.id; 
                  
                  return (
                    <div 
                      key={item.name} 
                      className="group flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => isFolder ? handleFolderClick(item.name) : handleFileClick(item.name)}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`p-2 rounded-lg shrink-0 ${isFolder ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                          {isFolder ? <Folder className="h-5 w-5" /> : isImage(item.name) ? <ImageIcon className="h-5 w-5" /> : <File className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{item.name}</p>
                          {!isFolder && (
                            <p className="text-xs text-muted-foreground">
                              {(item.metadata?.size / 1024).toFixed(1)} KB • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFolder ? (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
          {previewUrl && (
            <div className="relative group bg-black/50 backdrop-blur rounded-lg overflow-hidden flex justify-center items-center min-h-[300px]">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                 <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur transition-colors"
                >
                  <Download className="h-5 w-5" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorageBrowser;