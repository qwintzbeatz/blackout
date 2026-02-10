import { NextRequest, NextResponse } from 'next/server';

// SoundCloud API configuration
const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';

// In-memory cache for track data ( expires after 5 minutes )
const trackCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached data
function getCached(url: string) {
  const entry = trackCache.get(url);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  return null;
}

// Set cache
function setCache(url: string, data: any) {
  trackCache.set(url, { data, timestamp: Date.now() });
}

// Validate SoundCloud URL
function isValidSoundCloudUrl(url: string): boolean {
  // Accept any soundcloud.com URL with at least 2 path segments
  const soundcloudRegex = /^https?:\/\/(soundcloud\.com|snd\.sc)\//i;
  return soundcloudRegex.test(url);
}

// Resolve SoundCloud track URL to stream URL
async function resolveSoundCloudTrack(
  url: string,
  clientId: string
): Promise<any> {
  const resolveUrl = `${SOUNDCLOUD_API_BASE}/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`;
  
  console.log('Fetching from SoundCloud API...');
  console.log('Client ID present:', !!clientId);
  
  const response = await fetch(resolveUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  console.log('SoundCloud response status:', response.status);
  
  // Handle rate limiting from SoundCloud
  if (response.status === 429) {
    throw new Error('SOUNDCLOUD_RATE_LIMIT');
  }
  
  // Log response headers for debugging
  console.log('Content-Type:', response.headers.get('content-type'));

  const responseText = await response.text();
  console.log('Response length:', responseText.length);
  console.log('Response preview:', responseText.substring(0, 500));

  if (!response.ok) {
    console.error(`SoundCloud resolve failed: ${response.status} ${response.statusText}`);
    return null;
  }

  try {
    const data = JSON.parse(responseText);
    console.log('Parsed JSON kind:', data.kind);

    if (!data || data.kind !== 'track') {
      console.error('Not a track or invalid response:', data);
      return null;
    }

    // Generate stream URL
    let streamUrl = null;
    if (data.streamable && data.id) {
      streamUrl = `${SOUNDCLOUD_API_BASE}/tracks/${data.id}/stream?client_id=${clientId}`;
    }

    return {
      id: data.id,
      title: data.title,
      artist: data.user?.username || 'Unknown',
      artwork: data.artwork_url || data.user?.avatar_url || null,
      duration: data.duration,
      streamUrl,
      streamable: data.streamable,
    };
  } catch (parseError) {
    console.error('Failed to parse SoundCloud response:', parseError);
    return null;
  }
}

// Get client ID from environment
function getClientId(): string {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!clientId) {
    throw new Error('MISSING_CLIENT_ID');
  }
  return clientId;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required', code: 'MISSING_URL' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidSoundCloudUrl(url)) {
      return NextResponse.json(
        { 
          error: 'Invalid SoundCloud URL format. Please provide a valid SoundCloud track URL.',
          code: 'INVALID_URL'
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = getCached(url);
    if (cached) {
      console.log('Cache hit for:', url);
      return NextResponse.json({
        success: true,
        track: cached,
        metadata: { cached: true },
      });
    }

    // Get client ID
    const clientId = getClientId();

    // Resolve track
    const track = await resolveSoundCloudTrack(url, clientId);

    if (!track) {
      return NextResponse.json(
        { 
          error: 'Unable to load this track. The track may be unavailable, private, or have regional restrictions. Also check that SOUNDCLOUD_CLIENT_ID is set correctly.',
          code: 'TRACK_UNAVAILABLE',
          troubleshooting: 'Visit /api/soundcloud to check if client ID is configured'
        },
        { status: 404 }
      );
    }

    if (!track.streamable) {
      return NextResponse.json(
        { 
          error: 'This track is not streamable due to copyright restrictions.',
          code: 'NOT_STREAMABLE'
        },
        { status: 403 }
      );
    }

    // Cache the result
    setCache(url, track);

    const responseTime = Date.now() - startTime;
    console.log(`SoundCloud resolve completed in ${responseTime}ms for track ${track.id}`);

    return NextResponse.json({
      success: true,
      track,
      metadata: {
        responseTime,
        cached: false,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SoundCloud API error:', error);

    // Handle rate limiting specifically
    if (errorMessage === 'SOUNDCLOUD_RATE_LIMIT') {
      return NextResponse.json(
        { 
          error: 'SoundCloud is receiving too many requests. Please wait a moment and try again.',
          code: 'SOUNDCLOUD_RATE_LIMIT',
          suggestion: 'Wait 30-60 seconds before retrying.'
        },
        { status: 429 }
      );
    }

    // Handle missing client ID
    if (errorMessage === 'MISSING_CLIENT_ID') {
      return NextResponse.json(
        { 
          error: 'SoundCloud client ID not configured. Please add SOUNDCLOUD_CLIENT_ID to your environment variables.',
          code: 'CLIENT_ID_MISSING',
          howToFix: 'Get your Client ID from https://soundcloud.com/you/apps and add it to .env.local'
        },
        { status: 500 }
      );
    }

    if (errorMessage.includes('environment variable')) {
      return NextResponse.json(
        { 
          error: 'Server configuration error. Please contact the administrator.',
          code: 'SERVER_CONFIG'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Unable to connect to SoundCloud. Please check your internet connection and try again.',
        code: 'API_ERROR',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  
  return NextResponse.json({
    status: 'ok',
    configured: !!clientId,
    timestamp: new Date().toISOString(),
    cacheSize: trackCache.size,
    clientIdPrefix: clientId ? clientId.substring(0, 5) + '...' : null,
  });
}

// Also handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
