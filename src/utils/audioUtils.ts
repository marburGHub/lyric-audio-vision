import { toast } from "sonner";

interface Track {
  src: string;
  lyrics: string;
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
}

export const PLAYLIST: Track[] = [
  { src: 'audio/1 - Intro.mp3', lyrics: 'lyrics/1 - Intro.txt' },
  { src: 'audio/2 - La Forza Gentile.mp3', lyrics: 'lyrics/2 - La Forza Gentile.txt' },
  { src: 'audio/3 - Vineyard Driver.mp3', lyrics: 'lyrics/3 - Vineyard Driver.txt' },
  { src: 'audio/4 - Giardino dei colori.mp3', lyrics: 'lyrics/4 - Giardino dei colori.txt' },
  { src: "audio/5 - L'imbianchino e il campione.mp3", lyrics: "lyrics/5 - L'imbianchino e il campione.txt" },
  { src: "audio/6 - L'Alchimista dei Sensi.mp3", lyrics: "lyrics/6 - L'Alchimista dei Sensi.txt" },
  { src: 'audio/7 - Digital Renaissance Man.mp3', lyrics: 'lyrics/7 - Digital Renaissance Man.txt' },
  { src: 'audio/8 - Gustanti Viaggiatori.mp3', lyrics: 'lyrics/8 - Gustanti Viaggiatori.txt' }
];

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const extractFilename = (path: string): string => {
  const filename = path.split('/').pop() || '';
  return filename.replace('.mp3', '').replace(/^\d+\s-\s/, '');
};

export async function fetchLyrics(lyricsPath: string): Promise<string> {
  try {
    const response = await fetch(lyricsPath);
    if (!response.ok) {
      throw new Error('Failed to fetch lyrics');
    }
    return await response.text();
  } catch (error) {
    toast.error("Couldn't load lyrics");
    console.error("Error loading lyrics:", error);
    return "Lyrics not available";
  }
}

export async function readID3Tags(audioElement: HTMLAudioElement, track: Track): Promise<Track> {
  // Note: In a real implementation, we would use a library like jsmediatags or music-metadata-browser
  // Since we need to keep this simple and in a single file, we'll simulate ID3 tag reading
  // by extracting information from the filename
  
  const filename = track.src.split('/').pop() || '';
  const titleMatch = filename.match(/^\d+\s-\s(.+)\.mp3$/);
  
  const updatedTrack = { 
    ...track,
    title: titleMatch ? titleMatch[1] : filename.replace('.mp3', ''),
    artist: "Various Artists",
    album: "Audio Player Demo"
  };
  
  // In a real implementation, we would extract the cover from ID3 tags
  // For this demo, we'll use a simulated cover path
  try {
    // Try to load a cover image with the same name as the track
    const coverPath = `covers/${filename.replace('.mp3', '.jpg')}`;
    
    // Check if the cover exists by attempting to fetch it
    const response = await fetch(coverPath, { method: 'HEAD' });
    if (response.ok) {
      updatedTrack.coverUrl = coverPath;
    }
  } catch (error) {
    // If no cover is found, we'll use the default in the player component
    console.log("No custom cover found for track");
  }
  
  return updatedTrack;
}
