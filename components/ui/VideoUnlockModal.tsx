// Video Unlock Modal - Full screen popup when unlocking new videos
// Facebook video embed with celebration animation
"use client";

import React, { useState, useEffect } from "react";
import { getVideoName, getFacebookEmbedUrl } from "@/constants/videos";

interface VideoUnlockModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  unlockSource?: string; // e.g., "Mission Complete", "Cheat Menu"
}

const VideoBadge: React.FC<{ source: string }> = ({ source }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 14px",
      background: "rgba(139, 92, 246, 0.2)",
      border: "1px solid rgba(139, 92, 246, 0.4)",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#8b5cf6",
      textTransform: "uppercase",
      letterSpacing: "1px",
    }}
  >
    <span>🎬</span>
    {source || "VIDEO UNLOCKED"}
  </div>
);

export default function VideoUnlockModal({
  videoUrl,
  isOpen,
  onClose,
  unlockSource = "VIDEO UNLOCKED",
}: VideoUnlockModalProps) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoHeight, setVideoHeight] = useState(340);

  const videoName = getVideoName(videoUrl);
  const embedUrl = getFacebookEmbedUrl(videoUrl);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimate(true), 50);
      // Reset playing state when modal opens
      setIsPlaying(false);
      setVideoHeight(340);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 400);
    }
  }, [isOpen]);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(onClose, 400);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setVideoHeight(500);
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
        backgroundColor: "rgba(0, 0, 0, 0.9)",
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
            radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)
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
              backgroundColor: Math.random() > 0.5 ? "#8b5cf6" : "#ec4899",
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
          width: isPlaying ? "min(90vw, 800px)" : "420px",
          maxWidth: "95vw",
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
          borderRadius: "28px",
          boxShadow: `
            0 25px 80px rgba(0, 0, 0, 0.6),
            0 0 60px rgba(139, 92, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          border: "1px solid rgba(139, 92, 246, 0.3)",
          overflow: "hidden",
          transform: animate ? "scale(1) translateY(0)" : "scale(0.8) translateY(40px)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            position: "relative",
            padding: "24px 24px 16px",
            textAlign: "center",
          }}
        >
          {/* Glow Effect Behind Badge */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          <VideoBadge source={unlockSource} />

          <h2
            style={{
              marginTop: "16px",
              fontSize: "28px",
              fontWeight: "800",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textShadow: "0 0 30px rgba(139, 92, 246, 0.5)",
            }}
          >
            NEW VIDEO
          </h2>
          
          {/* Platform indicator */}
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#8b5cf6",
              fontWeight: "600",
              letterSpacing: "1px",
            }}
          >
            📺 Exclusive Content
          </div>
        </div>

        {/* Video Title */}
        <div style={{ padding: "0 24px 16px", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#fff",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {videoName}
          </h3>
        </div>

        {/* Facebook Video Embed */}
        <div
          style={{
            margin: "0 20px 20px",
            borderRadius: "16px",
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            position: "relative",
          }}
        >
          {!isPlaying && (
            <div
              onClick={handlePlay}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.4)",
                cursor: "pointer",
                zIndex: 10,
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 40px rgba(139, 92, 246, 0.6)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                <span style={{ fontSize: "40px", color: "white", marginLeft: "8px" }}>▶</span>
              </div>
            </div>
          )}
          <iframe
            src={embedUrl}
            width="100%"
            height={videoHeight}
            style={{ 
              border: "none", 
              display: "block",
              transition: "height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title={videoName}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "0 20px 24px",
          }}
        >
          <button
            onClick={() => window.open(videoUrl, "_blank")}
            style={{
              flex: 1,
              padding: "16px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              border: "none",
              borderRadius: "16px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔗</span> Open in Facebook
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
            borderTop: "2px solid #8b5cf6",
            borderLeft: "2px solid #8b5cf6",
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
            borderTop: "2px solid #8b5cf6",
            borderRight: "2px solid #8b5cf6",
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
            borderBottom: "2px solid #8b5cf6",
            borderLeft: "2px solid #8b5cf6",
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
            borderBottom: "2px solid #8b5cf6",
            borderRight: "2px solid #8b5cf6",
            borderBottomRightRadius: "8px",
          }}
        />
      </div>

      {/* Animations */}
      <style>{`
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
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 60px rgba(139, 92, 246, 0.8);
          }
        }
      `}</style>
    </div>
  );
}