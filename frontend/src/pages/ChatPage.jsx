import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useChatStore from '../hooks/useChatStore';
import useAuthStore from '../hooks/useAuthStore';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';

const PERSONAS = [
  { id: 'investor', label: '💼 Investor', desc: 'Harsh VC critique' },
  { id: 'technical', label: '⚙️ Technical', desc: 'Engineer review' },
  { id: 'market', label: '📊 Market', desc: 'Market analysis' }
];

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeSession, loadSession, createSession, sendMessage, isSending, clearActive } = useChatStore();

  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('investor');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load session from URL
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId).catch(() => {
        toast.error('Session not found');
        navigate('/dashboard');
      });
    } else {
      clearActive();
    }
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleNewChat = async () => {
    try {
      const session = await createSession(persona);
      navigate(`/chat/${session._id}`);
    } catch (err) {
      if (err.response?.data?.code === 'PLAN_LIMIT') {
        toast.error('Free plan limit reached. Upgrade for unlimited sessions.');
      } else {
        toast.error('Failed to create session');
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    if (!activeSession) {
      // Create session first, then send
      try {
        const session = await createSession(persona);
        navigate(`/chat/${session._id}`);
        // After navigation, the session will load and we can send
        // Use a small timeout to allow state update
        setTimeout(async () => {
          try {
            await sendMessage(session._id, input);
            setInput('');
          } catch (err) {
            toast.error('Failed to get AI response');
          }
        }, 200);
      } catch (err) {
        toast.error('Failed to start chat');
      }
      return;
    }

    const msg = input;
    setInput('');
    try {
      await sendMessage(activeSession._id, msg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get response');
      setInput(msg); // restore on error
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaResize = useCallback((e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  }, []);

  const messages = activeSession?.messages || [];
  const isEmpty = messages.length === 0;

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          onNewChat={handleNewChat}
          activeSessionId={sessionId}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div style={styles.main}>
        {/* Top bar */}
        <div style={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!sidebarOpen && (
              <button style={styles.iconBtn} onClick={() => setSidebarOpen(true)} title="Open sidebar">
                ☰
              </button>
            )}
            <div>
              <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '0.95rem' }}>
                {activeSession?.title || 'New Conversation'}
              </div>
              {activeSession && (
                <div style={{ color: '#6a6a8a', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                  {activeSession.messageCount || 0} messages · {activeSession.ideaCategory || 'Uncategorized'}
                </div>
              )}
            </div>
          </div>

          {/* Persona selector (only when no session yet) */}
          {!activeSession && (
            <div style={styles.personaRow}>
              {PERSONAS.map(p => (
                <button
                  key={p.id}
                  style={{ ...styles.personaBtn, ...(persona === p.id ? styles.personaBtnActive : {}) }}
                  onClick={() => setPersona(p.id)}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ color: '#6a6a8a', fontSize: '0.8rem' }}>
            Hi, <span style={{ color: '#e8c547' }}>{user?.name?.split(' ')[0]}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {isEmpty ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 56, marginBottom: 16, display: 'block' }}>🔍</span>
              <h2 style={{ color: '#e8e8f0', fontSize: '1.6rem', fontFamily: 'serif', fontWeight: 900, marginBottom: 10 }}>
                Pitch Your Idea
              </h2>
              <p style={{ color: '#6a6a8a', maxWidth: 420, lineHeight: 1.7 }}>
                Describe your startup or project idea and get a structured 3-point critique from your selected AI persona. No sugarcoating.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24 }}>
                {[
                  'An AI-powered resume builder',
                  'Uber for laundry services',
                  'A blockchain voting platform',
                  'Subscription box for homeowners'
                ].map(ex => (
                  <button
                    key={ex}
                    style={styles.chip}
                    onClick={() => { setInput(ex); inputRef.current?.focus(); }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))
          )}

          {/* Typing indicator */}
          {isSending && (
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <div style={{ ...styles.avatar, background: '#1a3a1a', border: '1px solid #2a4a2a' }}>💼</div>
              <div style={styles.typingBubble}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{ ...styles.typingDot, animationDelay: `${delay}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              style={styles.textarea}
              placeholder="Describe your idea..."
              value={input}
              onChange={e => { setInput(e.target.value); handleTextareaResize(e); }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              style={{ ...styles.sendBtn, opacity: (!input.trim() || isSending) ? 0.5 : 1 }}
              onClick={handleSend}
              disabled={!input.trim() || isSending}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', color: '#3a3a5a', fontSize: '0.7rem', marginTop: 8, fontFamily: 'monospace' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── typing animation ─────────────────────────────────────
const typingKeyframes = `
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = typingKeyframes;
  document.head.appendChild(style);
}

const styles = {
  layout: { display: 'flex', height: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #1a1a2a', background: '#0d0d15', flexShrink: 0, flexWrap: 'wrap', gap: 10 },
  iconBtn: { background: 'none', border: 'none', color: '#6a6a8a', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' },
  personaRow: { display: 'flex', gap: 6 },
  personaBtn: { background: '#111118', border: '1px solid #2a2a3a', borderRadius: 20, padding: '5px 12px', color: '#6a6a8a', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' },
  personaBtnActive: { background: 'rgba(232,197,71,0.1)', borderColor: 'rgba(232,197,71,0.4)', color: '#e8c547' },
  messages: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 },
  emptyState: { margin: 'auto', textAlign: 'center', padding: 40 },
  chip: { background: '#111118', border: '1px solid #2a2a3a', borderRadius: 20, padding: '7px 14px', color: '#6a6a8a', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s' },
  avatar: { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 2 },
  typingBubble: { background: '#0f1a0f', border: '1px solid #2a4a2a', borderRadius: '14px 14px 14px 4px', padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' },
  typingDot: { width: 6, height: 6, background: '#4a8a4a', borderRadius: '50%', animation: 'typingBounce 1.2s infinite' },
  inputArea: { padding: '12px 24px 20px', borderTop: '1px solid #1a1a2a', flexShrink: 0 },
  inputWrapper: { display: 'flex', gap: 8, alignItems: 'flex-end', background: '#111118', border: '1px solid #2a2a3a', borderRadius: 14, padding: '8px 8px 8px 16px' },
  textarea: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8e8f0', fontSize: '0.9rem', lineHeight: 1.5, resize: 'none', minHeight: 22, fontFamily: 'inherit' },
  sendBtn: { width: 36, height: 36, background: '#e8c547', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0f', flexShrink: 0, transition: 'all 0.2s' }
};
