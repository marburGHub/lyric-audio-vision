
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, SkipBack, SkipForward, Sun, Moon, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAYLIST, formatTime, extractFilename, readID3Tags, fetchLyrics } from "@/utils/audioUtils";
import { cn } from "@/lib/utils";

interface Track {
  src: string;
  lyrics: string;
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
}

const AudioPlayer: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tracksWithMetadata, setTracksWithMetadata] = useState<Track[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Initialize with theme preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
    
    // Initialize tracks with metadata from filenames
    const initializedTracks = PLAYLIST.map(track => {
      return {
        ...track,
        title: extractFilename(track.src),
      };
    });
    setTracksWithMetadata(initializedTracks);
  }, []);

  // Update time as audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (currentTrack) {
        readID3Tags(audio, currentTrack).then(updatedTrack => {
          setCurrentTrack(updatedTrack);
          
          // Update the track in the tracksWithMetadata array
          setTracksWithMetadata(prev => 
            prev.map(track => 
              track.src === updatedTrack.src ? updatedTrack : track
            )
          );
        });
      }
    };
    const handleEnded = () => playNextTrack();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack]);

  // Play/Pause when isPlaying changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(error => {
        console.error("Playback failed:", error);
        toast.error("Playback failed. Please try again.");
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Load lyrics when track changes or lyrics button is clicked
  useEffect(() => {
    if (showLyrics && currentTrack) {
      fetchLyrics(currentTrack.lyrics)
        .then(text => setLyrics(text));
    }
  }, [showLyrics, currentTrack]);

  const togglePlayPause = () => {
    if (!currentTrack && tracksWithMetadata.length > 0) {
      setCurrentTrack(tracksWithMetadata[0]);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setShowLyrics(false);
  };

  const playPreviousTrack = () => {
    if (!currentTrack) return;
    const currentIndex = tracksWithMetadata.findIndex(t => t.src === currentTrack.src);
    if (currentIndex > 0) {
      playTrack(tracksWithMetadata[currentIndex - 1]);
    } else {
      // Wrap around to the last track
      playTrack(tracksWithMetadata[tracksWithMetadata.length - 1]);
    }
  };

  const playNextTrack = () => {
    if (!currentTrack) return;
    const currentIndex = tracksWithMetadata.findIndex(t => t.src === currentTrack.src);
    if (currentIndex < tracksWithMetadata.length - 1) {
      playTrack(tracksWithMetadata[currentIndex + 1]);
    } else {
      // Wrap around to the first track
      playTrack(tracksWithMetadata[0]);
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressBarRef.current || !audioRef.current) return;

    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleLyrics = () => {
    setShowLyrics(!showLyrics);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <audio ref={audioRef} src={currentTrack?.src} />
      
      <div className="flex justify-end mb-4 gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="rounded-full"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleLyrics}
          className={cn(
            "rounded-full",
            showLyrics && "text-primary"
          )}
          disabled={!currentTrack}
        >
          <FileText className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-full aspect-square mb-4 bg-muted rounded-xl overflow-hidden shadow-lg">
            {currentTrack ? (
              <img 
                src={currentTrack.coverUrl || "default-cover.png"} 
                alt={currentTrack.title || "Album Cover"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src="default-cover.png" 
                alt="Default Cover" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="w-full text-center">
            <h2 className="text-xl font-bold truncate">
              {currentTrack?.title || "No track selected"}
            </h2>
            <p className="text-muted-foreground truncate">
              {currentTrack?.artist || "Select a track to play"}
            </p>
          </div>
        </div>
        
        <div className="md:col-span-2 flex flex-col">
          {showLyrics && currentTrack ? (
            <div className="relative h-full bg-card p-4 rounded-xl shadow-md overflow-auto">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setShowLyrics(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold mb-2">{currentTrack.title} - Lyrics</h3>
              <div className="whitespace-pre-line">
                {lyrics || "Loading lyrics..."}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <h3 className="font-semibold mb-4">Playlist</h3>
                <div className="overflow-y-auto max-h-[300px] rounded-lg bg-card shadow-md">
                  {tracksWithMetadata.map((track, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "playlist-item flex items-center",
                        currentTrack?.src === track.src && "active"
                      )}
                      onClick={() => playTrack(track)}
                    >
                      <div className="w-8 text-center text-muted-foreground mr-2">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{track.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-xl shadow-md">
        <div 
          className="audio-progress mb-2"
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          <div 
            className="audio-progress-bar"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground mb-3">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
        
        <div className="flex justify-center items-center gap-4">
          <button 
            className="audio-control-button"
            onClick={playPreviousTrack}
            disabled={!currentTrack}
            aria-label="Previous track"
          >
            <SkipBack className="h-6 w-6" />
          </button>
          
          <button 
            className="audio-control-button bg-primary text-primary-foreground p-4"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>
          
          <button 
            className="audio-control-button"
            onClick={playNextTrack}
            disabled={!currentTrack}
            aria-label="Next track"
          >
            <SkipForward className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
