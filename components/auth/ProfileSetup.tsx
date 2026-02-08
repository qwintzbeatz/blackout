'use client';

import { useState, useEffect } from 'react';
import { generateRandomAvatar } from '@/src/lib/customAvatar';

const ProfileSetup: React.FC<{
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  selectedCrewColor?: string;
}> = ({ onSubmit, loading = false, selectedCrewColor }) => {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (username.trim()) {
      generateRandomAvatar('preview', username, gender).then(setAvatarUrl);
    } else {
      setAvatarUrl('');
    }
  }, [username, gender]);

  return (
    <div className="sticker-overlay">
      <div className="sticker">
        <div className="sticker-header">
          <h2 className="sticker-title">HELLO</h2>
          <h2 className="sticker-title">MY NAME IS</h2>
        </div>
        <div className="sticker-divider" />
        
        <div className="sticker-polaroid">
          <div className="polaroid-photo">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" />
            ) : (
              <span className="avatar-placeholder">👤</span>
            )}
          </div>
          <span className="polaroid-label">YOUR AVATAR</span>
        </div>

        <div className="sticker-content">
          <div className="input-label">(WRITE YOUR NAME)</div>
          <input
            type="text"
            placeholder="__________"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="handwritten-input"
            maxLength={15}
          />
          
          <div className="gender-section">
            <div className="gender-label">Gender:</div>
            <div className="gender-options">
              {['male', 'female', 'other'].map((opt) => (
                <label key={opt} className="gender-option">
                  <input type="radio" name="gender" checked={gender === opt} onChange={() => setGender(opt as any)} />
                  <span className={`gender-box ${gender === opt ? 'checked' : ''}`}>{gender === opt && '✓'}</span>
                  <span className="gender-emoji">{opt === 'male' ? '👨' : opt === 'female' ? '👩' : '👽'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="sticker-footer">
          <button
            onClick={() => username.trim() && onSubmit({ username, gender })}
            disabled={loading || !username.trim()}
            className="stamp-button"
          >
            {loading ? '...' : '✓ COMPLETE'}
          </button>
          
          <div className="sticky-note">
            <strong>🎨 START AS A TOY</strong>
            <div>Place markers to earn REP!</div>
          </div>
        </div>
      </div>

      <style>{`
        .sticker-overlay {
          height: 100vh;
          width: 100vw;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #2d2d2d;
          background-image: radial-gradient(circle at 50% 50%, #3d3d3d 0%, #2d2d2d 100%);
        }
        
        .sticker {
          background: #fcfcfc;
          width: 100%;
          max-width: 340px;
          transform: rotate(-1.5deg);
          box-shadow: 0 15px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .sticker-header {
          background: #1a1a1a;
          padding: 16px 20px;
          text-align: center;
        }
        
        .sticker-title {
          color: #fff;
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          font-family: Impact, Arial Black, sans-serif;
          letter-spacing: 2px;
          text-transform: uppercase;
          line-height: 1;
        }
        
        .sticker-divider {
          height: 3px;
          background: #1a1a1a;
        }
        
        .sticker-polaroid {
          margin: 25px auto 15px;
          padding: 10px 10px 30px;
          background: #fefefe;
          box-shadow: 0 3px 12px rgba(0,0,0,0.2);
          width: 120px;
          transform: rotate(2deg);
          border: 1px solid #e0e0e0;
          position: relative;
        }
        
        .polaroid-photo {
          width: 90px;
          height: 90px;
          border-radius: 4px;
          background: #f0f0f0;
          overflow: hidden;
          border: 1px solid #ccc;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .polaroid-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          font-size: 32px;
        }
        
        .polaroid-label {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          color: #666;
          font-family: Courier New, monospace;
        }
        
        .sticker-content {
          padding: 0 25px;
        }
        
        .input-label {
          font-size: 11px;
          color: #666;
          font-family: Courier New, monospace;
          font-weight: bold;
          text-align: left;
          margin-bottom: 8px;
        }
        
        .handwritten-input {
          width: 100%;
          padding: 10px 12px;
          border: none;
          border-bottom: 3px solid #1a1a1a;
          font-size: 22px;
          font-weight: bold;
          font-family: Comic Sans MS, Chalkboard SE, Marker Felt, cursive;
          text-align: center;
          background: transparent;
          color: #1a1a1a;
          letter-spacing: 2px;
          outline: none;
          text-transform: uppercase;
        }
        
        .gender-section {
          margin-top: 20px;
          padding: 12px;
          background: #fafafa;
          border: 2px dashed #ccc;
          border-radius: 4px;
        }
        
        .gender-label {
          font-size: 10px;
          color: #888;
          font-family: Courier New, monospace;
          text-transform: uppercase;
          font-weight: bold;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .gender-options {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        
        .gender-option {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-family: Comic Sans MS, cursive;
          font-size: 13px;
        }
        
        .gender-option input {
          display: none;
        }
        
        .gender-box {
          width: 14px;
          height: 14px;
          border: 2px solid #1a1a1a;
          margin-right: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fefefe;
          color: #fff;
          font-size: 9px;
          transition: all 0.15s ease;
        }
        
        .gender-box.checked {
          background: #1a1a1a;
        }
        
        .gender-emoji {
          color: #1a1a1a;
          font-weight: bold;
        }
        
        .sticker-footer {
          padding: 0 25px 25px;
        }
        
        .stamp-button {
          background: transparent;
          color: #cc0000;
          border: 4px solid #cc0000;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 900;
          font-family: Impact, Arial Narrow Bold, sans-serif;
          letter-spacing: 2px;
          text-transform: uppercase;
          transform: rotate(-3deg);
          cursor: pointer;
          width: 100%;
          box-shadow: 0 4px 0 #990000;
          position: relative;
          top: -2px;
        }
        
        .stamp-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .stamp-button:hover:not(:disabled) {
          background: #cc0000;
          color: #fff;
        }
        
        .sticky-note {
          font-size: 11px;
          color: #1a1a1a;
          text-align: left;
          background: #fffae6;
          padding: 12px;
          border: 1px solid #e6d79c;
          font-family: Courier New, monospace;
          transform: rotate(0.5deg);
          margin-top: 15px;
        }
      `}</style>
    </div>
  );
};

export default ProfileSetup;
