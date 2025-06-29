import YouTubeAudioTrimmer from '@/components/YouTubeAudioTrimmer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12 fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            YouTube Audio Trimmer
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Extract audio from YouTube videos and trim them to your desired length with our powerful, client-side tool.
          </p>
        </header>
        
        <div className="fade-in" style={{ animationDelay: '0.2s' }}>
          <YouTubeAudioTrimmer />
        </div>
      </div>
    </main>
  );
} 