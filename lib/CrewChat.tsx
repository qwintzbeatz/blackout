'use client';
import { useState, useEffect } from 'react';
import { ref, push, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

export default function CrewChat({ crewId }: { crewId: string | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!crewId) return;
    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    const q = query(messagesRef, orderByChild('timestamp'), limitToLast(50));

    onValue(q, (snap) => {
      const data = snap.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, msg]: any) => ({ id, ...msg })));
      }
    });

    return () => {};
  }, [crewId]);

  const sendMessage = () => {
    if (!text.trim() || !crewId || !auth.currentUser) return;
    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    push(messagesRef, {
      text: text.trim(),
      uid: auth.currentUser.uid,
      username: auth.currentUser.displayName || 'Anon',
      timestamp: Date.now()
    });
    setText('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ margin: '6px 0' }}>
            <strong>{msg.username}: </strong>{msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', padding: '8px', borderTop: '1px solid #444' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message crew..."
          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #555', marginRight: '8px' }}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} style={{ padding: '8px 16px', background: '#10b981', border: 'none', borderRadius: '6px' }}>
          Send
        </button>
      </div>
    </div>
  );
}