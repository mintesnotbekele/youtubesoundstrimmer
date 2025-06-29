import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YouTube Audio Trimmer',
  description: 'Extract and trim audio from YouTube videos with ease',
  keywords: ['YouTube', 'audio', 'trimmer', 'mp3', 'extract'],
  authors: [{ name: 'YouTube Audio Trimmer' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  );
} 