'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Drop } from '@/lib/types/blackout';
import { SoundCloudManager } from '@/lib/soundcloud/SoundCloudManager';

interface MusicPopupCardProps {
  drop: Drop;
  user: any;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onClose: () => void;
  autoPlay?: boolean;
}

// Function to extract SoundCloud track ID from URL
const extractSoundCloudTrackId = (url: string): string | null => {
  try {
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    if (match) {
      return match[2];
    }
    return null;
  } catch {
    return null;
  }
};

// Function to get SoundCloud embed data
const getSoundCloudEmbedData = (trackUrl: string, autoPlay: boolean = false) => {
  const trackId = extractSoundCloudTrackId(trackUrl);
  if (!trackId) return null;
  
  return {
    embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=${autoPlay}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`,
    trackId: trackId,
    widgetUrl: `https://widget.sndcdn.com/${trackId}/sets/${trackId}`,
    artworkUrl: `https://i1.sndcdn.com/artworks-${trackId}-t500x500.jpg`
  };
};

// Function to get track name from URL
const getTrackNameFromUrl = (url: string): string => {
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('soundcloud.com')) {
    const segments = url.split('/');
    const trackSegment = segments[segments.length - 1];
    return trackSegment.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  return 'Unknown Track';
};

// Simple avatar generator for fallback
const generateAvatarUrl = (userId: string, username: string) => {
  const seed = username || userId;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=4dabf7`;
};

export default function MusicPopupCard({
  drop,
  user,
  onLikeUpdate,
  onClose,
  autoPlay = false
}: MusicPopupCardProps) {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundCloudData, setSoundCloudData] = useState<any>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  
  const soundCloudManager = SoundCloudManager.getInstance();
  const iframeId: string = `popup-player-${drop.id || drop.firestoreId || 'unknown'}`;
  const playerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (drop.trackUrl && drop.trackUrl.includes('soundcloud.com')) {
      const data = getSoundCloudEmbedData(drop.trackUrl, autoPlay);
      setSoundCloudData(data);
    }
  }, [drop.trackUrl, autoPlay]);

  useEffect(() => {
    if (soundCloudData && playerRef.current) {
      // Add a small delay to ensure iframe is fully rendered
      const timeoutId = setTimeout(() => {
        initializePlayer();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      // Cleanup widget when component unmounts
      soundCloudManager.destroyWidget(iframeId || 'popup-player-unknown');
    };
  }, [soundCloudData]);

  const initializePlayer = async () => {
    if (!soundCloudData || !playerRef.current) {
      console.warn('Cannot initialize player: missing data or iframe');
      return;
    }

    try {
      await soundCloudManager.initialize();
      
      const widget = soundCloudManager.createWidget(iframeId || 'popup-player-unknown', drop.trackUrl || '', {
        volume: 0.7,
        autoplay: autoPlay,
        onFinish: () => {
          setIsPlaying(false);
          console.log('SoundCloud track finished');
        },
        onPlay: () => {
          setIsPlaying(true);
          console.log('SoundCloud track playing');
        },
        onPause: () => {
          setIsPlaying(false);
          console.log('SoundCloud track paused');
        },
        onError: (error: any) => {
          console.error('SoundCloud widget error:', error);
          setIsPlaying(false);
        }
      });

      if (widget) {
        setWidgetReady(true);
        console.log('SoundCloud widget initialized successfully');
      } else {
        console.error('Failed to create SoundCloud widget');
      }
    } catch (error) {
      console.error('Error initializing SoundCloud player:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    try {
      const newLikes = isLiked 
        ? drop.likes.filter(id => id !== user.uid)
        : [...drop.likes, user.uid];
      
      setIsLiked(!isLiked);
      setLikeCount(newLikes.length);
      onLikeUpdate(drop.firestoreId || drop.id || 'unknown', newLikes);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handlePlayPause = () => {
    if (widgetReady) {
      const widget = soundCloudManager.getWidget(iframeId || 'popup-player-unknown');
      if (widget && typeof widget.toggle === 'function') {
        widget.toggle();
      }
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return 'Just now';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 2000,
      minWidth: '300px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '2px solid #8a2be2'
    }}>
      {/* Header with user info and close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ margin: 0, color: '#8a2be2' }}>
          {getTrackNameFromUrl(drop.trackUrl || '')} by {drop.username}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ×
        </button>
      </div>
      
      {/* Music drop details */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#aaa', marginBottom: '5px' }}>
          Type: <strong style={{ color: 'white' }}>Music Drop</strong>
        </div>
        <div style={{ color: '#aaa', marginBottom: '5px' }}>
          Dropped by: <strong style={{ color: 'white' }}>{drop.username}</strong>
        </div>
        <div style={{ color: '#aaa', marginBottom: '5px' }}>
          Location: {drop.lat ? drop.lat.toFixed(6) : 'N/A'}, {drop.lng ? drop.lng.toFixed(6) : 'N/A'}
        </div>
        <div style={{ color: '#aaa', marginBottom: '5px' }}>
          Placed: {drop.timestamp.toLocaleDateString()}
        </div>
        <div style={{ color: '#aaa', marginBottom: '5px' }}>
          {getTimeAgo(drop.timestamp)}
        </div>
      </div>

      {/* Album Art Section */}
      {soundCloudData?.artworkUrl && (
        <div style={{
          height: '120px',
          background: `url(${soundCloudData.artworkUrl}) center/cover`,
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid rgba(255,255,255,0.1)'
        }} />
      )}

      {/* Like and play section */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={handleLike}
            style={{
              background: isLiked ? '#ef4444' : '#444',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isLiked ? '❤️' : '🤍'} {likeCount}
          </button>
          
          <button
            onClick={handlePlayPause}
            style={{
              background: '#4dabf7',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isPlaying ? '⏸️' : '▶️'} {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
        
        {/* Track info */}
        <div style={{ 
          fontSize: '12px', 
          color: '#cbd5e1',
          marginBottom: '10px'
        }}>
          🎧 {getTrackNameFromUrl(drop.trackUrl || '')}
        </div>
        
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          {drop.timestamp.toLocaleDateString()} • {drop.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* SoundCloud Player (Hidden) */}
      {soundCloudData && (
        <iframe
          ref={playerRef}
          id={iframeId}
          title="SoundCloud Player"
          width="1"
          height="1"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={soundCloudData?.embedUrl || ''}
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden'
          }}
        />
      )}


    </div>
  );
}