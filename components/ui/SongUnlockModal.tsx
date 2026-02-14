// Song Unlock Modal - Full screen popup when unlocking new tracks
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { isSpotifyUrl, getSpotifyEmbedUrl, getSoundCloudEmbedUrl } from "@/lib/utils/dropHelpers";

interface SongUnlockModalProps {
  trackUrl: string;
  trackName: string;
  artist?: string;
  isOpen: boolean;
  onClose: () => void;
  unlockSource?: string;
}

const TrackBadge: React.FC<{ source: string }> = ({ source }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 14px",
      background: "rgba(255, 85, 0, 0.2)",
      border: "1px solid rgba(255, 85, 0, 0.4)",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#ff5500",
      textTransform: "uppercase",
      letterSpacing: "1px",
    }}
  >
    <span>🏆</span>
    {source || "UNLOCKED"}
  </div>
);

// CSS-only Waveform Visualizer - Like SoundCloud Canvas/SoundMap
const WaveformVisualizer: React.FC<{ isPlaying: boolean; isSpotify: boolean }> = ({ isPlaying, isSpotify }) => {
  const primaryColor = isSpotify ? "#1DB954" : "#ff5500";
  const secondaryColor = isSpotify ? "#1ed760" : "#ff7b00";
  
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        height: "80px",
        padding: "0 10px",
        borderRadius: "12px",
        background: "rgba(0, 0, 0, 0.3)",
        opacity: isPlaying ? 1 : 0.5,
        transition: "opacity 0.3s ease",
      }}
    >
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: isPlaying 
              ? `${20 + Math.sin(i * 0.5) * 25 + Math.random() * 15}px`
              : "15px",
            background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            borderRadius: "3px",
            transition: isPlaying ? "height 0.15s ease" : "height 0.3s ease",
            animation: isPlaying ? `waveformDance 0.4s ease-in-out infinite` : "none",
            animationDelay: `${i * 0.05}s`,
            boxShadow: isPlaying ? `0 0 8px ${primaryColor}80` : "none",
          }}
        />
      ))}
      <style>{`
        @keyframes waveformDance {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.6); }
        }
      `}</style>
    </div>
  );
};

// Pulsing Ring Effect Component
const PulsingRings: React.FC<{ isPlaying: boolean; isSpotify: boolean }> = ({ isPlaying, isSpotify }) => {
  const primaryColor = isSpotify ? "#1DB954" : "#ff5500";
  
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            border: `2px solid ${primaryColor}`,
            opacity: isPlaying ? 0 : 0.3 - i * 0.1,
            animation: isPlaying ? `ringPulse${i} 2s ease-out infinite` : "none",
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes ringPulse0 {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes ringPulse1 {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes ringPulse2 {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default function SongUnlockModal({
  trackUrl,
  trackName,
  artist,
  isOpen,
  onClose,
  unlockSource = "TRACK UNLOCKED",
}: SongUnlockModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  const isSpotify = isSpotifyUrl(trackUrl || "");
  const isSoundCloud = trackUrl?.includes('soundcloud.com') || false;

  const themeColor = isSpotify ? "#1DB954" : "#ff5500";
  const themeGradient = isSpotify 
    ? "linear-gradient(135deg, #1DB954, #1ed760)" 
    : "linear-gradient(135deg, #ff5500, #ff7b00)";

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimate(true), 50);
      if (isSpotify && trackUrl) {
        setEmbedUrl(getSpotifyEmbedUrl(trackUrl));
      } else if (isSoundCloud && trackUrl) {
        setEmbedUrl(getSoundCloudEmbedUrl(trackUrl));
      }
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 400);
    }
  }, [isOpen, isSpotify, isSoundCloud, trackUrl]);

  const handlePlayPause = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { command: isPlaying ? "pause" : "play" },
        "*"
      );
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(onClose, 400);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        opacity: animate ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
      onClick={handleClose}
    >
      {/* Background Effects */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 50% 0%, ${themeColor}20 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(138, 43, 226, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Animated Particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              backgroundColor: Math.random() > 0.5 ? themeColor : "#8a2be2",
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: animate ? (Math.random() * 0.5 + 0.2) : 0,
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div
        style={{
          position: "relative",
          width: "360px",
          maxWidth: "90vw",
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
          borderRadius: "28px",
          boxShadow: `
            0 25px 80px rgba(0, 0, 0, 0.6),
            0 0 60px ${themeColor}30,
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          border: `1px solid ${themeColor}50`,
          overflow: "hidden",
          transform: animate ? "scale(1) translateY(0)" : "scale(0.8) translateY(40px)",
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            position: "relative",
            padding: "28px 24px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "200px",
              height: "200px",
              background: `radial-gradient(circle, ${themeColor}50 0%, transparent 70%)`,
              filter: "blur(20px)",
            }}
          />

          <TrackBadge source={unlockSource} />

          <h2
            style={{
              marginTop: "16px",
              fontSize: "28px",
              fontWeight: "800",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textShadow: `0 0 30px ${themeColor}80`,
            }}
          >
            NEW TRACK
          </h2>
        </div>

        {/* Album Art / Vinyl with Waveform Visualizer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 0",
            gap: "16px",
          }}
        >
          {/* Waveform Visualizer - Like SoundCloud Canvas/SoundMap */}
          <div style={{ width: "85%", position: "relative" }}>
            <WaveformVisualizer isPlaying={isPlaying} isSpotify={isSpotify} />
            
            {/* Pulsing rings behind vinyl */}
            <PulsingRings isPlaying={isPlaying} isSpotify={isSpotify} />
          </div>

          {/* Vinyl Record */}
          <div
            style={{
              position: "relative",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)",
              border: "4px solid rgba(255, 255, 255, 0.1)",
              boxShadow: `
                0 15px 40px rgba(0, 0, 0, 0.5),
                0 0 80px ${themeColor}40,
                inset 0 0 60px rgba(0, 0, 0, 0.3)
              `,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: isPlaying ? "spin 3s linear infinite" : "pulse-glow 2s ease-in-out infinite",
              zIndex: 10,
            }}
          >
            {/* Vinyl Grooves */}
            <div
              style={{
                position: "absolute",
                inset: "12px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "30px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.03)",
              }}
            />

            {/* Center Label with theme color */}
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "50%",
                background: themeGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 20px ${themeColor}60`,
              }}
            >
              <span style={{ fontSize: "26px" }}>🎵</span>
            </div>

            {/* Playing Indicator Sound Bars */}
            {isPlaying && (
              <div
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "15px",
                  display: "flex",
                  gap: "3px",
                  alignItems: "flex-end",
                  height: "24px",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "4px",
                      background: themeColor,
                      borderRadius: "2px",
                      animation: `soundWave 0.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.08}s`,
                      height: `${12 + Math.sin(i * 1.5) * 10}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div style={{ padding: "0 24px 20px", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#fff",
              margin: "0 0 8px 0",
              lineHeight: 1.3,
            }}
          >
            {trackName}
          </h3>
          {artist && (
            <p
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                margin: 0,
              }}
            >
              {artist}
            </p>
          )}
        </div>

        {/* Video Preview Embed - Spotify or SoundCloud */}
        {embedUrl ? (
          <div
            style={{
              margin: "0 20px 20px",
              borderRadius: "16px",
              overflow: "hidden",
              background: isSpotify ? "#191414" : "linear-gradient(135deg, #191414 0%, #0f0f23 100%)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            }}
          >
            <iframe
              ref={iframeRef}
              src={embedUrl}
              width="100%"
              height={isSpotify ? "152" : "125"}
              style={{ border: "none", borderRadius: "16px" }}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              title={isSpotify ? "Spotify Preview" : "SoundCloud Preview"}
            />
          </div>
        ) : (
          <div
            style={{
              margin: "0 20px 20px",
              padding: "16px",
              borderRadius: "16px",
              background: `linear-gradient(135deg, ${themeColor}25 0%, rgba(138, 43, 226, 0.15) 100%)`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "0 0 12px 0",
              }}
            >
              Preview not available
            </p>
            <button
              onClick={() => window.open(trackUrl, "_blank")}
              style={{
                padding: "10px 24px",
                background: themeGradient,
                border: "none",
                borderRadius: "24px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {isSoundCloud ? "🔊 Open in SoundCloud" : "🎵 Open in App"}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "0 20px 24px",
          }}
        >
          <button
            onClick={handlePlayPause}
            style={{
              flex: 1,
              padding: "16px",
              background: isPlaying
                ? "rgba(239, 68, 68, 0.2)"
                : themeGradient,
              border: isPlaying ? `1px solid rgba(239, 68, 68, 0.5)` : "none",
              borderRadius: "16px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: isPlaying ? "none" : `0 6px 20px ${themeColor}60`,
            }}
          >
            {isPlaying ? (
              <>
                <span style={{ fontSize: "18px" }}>⏸</span> PAUSE
              </>
            ) : (
              <>
                <span style={{ fontSize: "18px" }}>▶</span> PLAY PREVIEW
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            style={{
              padding: "16px 24px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              color: "#94a3b8",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            CLOSE
          </button>
        </div>

        {/* Corner Accents */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            width: "24px",
            height: "24px",
            borderTop: `2px solid ${themeColor}`,
            borderLeft: `2px solid ${themeColor}`,
            borderTopLeftRadius: "8px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "24px",
            height: "24px",
            borderTop: `2px solid ${themeColor}`,
            borderRight: `2px solid ${themeColor}`,
            borderTopRightRadius: "8px",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            width: "24px",
            height: "24px",
            borderBottom: `2px solid ${themeColor}`,
            borderLeft: `2px solid ${themeColor}`,
            borderBottomLeftRadius: "8px",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            width: "24px",
            height: "24px",
            borderBottom: `2px solid ${themeColor}`,
            borderRight: `2px solid ${themeColor}`,
            borderBottomRightRadius: "8px",
          }}
        />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 
              0 15px 40px rgba(0, 0, 0, 0.5),
              0 0 80px ${themeColor}40,
              inset 0 0 60px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 
              0 15px 40px rgba(0, 0, 0, 0.5),
              0 0 100px ${themeColor}60,
              inset 0 0 60px rgba(0, 0, 0, 0.3);
          }
        }
        @keyframes soundWave {
          0%, 100% { height: 12px; }
          50% { height: 24px; }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
