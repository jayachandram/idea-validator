import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';

const TRAIT_LABELS = {
  riskTolerance: { label: 'Risk Tolerance', low: 'Risk-Averse', high: 'Bold Bets' },
  technicalDepth: { label: 'Technical Depth', low: 'Non-Technical', high: 'Deep Tech' },
  marketAwareness: { label: 'Market Awareness', low: 'Needs Work', high: 'Strong' },
  executionFocus: { label: 'Execution Focus', low: 'Idea-Centric', high: 'Executor' },
  originalityScore: { label: 'Originality', low: 'Derivative', high: 'Innovative' },
  clarityScore: { label: 'Communication', low: 'Vague', high: 'Crystal Clear' }
};

const STYLE_COLORS = {
  analytical: '#4a9eff',
  creative: '#ff6b35',
  pragmatic: '#4adf86',
  visionary: '#e8c547',
  mixed: '#a855f7'
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/user/dashboard'),
      api.get('/user/thinking-profile')
    ]).then(([dashRes, profileRes]) => {
      setDashboard(dashRes.data);
      setProfile(profileRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e8c547', fontFamily: 'serif', fontSize: '1.2rem' }}>Loading your profile...</div>
      </div>
    );
  }

  const hasProfile = profile?.hasProfile;
  const thinkingData = profile?.profile;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={styles.subtitle}>Your thinking intelligence report</p>
          </div>
          <button style={styles.newChatBtn} onClick={() => navigate('/chat')}>
            + New Session
          </button>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total Sessions', value: dashboard?.recentSessions?.length ?? '—', icon: '💬' },
            { label: 'Total Messages', value: user?.totalMessages ?? 0, icon: '✉️' },
            { label: 'Thinking Style', value: thinkingData?.dominantStyle || '—', icon: '🧠' },
            { label: 'Plan', value: user?.plan || 'Free', icon: '⭐' }
          ].map(stat => (
            <div key={stat.label} style={styles.statCard}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ color: '#e8c547', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'serif', textTransform: 'capitalize' }}>{stat.value}</div>
              <div style={{ color: '#6a6a8a', fontSize: '0.75rem', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Thinking Profile */}
        {!hasProfile ? (
          <div style={styles.lockedCard}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h3 style={{ color: '#e8e8f0', fontSize: '1.2rem', marginBottom: 8 }}>Thinking Profile Locked</h3>
            <p style={{ color: '#6a6a8a', lineHeight: 1.7, marginBottom: 16, maxWidth: 400 }}>
              {profile?.message || 'Chat more to unlock your personalized thinking analysis.'}
            </p>
            {profile?.progress !== undefined && (
              <div style={{ width: 200, background: '#1a1a24', borderRadius: 99, height: 6, marginBottom: 16 }}>
                <div style={{ width: `${profile.progress}%`, background: '#e8c547', height: 6, borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
            )}
            <button style={styles.newChatBtn} onClick={() => navigate('/chat')}>
              Start Validating Ideas →
            </button>
          </div>
        ) : (
          <div style={styles.profileSection}>
            {/* Style badge */}
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...styles.styleBadge, background: `${STYLE_COLORS[thinkingData.dominantStyle]}20`, borderColor: STYLE_COLORS[thinkingData.dominantStyle], color: STYLE_COLORS[thinkingData.dominantStyle] }}>
                  🧠 {thinkingData.dominantStyle?.toUpperCase()} THINKER
                </div>
              </div>
              <div style={{ color: '#3a3a5a', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                Updated {new Date(thinkingData.lastAnalyzed).toLocaleDateString()}
              </div>
            </div>

            {/* Trait bars */}
            <div style={styles.traitsGrid}>
              {Object.entries(TRAIT_LABELS).map(([key, meta]) => {
                const value = thinkingData.traits?.[key] ?? 50;
                return (
                  <div key={key} style={styles.traitItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#c8c8e0', fontSize: '0.8rem', fontWeight: 500 }}>{meta.label}</span>
                      <span style={{ color: '#e8c547', fontSize: '0.78rem', fontFamily: 'monospace' }}>{value}/100</span>
                    </div>
                    <div style={{ background: '#1a1a24', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, background: value > 60 ? '#4adf86' : value > 40 ? '#e8c547' : '#ff6b35', height: 6, borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ color: '#3a3a5a', fontSize: '0.65rem' }}>{meta.low}</span>
                      <span style={{ color: '#3a3a5a', fontSize: '0.65rem' }}>{meta.high}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gaps & Strengths */}
            <div style={styles.gapsRow}>
              {/* Gaps */}
              <div style={{ flex: 1 }}>
                <h4 style={styles.sectionTitle}>⚠️ Gaps to Address</h4>
                {thinkingData.gaps?.map((gap, i) => (
                  <div key={i} style={{ ...styles.tag, borderColor: 'rgba(255,68,85,0.3)', color: '#ff8899', background: 'rgba(255,68,85,0.05)' }}>
                    {gap}
                  </div>
                ))}
              </div>
              {/* Strengths */}
              <div style={{ flex: 1 }}>
                <h4 style={styles.sectionTitle}>✅ Your Strengths</h4>
                {thinkingData.strengths?.map((s, i) => (
                  <div key={i} style={{ ...styles.tag, borderColor: 'rgba(74,223,134,0.3)', color: '#4adf86', background: 'rgba(74,223,134,0.05)' }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Suggestions */}
            <div>
              <h4 style={styles.sectionTitle}>🎯 Personalized Suggestions</h4>
              {thinkingData.suggestions?.map((s, i) => (
                <div key={i} style={styles.suggestion}>
                  <span style={{ color: '#e8c547', marginRight: 8, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ color: '#c8c8e0', lineHeight: 1.6, fontSize: '0.85rem' }}>{s}</span>
                </div>
              ))}
            </div>

            {/* Top Themes */}
            {thinkingData.topThemes?.length > 0 && (
              <div>
                <h4 style={styles.sectionTitle}>🔁 Recurring Themes</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {thinkingData.topThemes.map((t, i) => (
                    <span key={i} style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 20, padding: '5px 12px', color: '#8888cc', fontSize: '0.78rem' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Sessions */}
        {dashboard?.recentSessions?.length > 0 && (
          <div style={styles.recentSection}>
            <h3 style={styles.sectionTitle}>Recent Sessions</h3>
            {dashboard.recentSessions.map(s => (
              <div
                key={s._id}
                style={styles.sessionRow}
                onClick={() => navigate(`/chat/${s._id}`)}
              >
                <div>
                  <div style={{ color: '#c8c8e0', fontSize: '0.88rem', fontWeight: 500 }}>{s.title}</div>
                  <div style={{ color: '#3a3a5a', fontSize: '0.72rem', marginTop: 2 }}>{s.ideaCategory} · {s.messageCount} messages</div>
                </div>
                <span style={{ color: '#3a3a5a', fontSize: '0.8rem' }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto' },
  container: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  h1: { color: '#e8e8f0', fontSize: '1.8rem', fontFamily: 'serif', fontWeight: 900, marginBottom: 4 },
  subtitle: { color: '#6a6a8a', fontSize: '0.9rem' },
  newChatBtn: { background: '#e8c547', color: '#0a0a0f', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#111118', border: '1px solid #1a1a2a', borderRadius: 12, padding: '20px 24px', textAlign: 'center' },
  profileSection: { background: '#111118', border: '1px solid #1a1a2a', borderRadius: 16, padding: 28, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 24 },
  lockedCard: { background: '#111118', border: '1px solid #1a1a2a', borderRadius: 16, padding: 40, textAlign: 'center', marginBottom: 32 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  styleBadge: { border: '1px solid', borderRadius: 20, padding: '6px 16px', fontSize: '0.78rem', fontFamily: 'monospace', letterSpacing: '0.05em', fontWeight: 700 },
  traitsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
  traitItem: {},
  gapsRow: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  sectionTitle: { color: '#e8e8f0', fontSize: '0.88rem', fontWeight: 700, marginBottom: 12, marginTop: 0 },
  tag: { display: 'inline-block', border: '1px solid', borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem', marginBottom: 6, marginRight: 6 },
  suggestion: { display: 'flex', gap: 4, marginBottom: 10, background: '#0d0d15', borderRadius: 8, padding: '10px 14px' },
  recentSection: { background: '#111118', border: '1px solid #1a1a2a', borderRadius: 16, padding: 24 },
  sessionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', marginBottom: 4 }
};
