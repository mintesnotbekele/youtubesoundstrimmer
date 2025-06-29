# YouTube Audio Trimmer

A fully client-side React application built with Next.js and Tailwind CSS that allows users to extract audio from YouTube videos, visualize it as a waveform, and trim it to their desired length.

## Features

- 🎵 **YouTube Audio Extraction**: Paste any YouTube URL to extract audio
- 📊 **Waveform Visualization**: Interactive waveform display using WaveSurfer.js
- ✂️ **Audio Trimming**: Select start and end points for precise trimming
- 🎧 **Audio Preview**: Preview trimmed sections before downloading
- 💾 **Download Support**: Download trimmed audio as WAV files
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🌙 **Dark Theme**: Beautiful dark-themed UI with Tailwind CSS
- ⚡ **Real-time Processing**: Client-side audio processing using Web Audio API

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Audio Processing**: WaveSurfer.js, Web Audio API
- **Icons**: Heroicons
- **UI Components**: Headless UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd youtube-audio-trimmer-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Paste YouTube URL**: Enter a valid YouTube video URL in the input field
2. **Extract Audio**: Click "Extract Audio" to process the video
3. **View Waveform**: The audio will be displayed as an interactive waveform
4. **Set Trim Points**: Use the time inputs or preset buttons to set start/end times
5. **Preview**: Click "Preview Trimmed" to hear the selected section
6. **Download**: Click "Download MP3" to save the trimmed audio

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── extract-audio/
│   │       └── route.ts          # API route for audio extraction
│   │   
│   ├── globals.css               # Global styles and Tailwind config
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main page component
├── components/
│   └── YouTubeAudioTrimmer.tsx   # Main audio trimmer component
├── store/
│   └── audioStore.ts             # Zustand store for state management
└── types/
    └── index.ts                  # TypeScript type definitions
```

## API Integration

The application includes a mock API endpoint at `/api/extract-audio` that simulates YouTube audio extraction. In a production environment, you would:

1. Replace the mock implementation with a real YouTube audio extraction service
2. Use libraries like `yt-dlp` or similar tools
3. Implement proper error handling and rate limiting
4. Add authentication if required

### Example API Response

```json
{
  "success": true,
  "data": {
    "id": "1234567890",
    "filename": "extracted_audio.mp3",
    "duration": 120,
    "size": 2048000,
    "audioUrl": "https://example.com/audio.mp3",
    "videoInfo": {
      "title": "Sample YouTube Video",
      "duration": 120,
      "thumbnail": "https://example.com/thumbnail.jpg",
      "author": "Sample Channel"
    }
  }
}
```

## Audio Processing

The application uses the Web Audio API for client-side audio processing:

- **Audio Decoding**: Converts audio files to AudioBuffer
- **Trimming**: Extracts selected time ranges
- **Format Conversion**: Converts to WAV format for download
- **Real-time Preview**: Plays trimmed sections without downloading

## State Management

The application uses Zustand for state management with the following store structure:

- `currentAudio`: Currently loaded audio file
- `videoInfo`: YouTube video metadata
- `processingStatus`: Current processing state
- `trimRange`: Start and end times for trimming
- `trimmedAudio`: Information about the last trimmed audio
- `isPlaying`: Audio playback state
- `currentTime`: Current playback position
- `duration`: Total audio duration

## Styling

The application uses Tailwind CSS with a custom dark theme:

- **Primary Colors**: Indigo/purple palette
- **Background**: Dark gray theme
- **Components**: Custom card, button, and input styles
- **Responsive**: Mobile-first design approach

## Browser Compatibility

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

## Limitations

- **CORS Restrictions**: Audio extraction requires a backend service
- **File Size**: Large audio files may cause performance issues
- **Browser Support**: Web Audio API not available in older browsers
- **YouTube Terms**: Ensure compliance with YouTube's terms of service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [WaveSurfer.js](https://wavesurfer-js.org/) for waveform visualization
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Heroicons](https://heroicons.com/) for icons 