'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useAudioStore } from '@/store/audioStore';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ScissorsIcon
} from '@heroicons/react/24/outline';


const YouTubeAudioTrimmer: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const {
    currentAudio,
    videoInfo,
    processingStatus,
    trimRange,
    trimmedAudio,
    isPlaying,
    currentTime,
    duration,
    presetTrims,
    setCurrentAudio,
    setVideoInfo,
    setProcessingStatus,
    setTrimRange,
    setTrimmedAudio,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    reset,
    applyPresetTrim
  } = useAudioStore();

  // YouTube URL validation
  const validateYouTubeUrl = useCallback((url: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/,
      /^(https?:\/\/)?(www\.)?(youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/
    ];
    return patterns.some(pattern => pattern.test(url));
  }, []);


  
  // Initialize WaveSurfer
  useEffect(() => {
    console.log('WaveSurfer useEffect triggered');
    console.log('waveformRef.current:', waveformRef.current);
    console.log('wavesurferRef.current:', wavesurferRef.current);
    
    if (waveformRef.current && !wavesurferRef.current) {
      console.log('Initializing WaveSurfer...');
      
      try {
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#6366f1',
          progressColor: '#a855f7',
          cursorColor: '#ffffff',
          barWidth: 3,
          barRadius: 4,
          cursorWidth: 2,
          height: 120,
          barGap: 2,
          normalize: true,
          hideScrollbar: true,
          interact: true,
          fillParent: true,
          autoCenter: true,
          backend: 'WebAudio'
        });

        console.log('WaveSurfer instance created:', wavesurferRef.current);

        // Event listeners
        wavesurferRef.current.on('ready', () => {
          console.log('WaveSurfer ready event fired');
          const audioDuration = wavesurferRef.current!.getDuration();
          setDuration(audioDuration);
          setProcessingStatus({ status: 'completed', progress: 100, message: 'Audio loaded successfully' });
          setIsExtracting(false);
          setIsWaveSurferReady(true);
          
          // Set initial volume and playback rate
          try {
            wavesurferRef.current!.setVolume(volume);
            wavesurferRef.current!.setPlaybackRate(playbackRate);
            if (isMuted) {
              wavesurferRef.current!.setMuted(true);
            }
          } catch (error) {
            console.error('Error setting initial audio properties:', error);
          }
        });

        wavesurferRef.current.on('audioprocess', (currentTime: number) => {
          setCurrentTime(currentTime);
        });

        wavesurferRef.current.on('play', () => {
          console.log('Audio playback started');
          setIsPlaying(true);
        });

        wavesurferRef.current.on('pause', () => {
          console.log('Audio playback paused');
          setIsPlaying(false);
        });

        wavesurferRef.current.on('finish', () => {
          console.log('Audio playback finished');
          setIsPlaying(false);
          // Don't auto-restart, let user control
        });

        wavesurferRef.current.on('error', (error: Error) => {
          console.error('WaveSurfer error:', error);
          setError(`Audio player error: ${error.message}`);
          setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to load audio' });
          setIsExtracting(false);
          setIsWaveSurferReady(false);
        });

        wavesurferRef.current.on('loading', (progress: number) => {
          console.log('WaveSurfer loading progress:', progress);
          setProcessingStatus({ 
            status: 'extracting', 
            progress: 90 + (progress * 0.1), 
            message: `Loading audio: ${Math.round(progress)}%` 
          });
        });

        console.log('WaveSurfer initialized successfully');
        setIsWaveSurferReady(true);
      } catch (error) {
        console.error('Failed to initialize WaveSurfer:', error);
        setError('Failed to initialize audio player');
        setIsWaveSurferReady(false);
      }
    }

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          console.error('Error destroying WaveSurfer:', error);
        }
        wavesurferRef.current = null;
      }
      setIsWaveSurferReady(false);
    };
  }, [setDuration, setCurrentTime, setIsPlaying, setProcessingStatus, volume, playbackRate, isMuted]);

  // Reset WaveSurfer ready state when component unmounts or on error
  useEffect(() => {
    return () => {
      setIsWaveSurferReady(false);
    };
  }, []);

  // Check waveform container availability
  useEffect(() => {
    const checkContainer = () => {
      console.log('Checking waveform container...');
      console.log('waveformRef.current:', waveformRef.current);
      console.log('Container exists:', !!waveformRef.current);
      if (waveformRef.current) {
        console.log('Container dimensions:', waveformRef.current.offsetWidth, 'x', waveformRef.current.offsetHeight);
      }
    };
    
    // Check immediately
    checkContainer();
    
    // Check again after a short delay
    const timer = setTimeout(checkContainer, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle URL input changes
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setIsValidUrl(validateYouTubeUrl(url));
    setError(null);
  };

  // Extract audio from YouTube URL
  const extractAudio = async () => {
    if (!isValidUrl) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setProcessingStatus({ status: 'extracting', progress: 0, message: 'Initializing extraction...' });

    try {
      // Simulate progress updates
      const progressSteps = [
        { progress: 20, message: 'Fetching video information...' },
        { progress: 40, message: 'Extracting audio stream...' },
        { progress: 60, message: 'Processing audio data...' },
        { progress: 80, message: 'Preparing waveform...' }
      ];

      for (const step of progressSteps) {
        setProcessingStatus({ status: 'extracting', progress: step.progress, message: step.message });
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Using the API endpoint for YouTube audio extraction
      const response = await fetch('/api/extract-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success) {
        const audioUrl = new URL(data.data.audioUrl, window.location.origin).href;
        console.log('Audio URL constructed:', audioUrl);
        console.log('Video info received:', data.data.videoInfo);
        
        setProcessingStatus({ status: 'extracting', progress: 90, message: 'Loading audio into player...' });
      
        try {
          // Verify the audio file exists by making a HEAD request
          const audioCheckResponse = await fetch(audioUrl, { method: 'HEAD' });
          if (!audioCheckResponse.ok) {
            throw new Error(`Audio file not found: ${audioCheckResponse.status} ${audioCheckResponse.statusText}`);
          }
          console.log('Audio file verified, size:', audioCheckResponse.headers.get('content-length'));
          
          // Set video info and current audio first
          setVideoInfo(data.data.videoInfo);
          setCurrentAudio({
            id: data.data.id,
            filename: data.data.filename,
            duration: data.data.duration,
            size: data.data.size,
            url: data.data.audioUrl,
            createdAt: new Date().toISOString(),
          });
          
          // Clean up existing WaveSurfer if needed and reload
          if (wavesurferRef.current) {
            console.log('Cleaning up existing WaveSurfer before loading new audio...');
            try {
              wavesurferRef.current.pause();
            } catch (error) {
              console.log('No current playback to pause');
            }
          }
          
          // Then load audio into waveform
          await loadAudioIntoWaveform(audioUrl);
          
        } catch (waveformError) {
          const errorMessage = waveformError instanceof Error ? waveformError.message : 'Failed to load audio into waveform';
          console.error('Waveform loading error:', waveformError);
          
          // If WaveSurfer is not ready, try to wait for it
          if (errorMessage.includes('not ready') || errorMessage.includes('not initialized')) {
            console.log('Waiting for WaveSurfer to be ready...');
            setProcessingStatus({ status: 'extracting', progress: 85, message: 'Waiting for audio player to be ready...' });
            
            // Wait for WaveSurfer to be ready (max 10 seconds)
            let attempts = 0;
            const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
            
            while (!isWaveSurferReady && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
              attempts++;
            }
            
            if (isWaveSurferReady) {
              console.log('WaveSurfer is now ready, retrying audio load...');
              setProcessingStatus({ status: 'extracting', progress: 90, message: 'Retrying audio load...' });
              
              try {
                await loadAudioIntoWaveform(audioUrl);
                return; // Success, exit early
              } catch (retryError) {
                const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Retry failed';
                console.error('Retry failed:', retryError);
                setError(`Failed to load audio after retry: ${retryErrorMessage}`);
                setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to load audio after retry' });
                setIsExtracting(false);
                return;
              }
            }
          }
          
          setError(errorMessage);
          setProcessingStatus({ status: 'error', progress: 0, message: errorMessage });
          setIsExtracting(false);
          return;
        }
      } else {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Extract audio error:', err);
      setError(errorMessage);
      setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to extract audio' });
      setIsExtracting(false);
    }
  };

  // Audio Control Functions
  const togglePlayPause = () => {
    try {
      if (!wavesurferRef.current) {
        throw new Error('Audio player is not initialized');
      }
      
      if (isPlaying) {
        wavesurferRef.current.pause();
        console.log('Audio paused');
      } else {
        wavesurferRef.current.play();
        console.log('Audio started playing');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to control playback';
      console.error('Playback control error:', error);
      setError(`Playback error: ${errorMessage}`);
    }
  };

  const seekTo = (time: number) => {
    try {
      if (!wavesurferRef.current) {
        throw new Error('Audio player is not initialized');
      }
      
      if (time < 0 || time > duration) {
        throw new Error(`Invalid seek time: ${time}. Must be between 0 and ${duration}`);
      }
      
      wavesurferRef.current.setTime(time);
      console.log(`Seeked to ${time}s`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to seek';
      console.error('Seek error:', error);
      setError(`Seek error: ${errorMessage}`);
    }
  };

  const setAudioVolume = (newVolume: number) => {
    try {
      if (!wavesurferRef.current) {
        throw new Error('Audio player is not initialized');
      }
      
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      wavesurferRef.current.setVolume(clampedVolume);
      setVolume(clampedVolume);
      console.log(`Volume set to ${clampedVolume}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set volume';
      console.error('Volume control error:', error);
      setError(`Volume error: ${errorMessage}`);
    }
  };

  const toggleMute = () => {
    try {
      if (!wavesurferRef.current) {
        throw new Error('Audio player is not initialized');
      }
      
      const newMutedState = !isMuted;
      wavesurferRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
      console.log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle mute';
      console.error('Mute control error:', error);
      setError(`Mute error: ${errorMessage}`);
    }
  };

  const setPlaybackSpeed = (speed: number) => {
    try {
      if (!wavesurferRef.current) {
        throw new Error('Audio player is not initialized');
      }
      
      const clampedSpeed = Math.max(0.25, Math.min(4, speed));
      wavesurferRef.current.setPlaybackRate(clampedSpeed);
      setPlaybackRate(clampedSpeed);
      console.log(`Playback speed set to ${clampedSpeed}x`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set playback speed';
      console.error('Speed control error:', error);
      setError(`Speed error: ${errorMessage}`);
    }
  };

  const skipForward = (seconds: number = 10) => {
    try {
      const newTime = Math.min(currentTime + seconds, duration);
      seekTo(newTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip forward';
      console.error('Skip forward error:', error);
      setError(`Skip error: ${errorMessage}`);
    }
  };

  const skipBackward = (seconds: number = 10) => {
    try {
      const newTime = Math.max(currentTime - seconds, 0);
      seekTo(newTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip backward';
      console.error('Skip backward error:', error);
      setError(`Skip error: ${errorMessage}`);
    }
  };

  const restartAudio = () => {
    try {
      seekTo(0);
      if (!isPlaying) {
        togglePlayPause();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restart audio';
      console.error('Restart error:', error);
      setError(`Restart error: ${errorMessage}`);
    }
  };

  // Set trim markers (simplified version without markers plugin)
  const setTrimMarkers = () => {
    if (wavesurferRef.current && duration > 0) {
      // For now, we'll just update the trim range based on current time
      const currentTime = wavesurferRef.current.getCurrentTime();
      if (trimRange.start === 0) {
        setTrimRange({ start: currentTime, end: Math.min(currentTime + 30, duration) });
      } else {
        setTrimRange({ start: trimRange.start, end: Math.min(currentTime, duration) });
      }
    }
  };

  // Preview trimmed section
  const previewTrimmed = () => {
    if (wavesurferRef.current && trimRange.start < trimRange.end) {
      wavesurferRef.current.setTime(trimRange.start);
      wavesurferRef.current.play();
      
      // Stop at end time
      const checkTime = () => {
        if (wavesurferRef.current && currentTime >= trimRange.end) {
          wavesurferRef.current.pause();
          return;
        }
        requestAnimationFrame(checkTime);
      };
      checkTime();
    }
  };

  // Download trimmed audio with optimizations
  const downloadTrimmedAudio = async () => {
    if (!currentAudio || trimRange.start >= trimRange.end) {
      setError('Please select a valid trim range');
      return;
    }

    setProcessingStatus({ status: 'trimming', progress: 0, message: 'Initializing download...' });

    try {
      // Create audio context for processing
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Fetch the audio file with progress tracking
      setProcessingStatus({ status: 'trimming', progress: 10, message: 'Downloading audio file...' });
      
      const response = await fetch(currentAudio.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // Read the response as a stream for better performance
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to create stream reader');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Update progress every 5% or 1MB
        if (totalSize > 0 && (receivedLength % Math.max(totalSize * 0.05, 1024 * 1024)) < value.length) {
          const progress = Math.min(30, 10 + (receivedLength / totalSize) * 20);
          setProcessingStatus({ 
            status: 'trimming', 
            progress: Math.round(progress), 
            message: `Downloading: ${Math.round((receivedLength / totalSize) * 100)}%` 
          });
        }
      }

      // Combine chunks into single array buffer
      setProcessingStatus({ status: 'trimming', progress: 35, message: 'Processing audio data...' });
      
      const arrayBuffer = new ArrayBuffer(receivedLength);
      const uint8Array = new Uint8Array(arrayBuffer);
      let offset = 0;
      
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Decode audio in chunks to prevent blocking
      setProcessingStatus({ status: 'trimming', progress: 50, message: 'Decoding audio...' });
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Calculate trim points
      const startSample = Math.floor(trimRange.start * audioBuffer.sampleRate);
      const endSample = Math.floor(trimRange.end * audioBuffer.sampleRate);
      const trimmedLength = endSample - startSample;
      
      setProcessingStatus({ status: 'trimming', progress: 70, message: 'Creating trimmed audio...' });
      
      // Create new audio buffer for trimmed section
      const trimmedBuffer = audioContextRef.current.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
      );
      
      // Copy trimmed section in chunks to prevent blocking
      const chunkSize = 44100; // 1 second of audio at 44.1kHz
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        
        for (let i = 0; i < trimmedLength; i += chunkSize) {
          const end = Math.min(i + chunkSize, trimmedLength);
          for (let j = i; j < end; j++) {
            trimmedData[j] = channelData[startSample + j];
          }
          
          // Yield control to prevent blocking
          if (i % (chunkSize * 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
      
      setProcessingStatus({ status: 'trimming', progress: 90, message: 'Converting to WAV format...' });
      
      // Convert to WAV format with optimized processing and timeout
      const wavPromise = audioBufferToWavOptimized(trimmedBuffer);
      
      // Add timeout for WAV conversion (30 seconds)
      const timeoutPromise = new Promise<Blob>((_, reject) => {
        setTimeout(() => reject(new Error('WAV conversion timed out')), 30000);
      });
      
      const wavBlob = await Promise.race([wavPromise, timeoutPromise]);
      
      setProcessingStatus({ status: 'trimming', progress: 95, message: 'Preparing download...' });
      
      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trimmed_audio_${trimRange.start.toFixed(1)}s_to_${trimRange.end.toFixed(1)}s.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setProcessingStatus({ status: 'completed', progress: 100, message: 'Download completed successfully' });
      
      // Store trimmed audio info
      setTrimmedAudio({
        id: Date.now().toString(),
        originalFileId: currentAudio.id,
        startTime: trimRange.start,
        endTime: trimRange.end,
        duration: trimRange.end - trimRange.start,
        downloadUrl: url,
        filename: a.download,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process audio';
      console.error('Download error:', err);
      
      // If WAV conversion timed out, offer MP3 fallback
      if (errorMessage.includes('timed out')) {
        setError('WAV conversion took too long. Try downloading the original MP3 instead.');
        setProcessingStatus({ status: 'error', progress: 0, message: 'WAV conversion timed out' });
      } else {
        setError(errorMessage);
        setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to process audio' });
      }
    }
  };

  // Download trimmed section as MP3 (faster alternative)
  const downloadTrimmedMP3 = async () => {
    if (!currentAudio || trimRange.start >= trimRange.end) {
      setError('Please select a valid trim range');
      return;
    }

    setProcessingStatus({ status: 'trimming', progress: 0, message: 'Preparing trimmed audio...' });

    try {
      // Create audio context for processing
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Fetch the audio file
      setProcessingStatus({ status: 'trimming', progress: 20, message: 'Downloading audio file...' });
      
      const response = await fetch(currentAudio.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Decode audio
      setProcessingStatus({ status: 'trimming', progress: 40, message: 'Processing audio...' });
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Calculate trim points
      const startSample = Math.floor(trimRange.start * audioBuffer.sampleRate);
      const endSample = Math.floor(trimRange.end * audioBuffer.sampleRate);
      const trimmedLength = endSample - startSample;
      
      setProcessingStatus({ status: 'trimming', progress: 60, message: 'Creating trimmed audio...' });
      
      // Create new audio buffer for trimmed section
      const trimmedBuffer = audioContextRef.current.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
      );
      
      // Copy trimmed section
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        
        for (let i = 0; i < trimmedLength; i++) {
          trimmedData[i] = channelData[startSample + i];
        }
      }
      
      setProcessingStatus({ status: 'trimming', progress: 80, message: 'Converting to audio format...' });
      
      // Convert to WAV format (simpler than MP3)
      const wavBlob = await audioBufferToWavOptimized(trimmedBuffer);
      
      setProcessingStatus({ status: 'trimming', progress: 95, message: 'Preparing download...' });
      
      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trimmed_audio_${trimRange.start.toFixed(1)}s_to_${trimRange.end.toFixed(1)}s.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setProcessingStatus({ status: 'completed', progress: 100, message: 'Trimmed audio download completed' });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process trimmed audio';
      console.error('Trimmed audio download error:', err);
      setError(errorMessage);
      setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to process trimmed audio' });
    }
  };

  // Optimized WAV conversion function with progress tracking
  const audioBufferToWavOptimized = async (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const length = buffer.length;
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * numberOfChannels * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numberOfChannels * 2, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * numberOfChannels * 2, true);
      
      // Process audio data in much smaller chunks to prevent blocking
      const processChunk = (startIndex: number, chunkSize: number) => {
        const endIndex = Math.min(startIndex + chunkSize, length);
        let offset = 44 + startIndex * numberOfChannels * 2;
        
        for (let i = startIndex; i < endIndex; i++) {
          for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
          }
        }
        
        // Update progress every 10% or every 100 chunks
        const progress = Math.round((endIndex / length) * 100);
        if (progress % 10 === 0 || endIndex % (chunkSize * 100) < chunkSize) {
          setProcessingStatus({ 
            status: 'trimming', 
            progress: 90 + Math.round((progress / 100) * 5), 
            message: `Converting to WAV: ${progress}%` 
          });
        }
        
        // If there's more data to process, continue in next tick
        if (endIndex < length) {
          // Use requestAnimationFrame for better performance
          requestAnimationFrame(() => processChunk(endIndex, chunkSize));
        } else {
          // All data processed, resolve with blob
          resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
        }
      };
      
      // Start processing with much smaller chunks (0.1 second = 4410 samples)
      const chunkSize = 4410;
      processChunk(0, chunkSize);
    });
  };

  // Helper function to convert AudioBuffer to WAV (legacy - keeping for compatibility)
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  
 const loadAudioIntoWaveform = (url: string) => {
   return new Promise<void>((resolve, reject) => {
    const ws = wavesurferRef.current;

    if (!ws) {
      console.error('WaveSurfer not initialized');
      reject(new Error("WaveSurfer not initialized"));
      return;
    }

    console.log('Loading audio URL:', url);

    const handleReady = () => {
      console.log('Audio loaded successfully into WaveSurfer');
      ws.un('ready', handleReady);
      ws.un('error', handleError);
      resolve();
    };

    const handleError = (e: any) => {
      console.error('WaveSurfer load error:', e);
      ws.un('ready', handleReady);
      ws.un('error', handleError);
      reject(new Error(`Failed to load audio: ${e?.message || 'Unknown error'}`));
    };

    // Add timeout for loading
    const timeoutId = setTimeout(() => {
      console.error('Audio load timed out');
      ws.un('ready', handleReady);
      ws.un('error', handleError);
      reject(new Error('Audio load timed out after 15 seconds'));
    }, 15000);

    const handleReadyWithTimeout = () => {
      clearTimeout(timeoutId);
      handleReady();
    };

    const handleErrorWithTimeout = (e: any) => {
      clearTimeout(timeoutId);
      handleError(e);
    };

    // Clean up any existing audio before loading new one
    try {
      ws.un('ready', handleReadyWithTimeout);
      ws.un('error', handleErrorWithTimeout);
    } catch (error) {
      console.log('No existing event listeners to clean up');
    }

    ws.on('ready', handleReadyWithTimeout);
    ws.on('error', handleErrorWithTimeout);

    try {
      // Stop any current playback and clear existing audio
      try {
        ws.pause();
      } catch (error) {
        console.log('No current playback to pause');
      }
      
      ws.load(url);
      console.log('WaveSurfer.load() called successfully');
    } catch (loadError) {
      console.error('Error calling WaveSurfer.load():', loadError);
      clearTimeout(timeoutId);
      ws.un('ready', handleReadyWithTimeout);
      ws.un('error', handleErrorWithTimeout);
      reject(new Error(`Failed to start audio loading: ${loadError}`));
    }
  });
};

  // Manual WaveSurfer initialization
  const initializeWaveSurfer = async () => {
    if (waveformRef.current && !wavesurferRef.current) {
      console.log('Manually initializing WaveSurfer...');
      try {
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#6366f1',
          progressColor: '#a855f7',
          cursorColor: '#ffffff',
          barWidth: 3,
          barRadius: 4,
          cursorWidth: 2,
          height: 120,
          barGap: 2,
          normalize: true,
          hideScrollbar: true,
          interact: true,
          fillParent: true,
          autoCenter: true,
          backend: 'WebAudio'
        });

        console.log('WaveSurfer instance created manually:', wavesurferRef.current);

        // Event listeners
        wavesurferRef.current.on('ready', () => {
          console.log('WaveSurfer ready event fired (manual)');
          const audioDuration = wavesurferRef.current!.getDuration();
          setDuration(audioDuration);
          setProcessingStatus({ status: 'completed', progress: 100, message: 'Audio loaded successfully' });
          setIsExtracting(false);
          setIsWaveSurferReady(true);
        });

        wavesurferRef.current.on('audioprocess', (currentTime: number) => {
          setCurrentTime(currentTime);
        });

        wavesurferRef.current.on('play', () => {
          setIsPlaying(true);
        });

        wavesurferRef.current.on('pause', () => {
          setIsPlaying(false);
        });

        wavesurferRef.current.on('finish', () => {
          setIsPlaying(false);
        });

        wavesurferRef.current.on('error', (error: Error) => {
          console.error('WaveSurfer error (manual):', error);
          setError(`WaveSurfer error: ${error.message}`);
          setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to load audio' });
          setIsExtracting(false);
          setIsWaveSurferReady(false);
        });

        wavesurferRef.current.on('loading', (progress: number) => {
          console.log('WaveSurfer loading progress (manual):', progress);
          setProcessingStatus({ 
            status: 'extracting', 
            progress: 90 + (progress * 0.1), 
            message: `Loading audio: ${Math.round(progress)}%` 
          });
        });

        console.log('WaveSurfer initialized successfully (manual)');
        setIsWaveSurferReady(true);
        
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return true;
      } catch (error) {
        console.error('Failed to initialize WaveSurfer (manual):', error);
        setError('Failed to initialize audio player');
        setIsWaveSurferReady(false);
        return false;
      }
    }
    return false;
  };

  // Reset WaveSurfer completely
  const resetWaveSurfer = () => {
    console.log('Resetting WaveSurfer...');
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.pause();
        wavesurferRef.current.destroy();
      } catch (error) {
        console.error('Error destroying WaveSurfer:', error);
      }
      wavesurferRef.current = null;
    }
    setIsWaveSurferReady(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setError(null);
  };

  // Comprehensive WaveSurfer test
  const comprehensiveTest = async () => {
    console.log('Comprehensive test called');
    
    // Clean up existing WaveSurfer instance if it exists
    if (wavesurferRef.current) {
      console.log('Destroying existing WaveSurfer instance...');
      try {
        wavesurferRef.current.destroy();
      } catch (error) {
        console.error('Error destroying WaveSurfer:', error);
      }
      wavesurferRef.current = null;
      setIsWaveSurferReady(false);
    }
    
    // Create new WaveSurfer instance
    console.log('Creating new WaveSurfer instance...');
    try {
      if (waveformRef.current) {
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#6366f1',
          progressColor: '#a855f7',
          cursorColor: '#ffffff',
          barWidth: 3,
          barRadius: 4,
          cursorWidth: 2,
          height: 120,
          barGap: 2,
          normalize: true,
          hideScrollbar: true,
          interact: true,
          fillParent: true,
          autoCenter: true,
          backend: 'WebAudio'
        });
        
        console.log('WaveSurfer created successfully');
        setIsWaveSurferReady(true);
      } else {
        setError('No waveform container available');
        return;
      }
    } catch (error) {
      console.error('Error creating WaveSurfer:', error);
      setError(`Failed to create WaveSurfer: ${error}`);
      return;
    }

    // Test loading audio
    try {
      setProcessingStatus({ status: 'extracting', progress: 0, message: 'Testing audio loading...' });
      
      const testUrl = 'http://localhost:3000/audio/8e9767cf-36f6-4bc0-ae24-82e61c3c0d41.mp3';
      
      // Create a promise to wait for the audio to load
      const loadPromise = new Promise<void>((resolve, reject) => {
        const ws = wavesurferRef.current!;
        
        const handleReady = () => {
          console.log('Audio loaded successfully');
          ws.un('ready', handleReady);
          ws.un('error', handleError);
          resolve();
        };

        const handleError = (error: any) => {
          console.error('Audio load error:', error);
          ws.un('ready', handleReady);
          ws.un('error', handleError);
          reject(new Error(`Failed to load audio: ${error?.message || 'Unknown error'}`));
        };

        ws.on('ready', handleReady);
        ws.on('error', handleError);
        
        // Load the audio
        ws.load(testUrl);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          ws.un('ready', handleReady);
          ws.un('error', handleError);
          reject(new Error('Audio load timed out'));
        }, 10000);
      });

      await loadPromise;
      
      // Test if audio is playable
      const ws = wavesurferRef.current!;
      const duration = ws.getDuration();
      console.log('Audio duration:', duration);
      
      if (duration > 0) {
        setProcessingStatus({ status: 'completed', progress: 100, message: 'Test successful - audio is playable' });
        setError(null);
        
        // Try to play a small portion
        ws.setTime(0);
        ws.play();
        setTimeout(() => {
          ws.pause();
          console.log('Test playback completed');
        }, 1000);
      } else {
        setError('Audio loaded but duration is 0');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      console.error('Comprehensive test error:', error);
      setError(`Test failed: ${errorMessage}`);
      setProcessingStatus({ status: 'error', progress: 0, message: 'Test failed' });
    }
  };

  // Simple WaveSurfer test
  const simpleTest = () => {
    console.log('Simple test called');
    console.log('wavesurferRef.current:', wavesurferRef.current);
    
    if (!wavesurferRef.current) {
      console.log('No WaveSurfer instance, trying to create one...');
      try {
        if (waveformRef.current) {
          wavesurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#6366f1',
            progressColor: '#a855f7',
            cursorColor: '#ffffff',
            barWidth: 3,
            barRadius: 4,
            cursorWidth: 2,
            height: 120,
            barGap: 2,
            normalize: true,
            hideScrollbar: true,
            interact: true,
            fillParent: true,
            autoCenter: true,
            backend: 'WebAudio'
          });
          
          // Add event listeners
          wavesurferRef.current.on('ready', () => {
            console.log('WaveSurfer ready event fired (simple test)');
            setError(null);
            setProcessingStatus({ status: 'completed', progress: 100, message: 'Test audio loaded successfully' });
          });

          wavesurferRef.current.on('error', (error: Error) => {
            console.error('WaveSurfer error (simple test):', error);
            setError(`WaveSurfer error: ${error.message}`);
          });

          wavesurferRef.current.on('loading', (progress: number) => {
            console.log('WaveSurfer loading progress (simple test):', progress);
            setProcessingStatus({ 
              status: 'extracting', 
              progress: progress, 
              message: `Loading test audio: ${Math.round(progress)}%` 
            });
          });
          
          console.log('WaveSurfer created in simple test:', wavesurferRef.current);
          setIsWaveSurferReady(true);
          setError(null);
        } else {
          setError('No waveform container available');
        }
      } catch (error) {
        console.error('Error creating WaveSurfer:', error);
        setError(`Failed to create WaveSurfer: ${error}`);
      }
    } else {
      console.log('WaveSurfer instance exists, testing load...');
      try {
        setProcessingStatus({ status: 'extracting', progress: 0, message: 'Loading test audio...' });
        const testUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
        wavesurferRef.current.load(testUrl);
        console.log('Test audio load initiated successfully');
        setError(null);
      } catch (error) {
        console.error('Error loading test audio:', error);
        setError(`Failed to load test audio: ${error}`);
      }
    }
  };

  // Optimized direct MP3 download
  const downloadOriginalMP3 = async () => {
    if (!currentAudio || !currentAudio.url) {
      setError('No audio file available for download');
      return;
    }

    setProcessingStatus({ status: 'trimming', progress: 0, message: 'Preparing MP3 download...' });

    try {
      // Create a temporary link for download
      const link = document.createElement('a');
      link.href = currentAudio.url;
      link.download = currentAudio.filename || 'audio.mp3';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setProcessingStatus({ status: 'completed', progress: 100, message: 'MP3 download initiated' });
      
      // Clear status after a delay
      setTimeout(() => {
        setProcessingStatus({ status: 'idle', progress: 0, message: '' });
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download MP3';
      console.error('MP3 download error:', error);
      setError(errorMessage);
      setProcessingStatus({ status: 'error', progress: 0, message: 'Failed to download MP3' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
            <MusicalNoteIcon className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          YouTube Audio Trimmer
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Extract, visualize, and trim audio from YouTube videos with professional precision
        </p>
      </div>

      {/* URL Input Section */}
      <div className="card backdrop-blur-sm bg-gray-800/50 border-gray-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <VideoCameraIcon className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white">YouTube URL</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={handleUrlChange}
                placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                className="input-field w-full pr-12"
                disabled={isExtracting}
              />
              {isValidUrl && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
              )}
            </div>
            <button
              onClick={extractAudio}
              disabled={!isValidUrl || isExtracting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isExtracting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Extracting...
                </>
              ) : (
                <>
                  <MusicalNoteIcon className="h-5 w-5" />
                  Extract Audio
                </>
              )}
            </button>
            <button
              onClick={simpleTest}
              className="btn-secondary flex items-center gap-2 min-w-[120px] justify-center"
            >
              <PlayIcon className="h-5 w-5" />
              Simple Test
            </button>
            <button
              onClick={comprehensiveTest}
              className="btn-secondary flex items-center gap-2 min-w-[140px] justify-center"
            >
              <PlayIcon className="h-5 w-5" />
              Full Test
            </button>
            <button
              onClick={resetWaveSurfer}
              className="btn-secondary flex items-center gap-2 min-w-[120px] justify-center"
            >
              <PlayIcon className="h-5 w-5" />
              Reset
            </button>
          </div>
          
          {/* Download MP3 Button */}
          {currentAudio && currentAudio.url && (
            <div className="flex justify-end mt-4">
              <button
                onClick={downloadOriginalMP3}
                className="btn-primary flex items-center gap-2"
                disabled={processingStatus.status === 'trimming'}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download MP3
              </button>
            </div>
          )}
          
          {/* Debug info */}
          <div className="text-xs text-gray-400 mt-2">
            WaveSurfer Status: {isWaveSurferReady ? 'Ready' : 'Initializing...'} | 
            Ref: {wavesurferRef.current ? 'Exists' : 'Null'} |
            Container: {waveformRef.current ? 'Exists' : 'Null'} |
            Audio: {currentAudio ? 'Loaded' : 'None'}
          </div>
          
          {error && (
            <ErrorMessage message={error} />
          )}
        </div>
      </div>

      {/* Video Info */}
      {videoInfo && (
        <div className="card backdrop-blur-sm bg-gray-800/50 border-gray-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <VideoCameraIcon className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Video Information</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative">
              <img 
                src={videoInfo.thumbnail} 
                alt={videoInfo.title}
                className="w-32 h-20 object-cover rounded-xl shadow-lg"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatTime(videoInfo.duration)}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-medium text-white line-clamp-2">{videoInfo.title}</h3>
              <p className="text-gray-400 flex items-center gap-2">
                <span>by</span>
                <span className="text-blue-400">{videoInfo.author}</span>
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{formatTime(videoInfo.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MusicalNoteIcon className="h-4 w-4" />
                  <span>Audio extracted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waveform Section */}
      <div className="card backdrop-blur-sm bg-gray-800/50 border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ScissorsIcon className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Audio Waveform</h2>
          </div>
          {currentAudio && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white font-medium">{formatTime(currentTime)}</div>
                <div className="text-gray-400 text-sm">{formatTime(duration)}</div>
              </div>
              <button
                onClick={togglePlayPause}
                className="btn-primary flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5" />
                    Play
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
          <div ref={waveformRef} className="waveform-container" />
          {!currentAudio && (
            <div className="text-center text-gray-400 py-8">
              <MusicalNoteIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Extract audio from a YouTube URL to see the waveform</p>
            </div>
          )}
        </div>
        
        {/* Trim Controls */}
        {currentAudio && (
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Trim Presets</h3>
              <div className="flex flex-wrap gap-3">
                {presetTrims.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPresetTrim(preset)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Start Time (seconds)
                </label>
                <input
                  type="number"
                  value={trimRange.start}
                  onChange={(e) => setTrimRange({ ...trimRange, start: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={duration}
                  step="0.1"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  End Time (seconds)
                </label>
                <input
                  type="number"
                  value={trimRange.end}
                  onChange={(e) => setTrimRange({ ...trimRange, end: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={duration}
                  step="0.1"
                  className="input-field w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={setTrimMarkers}
                className="btn-secondary flex items-center gap-2"
              >
                <ScissorsIcon className="h-4 w-4" />
                Set Markers
              </button>
              <button
                onClick={previewTrimmed}
                disabled={trimRange.start >= trimRange.end}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                Preview Trimmed
              </button>
              <button
                onClick={downloadTrimmedAudio}
                disabled={trimRange.start >= trimRange.end || processingStatus.status === 'trimming'}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingStatus.status === 'trimming' ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download WAV
                  </>
                )}
              </button>
              <button
                onClick={downloadTrimmedMP3}
                disabled={trimRange.start >= trimRange.end || processingStatus.status === 'trimming'}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Fast Download
              </button>
            </div>
            
            {trimRange.end > trimRange.start && (
              <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">Trimmed section ready</p>
                    <p className="text-green-300 text-sm">
                      Duration: {formatTime(trimRange.end - trimRange.start)} | 
                      Range: {formatTime(trimRange.start)} - {formatTime(trimRange.end)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing Status */}
      {processingStatus.status !== 'idle' && (
        <div className="card backdrop-blur-sm bg-gray-800/50 border-gray-700/50">
          <div className="flex items-center gap-4">
            {processingStatus.status === 'completed' ? (
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
            ) : processingStatus.status === 'error' ? (
              <div className="p-2 bg-red-500/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
            ) : (
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <LoadingSpinner />
              </div>
            )}
            <div className="flex-1">
              <p className="text-white font-medium">{processingStatus.message}</p>
              {processingStatus.status !== 'completed' && processingStatus.status !== 'error' && (
                <div className="progress-bar mt-3">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${processingStatus.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Downloads */}
      {trimmedAudio && (
        <div className="card backdrop-blur-sm bg-gray-800/50 border-gray-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ArrowDownTrayIcon className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Recent Download</h2>
          </div>
          
          <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{trimmedAudio.filename}</p>
                <p className="text-gray-400 text-sm">
                  Duration: {formatTime(trimmedAudio.duration)} | 
                  Range: {formatTime(trimmedAudio.startTime)} - {formatTime(trimmedAudio.endTime)}
                </p>
              </div>
              <div className="text-green-400">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeAudioTrimmer; 