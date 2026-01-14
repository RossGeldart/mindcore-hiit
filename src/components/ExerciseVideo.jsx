import React, { useEffect, useRef, useState, memo } from 'react';
import { Loader2, Film, AlertCircle, RefreshCw } from 'lucide-react';

const ExerciseVideo = memo(({ exercise, showTitle = true, paused = false }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when exercise changes
  useEffect(() => {
    if (!exercise) return;
    setLoading(true);
    setError(false);
    setRetryCount(0);
  }, [exercise?.id, exercise?.video_url]);

  // Handle play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const managePlayback = async () => {
      try {
        if (video.paused && !paused) {
          // Promise handling prevents "The play() request was interrupted"
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } else if (!video.paused && paused) {
          video.pause();
        }
      } catch (err) {
        // Autoplay policies might block playback if not muted
        console.warn("Playback interaction error:", err);
        if (video.muted === false) {
           video.muted = true;
           // Retry play after muting
           try {
             await video.play();
           } catch (retryErr) {
             console.error("Retry playback failed:", retryErr);
           }
        }
      }
    };

    managePlayback();
  }, [paused, exercise, retryCount]);

  const handleVideoError = (e) => {
    const video = videoRef.current;
    console.error("Video error event:", video?.error || e);
    
    // Basic retry logic for connection flakes or codec hiccup
    if (retryCount < 3) {
        const timeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            if (videoRef.current) {
                videoRef.current.load();
            }
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return () => clearTimeout(timeout);
    } else {
        setLoading(false);
        setError(true);
    }
  };

  const getFileExtension = (url) => {
      try {
          const path = new URL(url).pathname;
          return path.split('.').pop()?.toLowerCase();
      } catch (e) {
          return null;
      }
  };

  if (!exercise) return null;

  const cleanExerciseName = (name) => {
    if (!name) return '';
    return name
      .replace(/\.(mp4|mov|webm|m4v)$/i, '') // Remove video extensions
      .replace(/\(1\)/g, '')
      .replace(/_/g, ' ')
      .trim();
  };

  const videoUrl = exercise.video_url;
  const fileType = getFileExtension(videoUrl);
  
  // Robust mime-type handling for Android/Samsung
  const primaryMimeType = fileType === 'webm' ? 'video/webm' : 'video/mp4';

  return (
    <div className="w-full h-full flex flex-col bg-[#323230]">
      <div className="flex-grow w-full relative group flex items-center justify-center overflow-hidden bg-black">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              key={`${exercise.id}-${retryCount}`}
              className="w-full h-full object-cover" 
              poster={exercise.thumbnail_url}
              playsInline
              // Samsung & Older Android specific attributes
              webkit-playsinline="true"
              x5-playsinline="true" 
              x5-video-player-type="h5"
              preload="auto"
              loop
              muted
              autoPlay={!paused}
              onLoadedData={() => setLoading(false)}
              onError={handleVideoError}
            >
              <source src={videoUrl} type={primaryMimeType} />
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} />
              
              <div className="absolute inset-0 flex items-center justify-center text-white">
                 <p>Video format not supported</p>
              </div>
            </video>
            
            {/* Loading State */}
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 text-[#A0303B] animate-spin" />
              </div>
            )}

            {/* Error State with Manual Retry */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#323230] z-20 text-white/70 p-4 text-center">
                <AlertCircle className="w-10 h-10 mb-2 text-[#A0303B]" />
                <p className="text-sm font-medium mb-4">Video unavailable</p>
                <button 
                    onClick={() => {
                        setError(false);
                        setLoading(true);
                        setRetryCount(0);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm font-semibold border border-white/10"
                >
                    <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-[#C8C8C8] p-4 text-center">
            <Film className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm font-medium">No video source</p>
          </div>
        )}
      </div>
      
      {showTitle && (
        <div className="w-full bg-[#323230] text-white p-4 text-center shrink-0 border-t border-[#2A2A2A]">
          <h3 className="text-lg font-semibold truncate">{cleanExerciseName(exercise.name)}</h3>
        </div>
      )}
    </div>
  );
});

ExerciseVideo.displayName = 'ExerciseVideo';

export default ExerciseVideo;