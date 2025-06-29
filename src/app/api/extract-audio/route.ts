import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';

const execAsync = util.promisify(exec);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[START] Received POST request for audio extraction');

    const body = await request.json();
    console.log('[INFO] Parsed request body:', body);

    const { url } = body;

    // Validate YouTube URL
    console.log('[INFO] Validating YouTube URL...');
    const youtubePattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/;
    if (!youtubePattern.test(url)) {
      console.warn('[WARN] Invalid YouTube URL:', url);
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const fileName = `${id}.mp3`;
    const publicDir = path.resolve(process.cwd(), 'public/audio');
    const outputPath = path.join(publicDir, fileName);

    console.log('[INFO] Creating directory:', publicDir);
    fs.mkdirSync(publicDir, { recursive: true });

    // Convert Windows backslashes to forward slashes
    const safeOutputPath = outputPath.replace(/\\/g, '/');
    
    // First, get video information
    console.log('[INFO] Getting video information...');
    const infoCommand = `python -m yt_dlp --dump-json "${url}"`;
    const { stdout: infoStdout, stderr: infoStderr } = await execAsync(infoCommand);
    
    if (infoStderr) {
      console.warn('[WARN] yt_dlp info stderr:', infoStderr);
    }
    
    let videoInfo;
    try {
      videoInfo = JSON.parse(infoStdout);
    } catch (parseError) {
      console.error('[ERROR] Failed to parse video info:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to get video information' },
        { status: 500 }
      );
    }

    // Extract audio
    const command = `python -m yt_dlp -x --audio-format mp3 -o "${safeOutputPath}" "${url}"`;

    console.log('[INFO] Executing command:', command);

    const { stdout, stderr } = await execAsync(command);
    console.log('[SUCCESS] yt_dlp stdout:', stdout);
    if (stderr) {
      console.warn('[WARN] yt_dlp stderr:', stderr);
    }

    console.log('[INFO] Checking output file:', outputPath);
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;

    console.log('[SUCCESS] Audio extraction completed. File size:', fileSize);

    return NextResponse.json({
      success: true,
      data: {
        id,
        filename: fileName,
        size: fileSize,
        duration: videoInfo.duration || 0,
        audioUrl: `/audio/${fileName}`,
        videoInfo: {
          title: videoInfo.title || 'Unknown Title',
          author: videoInfo.uploader || 'Unknown Author',
          duration: videoInfo.duration || 0,
          thumbnail: videoInfo.thumbnail || '',
          description: videoInfo.description || '',
          uploadDate: videoInfo.upload_date || '',
          viewCount: videoInfo.view_count || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Audio extraction failed:', error?.message || error);
    return NextResponse.json(
      { success: false, error: `Failed to extract audio: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
