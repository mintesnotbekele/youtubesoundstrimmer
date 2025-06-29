export interface AudioFile {
  id: string;
  filename: string;
  duration: number;
  size: number;
  url: string;
  createdAt: string;
}

export interface TrimRange {
  start: number;
  end: number;
}

export interface ProcessingStatus {
  status: 'idle' | 'extracting' | 'processing' | 'trimming' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  author: string;
}

export interface TrimmedAudio {
  id: string;
  originalFileId: string;
  startTime: number;
  endTime: number;
  duration: number;
  downloadUrl: string;
  filename: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExtractAudioRequest {
  url: string;
}

export interface TrimAudioRequest {
  fileId: string;
  startTime: number;
  endTime: number;
  format?: 'mp3' | 'aac';
}

export interface PresetTrim {
  label: string;
  duration: number;
  description: string;
} 