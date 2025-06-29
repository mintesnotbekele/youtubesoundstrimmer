import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  AudioFile, 
  ProcessingStatus, 
  TrimRange, 
  VideoInfo, 
  TrimmedAudio,
  PresetTrim 
} from '@/types';

interface AudioState {
  // State
  currentAudio: AudioFile | null;
  videoInfo: VideoInfo | null;
  processingStatus: ProcessingStatus;
  trimRange: TrimRange;
  trimmedAudio: TrimmedAudio | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // Preset trim options
  presetTrims: PresetTrim[];
  
  // Actions
  setCurrentAudio: (audio: AudioFile | null) => void;
  setVideoInfo: (info: VideoInfo | null) => void;
  setProcessingStatus: (status: ProcessingStatus) => void;
  setTrimRange: (range: TrimRange) => void;
  setTrimmedAudio: (audio: TrimmedAudio | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  reset: () => void;
  applyPresetTrim: (preset: PresetTrim) => void;
}

const initialState = {
  currentAudio: null,
  videoInfo: null,
  processingStatus: {
    status: 'idle' as const,
    progress: 0,
    message: '',
  },
  trimRange: { start: 0, end: 0 },
  trimmedAudio: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  presetTrims: [
    { label: '15s', duration: 15, description: '15 seconds' },
    { label: '30s', duration: 30, description: '30 seconds' },
    { label: '60s', duration: 60, description: '1 minute' },
    { label: '2min', duration: 120, description: '2 minutes' },
    { label: '5min', duration: 300, description: '5 minutes' },
  ],
};

export const useAudioStore = create<AudioState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setCurrentAudio: (audio) => set({ currentAudio: audio }),
      
      setVideoInfo: (info) => set({ videoInfo: info }),
      
      setProcessingStatus: (status) => set({ processingStatus: status }),
      
      setTrimRange: (range) => set({ trimRange: range }),
      
      setTrimmedAudio: (audio) => set({ trimmedAudio: audio }),
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      setCurrentTime: (time) => set({ currentTime: time }),
      
      setDuration: (duration) => set({ duration }),
      
      reset: () => set(initialState),
      
      applyPresetTrim: (preset) => {
        const { duration } = get();
        const endTime = Math.min(preset.duration, duration);
        set({
          trimRange: {
            start: 0,
            end: endTime,
          },
        });
      },
    }),
    {
      name: 'audio-store',
    }
  )
); 