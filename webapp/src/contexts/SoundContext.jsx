import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);
  const isAudioInitialized = useRef(false);

  // Initialize AudioContext
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        isAudioInitialized.current = true;
      }).catch(e => console.error("Could not resume AudioContext:", e));
    } else {
      isAudioInitialized.current = true;
    }
  }, []);

  // Initialize on user interaction to comply with autoplay policies
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initAudio]);

  // Synthesizer function
  const playTone = useCallback((frequency, type, duration, volume = 0.1, ramp = true) => {
    if (isMuted || !audioContextRef.current) return;
    
    // Ensure context is running
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    try {
      const osc = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      
      if (ramp) {
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);
      } else {
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime + duration);
      }

      osc.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      osc.start();
      osc.stop(audioContextRef.current.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }, [isMuted]);

  // Sound Effects Library
  const playClick = useCallback(() => {
    playTone(800, 'sine', 0.1, 0.05);
  }, [playTone]);

  const playStart = useCallback(() => {
    // A rising sequence
    const now = audioContextRef.current?.currentTime || 0;
    setTimeout(() => playTone(440, 'triangle', 0.1, 0.1), 0);
    setTimeout(() => playTone(554, 'triangle', 0.1, 0.1), 100);
    setTimeout(() => playTone(659, 'triangle', 0.3, 0.1), 200);
  }, [playTone]);

  const playCountdown = useCallback(() => {
    // Short sharp blip
    playTone(600, 'square', 0.1, 0.05);
  }, [playTone]);

  const playGo = useCallback(() => {
    // High pitch Go!
    playTone(880, 'sine', 0.6, 0.1);
  }, [playTone]);

  const playRest = useCallback(() => {
    // Lower pitch for rest
    playTone(200, 'sine', 0.4, 0.1);
    setTimeout(() => playTone(150, 'sine', 0.4, 0.1), 100);
  }, [playTone]);

  const playComplete = useCallback(() => {
    // Victory fanfare
    setTimeout(() => playTone(523.25, 'triangle', 0.1, 0.1), 0);
    setTimeout(() => playTone(523.25, 'triangle', 0.1, 0.1), 150);
    setTimeout(() => playTone(523.25, 'triangle', 0.1, 0.1), 300);
    setTimeout(() => playTone(659.25, 'triangle', 0.6, 0.1), 450);
  }, [playTone]);

  const playLetsGo = useCallback(() => {
     playTone(300, 'sawtooth', 0.1, 0.05);
     setTimeout(() => playTone(400, 'sawtooth', 0.2, 0.05), 100);
  }, [playTone]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    // Force a click sound immediately to confirm action, bypassing mute check just this once logically by calling playTone directly if we wanted, 
    // but here we just toggle state. The click might not play if we just muted it, which is standard.
    if (isMuted) { // If we are UN-muting
        setTimeout(() => playTone(800, 'sine', 0.1, 0.05), 50);
    }
  };

  const value = {
    isMuted,
    toggleMute,
    playClick,
    playStart,
    playCountdown,
    playRest,
    playGo,
    playComplete,
    playLetsGo,
    initAudio
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};