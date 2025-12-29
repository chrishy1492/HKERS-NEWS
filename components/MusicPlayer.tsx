
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX, SkipForward, SkipBack, Music, List, X, Play, Pause, AlertCircle, Loader2, Sparkles } from 'lucide-react';

// =========================================================================
// ENGINEER NOTE: AUDIO SOURCE STABILIZATION V4
// Switched to SoundHelix CDN for guaranteed uptime and stream stability.
// Previous Archive.org links were causing frequent 403/Redirect errors.
// =========================================================================
const TRACKS = [
    { 
        id: 1, 
        title: "Mindfulness (Focus)", 
        category: "Study",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
    },
    { 
        id: 2, 
        title: "Healing Soul (Piano)", 
        category: "Relax",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" 
    },
    { 
        id: 3, 
        title: "Morning Light (Groove)", 
        category: "Daily",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" 
    },
    { 
        id: 4, 
        title: "Deep Trance (Flow)", 
        category: "Fortune",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" 
    },
    { 
        id: 5, 
        title: "Zen Garden (Ambient)", 
        category: "Meditation",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" 
    },
    { 
        id: 6, 
        title: "Soft Lounge (Tempo)", 
        category: "Game",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" 
    }
];

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0); 
  const [minimized, setMinimized] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(0.5); 
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Refs
  const errorCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio Engine
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        audioRef.current.preload = "auto"; // Auto load for smoother start
        
        // Event Listeners
        audioRef.current.onwaiting = () => setIsLoading(true);
        audioRef.current.onplaying = () => { 
            setIsLoading(false); 
            setError(false);
            errorCountRef.current = 0; // Reset error count on successful play
        };
        audioRef.current.oncanplay = () => { setIsLoading(false); setError(false); };
        
        // Smart Recovery: Retry current track once before skipping
        audioRef.current.onerror = (e) => {
            const mediaError = audioRef.current?.error;
            let errorMessage = "Unknown Error";
            if (mediaError) {
                switch (mediaError.code) {
                    case mediaError.MEDIA_ERR_ABORTED: errorMessage = "Aborted"; break;
                    case mediaError.MEDIA_ERR_NETWORK: errorMessage = "Network Error"; break;
                    case mediaError.MEDIA_ERR_DECODE: errorMessage = "Decode Error"; break;
                    case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = "Source Not Supported"; break;
                    default: errorMessage = `Code ${mediaError.code}`;
                }
            }
            
            console.error(`Audio Source Error [${TRACKS[currentTrackIndex].title}]: ${errorMessage}`);
            setIsLoading(false);
            setError(true);
            
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

            // Retry strategy
            if (errorCountRef.current < 2) {
                errorCountRef.current += 1;
                console.log(`Retrying track (Attempt ${errorCountRef.current})...`);
                retryTimeoutRef.current = setTimeout(() => {
                    if (audioRef.current) {
                        audioRef.current.load();
                        if (isPlaying) audioRef.current.play().catch(() => {});
                    }
                }, 1500);
            } else {
                console.warn("Max retries reached, switching track.");
                errorCountRef.current = 0;
                retryTimeoutRef.current = setTimeout(() => {
                    changeTrack('next'); 
                }, 1000);
            }
        };
    }
    
    return () => {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [currentTrackIndex, isPlaying]); 

  // Track Change Logic
  useEffect(() => {
    if (audioRef.current) {
        const track = TRACKS[currentTrackIndex];
        // Only reload if source is different
        if (audioRef.current.src !== track.url) {
            setIsLoading(true);
            setError(false);
            audioRef.current.src = track.url;
            
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.warn("Autoplay / Play interrupted:", e);
                        setIsPlaying(false);
                        setIsLoading(false);
                    });
                }
            }
        }
    }
  }, [currentTrackIndex]);

  // Play/Pause Logic
  useEffect(() => {
      if (audioRef.current) {
          if (isPlaying) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.catch(e => {
                      setIsPlaying(false);
                  });
              }
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying]);

  // Volume Logic
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
      }
  }, [volume, isMuted]);

  const togglePlay = () => {
      if (!isPlaying) errorCountRef.current = 0; 
      setError(false);
      setIsPlaying(!isPlaying);
  };
  
  const changeTrack = (direction: 'next' | 'prev') => {
      setError(false);
      errorCountRef.current = 0; // Reset error count on manual change
      let newIndex = direction === 'next' ? currentTrackIndex + 1 : currentTrackIndex - 1;
      if (newIndex >= TRACKS.length) newIndex = 0;
      if (newIndex < 0) newIndex = TRACKS.length - 1;
      setCurrentTrackIndex(newIndex);
      if (isPlaying) setIsPlaying(true);
  };

  const selectTrack = (index: number) => {
      setError(false);
      errorCountRef.current = 0;
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setShowPlaylist(false);
  };

  // Minimized Button (Floating)
  if (minimized) {
    return (
      <button 
        onClick={() => setMinimized(false)}
        className={`fixed bottom-20 right-4 z-50 p-3 rounded-full shadow-2xl border-2 border-white/20 transition-all hover:scale-110 flex items-center justify-center backdrop-blur-md ${isPlaying ? 'bg-hker-yellow/90 text-black animate-pulse-slow shadow-hker-yellow/50' : 'bg-gray-900/90 text-white'}`}
      >
        <Music size={24} />
      </button>
    );
  }

  // Expanded Player UI
  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end pointer-events-none">
        
      {/* Playlist Modal */}
      {showPlaylist && (
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl mb-2 w-72 max-h-80 overflow-y-auto pointer-events-auto animate-fade-in-up">
              <div className="p-3 bg-gray-50/80 border-b border-gray-200 font-bold flex justify-between items-center sticky top-0 z-10">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Relaxing Playlist ({TRACKS.length})</span>
                  <button onClick={() => setShowPlaylist(false)}><X size={16} className="text-gray-400 hover:text-black"/></button>
              </div>
              <div className="p-1 space-y-1">
                  {TRACKS.map((track, idx) => (
                      <button 
                        key={track.id} 
                        onClick={() => selectTrack(idx)}
                        className={`w-full text-left px-3 py-3 text-xs font-medium rounded-lg transition-all flex items-center justify-between group ${currentTrackIndex === idx ? 'bg-hker-yellow text-black shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                          <div className="flex flex-col">
                              <span className="font-bold truncate w-48">{idx + 1}. {track.title}</span>
                              <span className="text-[10px] opacity-60 font-mono uppercase">{track.category} Music</span>
                          </div>
                          {currentTrackIndex === idx && isPlaying && <Volume2 size={14} className="animate-pulse"/>}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Main Control Panel */}
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-4 w-80 pointer-events-auto transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shadow-sm ${isPlaying ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                <h3 className="font-black text-xs text-gray-800 tracking-widest flex items-center gap-1">
                    <Sparkles size={12} className="text-hker-gold"/> HKER AMBIENCE
                </h3>
            </div>
            <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-black bg-gray-100 p-1 rounded hover:bg-gray-200 transition">
                <span className="font-mono font-bold text-xs px-1">_</span>
            </button>
        </div>

        {/* Track Display */}
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-4 mb-4 text-center border border-gray-800 relative overflow-hidden group shadow-inner">
            {error ? (
                <div className="text-red-400 text-xs font-bold animate-pulse flex items-center justify-center gap-2 h-8">
                    <AlertCircle size={16} /> Signal Interrupted... Retrying
                </div>
            ) : isLoading ? (
                <div className="text-hker-yellow text-xs font-bold animate-pulse flex items-center justify-center gap-2 h-8">
                    <Loader2 size={16} className="animate-spin" /> Buffering Audio...
                </div>
            ) : (
                <div className="h-8 flex flex-col justify-center">
                    <div className="absolute inset-0 bg-hker-yellow opacity-0 group-hover:opacity-5 transition duration-500"></div>
                    <p className="text-hker-yellow text-[10px] font-bold tracking-widest mb-1 opacity-70 uppercase">Now Playing</p>
                    <p className="text-white font-bold text-sm truncate tracking-wide">{TRACKS[currentTrackIndex].title}</p>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
            <button onClick={() => changeTrack('prev')} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition active:scale-95">
                <SkipBack size={20} />
            </button>
            
            <button 
                onClick={togglePlay} 
                className={`w-14 h-14 rounded-full shadow-xl border-4 transition-all active:scale-95 flex items-center justify-center ${isPlaying ? 'bg-hker-yellow border-white text-black scale-105' : 'bg-white border-gray-100 text-gray-700 hover:border-hker-yellow'}`}
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            
            <button onClick={() => changeTrack('next')} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition active:scale-95">
                <SkipForward size={20} />
            </button>
        </div>

        {/* Volume & Menu */}
        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <button onClick={() => setIsMuted(!isMuted)} className="text-gray-500 hover:text-black transition">
                {isMuted ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
            </button>
            
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-hker-red hover:accent-red-600 transition-all"
            />
            
            <button 
                onClick={() => setShowPlaylist(!showPlaylist)} 
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-bold ${showPlaylist ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'}`}
            >
                <List size={14} /> 
                <span>{currentTrackIndex + 1}/{TRACKS.length}</span>
            </button>
        </div>
      </div>
    </div>
  );
};
