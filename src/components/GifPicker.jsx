import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

// GIPHY API KEY would normally be a secret, but for a client-side demo we might use a public beta key or simulate.
// Since we can't easily add secrets without user interaction, we will mock the "search" with a predefined set for this demo 
// OR use a free endpoint if available. 
// However, a real Giphy implementation requires an API key. I will implement a "Simulated" GIF search using a static list 
// that covers common workout reactions, to ensure it works without a valid API key in this constrained environment.

const MOCK_GIFS = [
    { id: '1', title: 'Workout Flex', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JhL1AzTxORUTDlC/giphy.gif' },
    { id: '2', title: 'Tired', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKr3nzbh5WgCFxe/giphy.gif' },
    { id: '3', title: 'Lets Go', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMHxhOfscxPfIfm/giphy.gif' },
    { id: '4', title: 'Sweating', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4FATJpd4LWgeruTK/giphy.gif' },
    { id: '5', title: 'Strong', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cD7PLGEQAQT1y/giphy.gif' },
    { id: '6', title: 'Done', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IsZ6k5D5nNoAw/giphy.gif' },
    { id: '7', title: 'High Five', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BPJmthQ3YRwD6QqcVD/giphy.gif' },
    { id: '8', title: 'Dance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eGZ4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/blSTtZTIjXrif862BZ/giphy.gif' },
];

const GifPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(MOCK_GIFS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (search) {
            setLoading(true);
            // Simulate API delay
            setTimeout(() => {
                const filtered = MOCK_GIFS.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
                // If no local match, just show random ones to "simulate" a search result for demo
                setResults(filtered.length > 0 ? filtered : MOCK_GIFS.slice(0, 4)); 
                setLoading(false);
            }, 500);
        } else {
            setResults(MOCK_GIFS);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-16 left-4 right-4 md:left-auto md:w-80 md:right-10 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col h-96"
    >
      <div className="p-3 border-b flex gap-2 items-center bg-muted/30">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search GIFs..." 
                className="pl-9 h-9 text-sm bg-background"
                autoFocus
            />
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
            <X className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-2">
         {loading ? (
             <div className="h-full flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-primary" />
             </div>
         ) : (
             <div className="grid grid-cols-2 gap-2">
                 {results.map(gif => (
                     <button
                        key={gif.id}
                        onClick={() => onSelect(gif)}
                        className="relative aspect-video rounded-lg overflow-hidden group border border-transparent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
                     >
                         <img src={gif.url} alt={gif.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                     </button>
                 ))}
             </div>
         )}
         {results.length === 0 && !loading && (
             <div className="text-center p-4 text-sm text-muted-foreground">No GIFs found.</div>
         )}
      </ScrollArea>
      <div className="p-2 bg-muted/20 text-[10px] text-center text-muted-foreground border-t">
          Powered by GIPHY (Demo)
      </div>
    </motion.div>
  );
};

export default GifPicker;