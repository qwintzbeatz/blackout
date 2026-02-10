// Full-Screen SoundMap Card - Music Drop Popup
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Drop } from "@/lib/types/blackout";
import { User as FirebaseUser } from "firebase/auth";
import { getTrackNameFromUrl, getTrackPlatform, isSpotifyUrl, getSpotifyEmbedUrl } from "@/lib/utils/dropHelpers";

interface MusicDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onClose?: () => void;
}

const MusicDropPopup: React.FC<MusicDropPopupProps> = ({ drop, user, onLikeUpdate, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const isSpotify = isSpotifyUrl(drop.trackUrl || "");
  const trackPlatform = getTrackPlatform(drop.trackUrl || "");
  const trackName = getTrackNameFromUrl(drop.trackUrl || "");
  const accentColor = isSpotify ? "#1DB954" : "#ff5500";

  useEffect(() => {
    if (isSpotify && drop.trackUrl) {
      setEmbedUrl(getSpotifyEmbedUrl(drop.trackUrl));
    }
  }, [isSpotify, drop.trackUrl]);

  useEffect(() => {
    if (drop.likes && user) {
      setIsLiked(drop.likes.includes(user.uid));
      setLikeCount(drop.likes.length);
    }
  }, [drop.likes, user]);

  const handleLike = async () => {
    if (!user) return;
    const newLikes = isLiked ? drop.likes?.filter((id) => id !== user.uid) || [] : [...(drop.likes || []), user.uid];
    await onLikeUpdate(drop.firestoreId || drop.id || "", newLikes);
    setIsLiked(!isLiked);
    setLikeCount(newLikes.length);
  };

  const handlePlayPause = () => {
    if (isSpotify && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ command: isPlaying ? "pause" : "play" }, "*");
    }
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      pointerEvents: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(20px)",
      }} onClick={handleClose} />
      
      <div style={{
        position: "relative",
        width: "90vw",
        maxWidth: "450px",
        height: "auto",
        maxHeight: "90vh",
        background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)",
        borderRadius: "24px",
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)",
        border: "1px solid " + accentColor + "40",
        overflow: "hidden",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",
        flexDirection: "column",
        animation: "popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <button onClick={handleClose} style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "#fff",
          fontSize: "24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}>
          ×
        </button>

        <div style={{ padding: "28px 24px 20px", background: "linear-gradient(135deg, " + accentColor + "20 0%, transparent 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              padding: "6px 12px",
              background: accentColor + "25",
              border: "1px solid " + accentColor + "50",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "700",
              color: accentColor,
              textTransform: "uppercase",
            }}>
              🎵 {trackPlatform || "Track"}
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{formatTimeAgo(drop.timestamp)}</span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>{trackName}</h2>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {drop.userProfilePic ? (
              <img src={drop.userProfilePic} alt={drop.username} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid " + accentColor, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "white" }}>
                {(drop.username || "a")[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>{drop.username}</span>
          </div>
        </div>

        <div style={{ padding: "20px 24px", flex: 1 }}>
          {drop.photoUrl ? (
            <div style={{ width: "100%", height: "180px", background: "url(" + drop.photoUrl + ") center/cover", borderRadius: "16px", position: "relative", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26, 26, 46, 0.95) 0%, transparent 50%)", borderRadius: "16px" }} />
              <div style={{ position: "absolute", bottom: "12px", left: "16px" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>{trackName}</div>
              </div>
            </div>
          ) : isSpotify && embedUrl ? (
            <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden", background: "#191414" }}>
              <iframe ref={iframeRef} src={embedUrl} width="100%" height="80" style={{ border: "none" }} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen title="Spotify Player" />
            </div>
          ) : (
            <div style={{ width: "100%", height: "120px", background: "linear-gradient(135deg, " + accentColor + "20 0%, rgba(138, 43, 226, 0.1) 100%)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎵</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>{trackName}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "20px 24px 28px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={handlePlayPause} style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, " + accentColor + " 0%, " + (isSpotify ? "#1ed760" : "#ff6b00") + " 100%)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 25px " + accentColor + "60",
            flexShrink: 0,
          }}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trackName}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{drop.username}</div>
          </div>

          <button onClick={handleLike} disabled={!user} style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
            border: isLiked ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
            color: isLiked ? "#ef4444" : "#94a3b8",
            cursor: user ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <span style={{ fontSize: "13px", color: isLiked ? "#ef4444" : "#64748b", fontWeight: "600" }}>{likeCount}</span>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MusicDropPopup;
