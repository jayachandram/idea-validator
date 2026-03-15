import React from 'react';
import { formatDistanceToNow } from 'date-fns';

// Parse and format Marcus-style critique
const formatAICritique = (content) => {
  if (!content.includes('**VERDICT:**') && !content.includes('**POINT')) {
    // Plain response, just render with line breaks
    return (
      <div style={{ lineHeight: 1.7, color: '#c8e8c8' }}>
        {content.split('\n').map((line, i) => (
          <p key={i} style={{ margin: '4px 0' }}>{line}</p>
        ))}
      </div>
    );
  }

  const sections = [];
  let remaining = content;

  // Extract VERDICT
  const verdictMatch = remaining.match(/\*\*VERDICT:\*\*\s*([^\n*]+)/);
  if (verdictMatch) {
    sections.push({ type: 'verdict', text: verdictMatch[1].trim() });
    remaining = remaining.replace(verdictMatch[0], '');
  }

  // Extract POINTS
  const pointRegex = /\*\*POINT\s+(\d+)\s*[—-]\s*([^*]+)\*\*[:\s]*([\s\S]*?)(?=\*\*POINT|\*\*BOTTOM|$)/g;
  let match;
  const colors = ['#ff4455', '#e8c547', '#4a9eff'];
  while ((match = pointRegex.exec(remaining)) !== null) {
    sections.push({
      type: 'point',
      number: match[1],
      category: match[2].trim(),
      text: match[3].trim(),
      color: colors[(parseInt(match[1]) - 1) % 3]
    });
  }

  // Extract BOTTOM LINE
  const bottomMatch = remaining.match(/\*\*BOTTOM LINE:\*\*\s*([\s\S]*?)$/);
  if (bottomMatch) {
    sections.push({ type: 'bottom', text: bottomMatch[1].trim() });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sections.map((section, i) => {
        if (section.type === 'verdict') {
          return (
            <div key={i} style={{ background: 'rgba(232,197,71,0.07)', border: '1px solid rgba(232,197,71,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8c547', opacity: 0.8, marginBottom: 4 }}>Verdict</div>
              <div style={{ color: '#e8c547', fontWeight: 600, lineHeight: 1.5 }}>{section.text}</div>
            </div>
          );
        }
        if (section.type === 'point') {
          return (
            <div key={i} style={{ borderLeft: `3px solid ${section.color}`, paddingLeft: 12, paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: section.color, opacity: 0.8, marginBottom: 4 }}>
                Point {section.number} · {section.category}
              </div>
              <div style={{ color: '#c8e8c8', lineHeight: 1.65, fontSize: '0.87rem' }}>{section.text}</div>
            </div>
          );
        }
        if (section.type === 'bottom') {
          return (
            <div key={i} style={{ background: 'rgba(255,68,85,0.06)', border: '1px solid rgba(255,68,85,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ff4455', opacity: 0.8, marginBottom: 4 }}>Bottom Line</div>
              <div style={{ color: '#ff8899', fontWeight: 500, lineHeight: 1.5, fontSize: '0.87rem' }}>{section.text}</div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const timeAgo = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 12, alignItems: 'flex-start', animation: 'fadeUp 0.3s ease' }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 2,
        background: isUser ? 'linear-gradient(135deg,#3a3a5a,#2a2a4a)' : 'linear-gradient(135deg,#1a3a1a,#0f2a0f)',
        border: isUser ? '1px solid #3a3a5a' : '1px solid #2a4a2a'
      }}>
        {isUser ? '👤' : '💼'}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          padding: '14px 18px',
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isUser ? '#1e1e2e' : '#0f1a0f',
          border: isUser ? '1px solid #2a2a4a' : '1px solid #1a3a1a',
          fontSize: '0.87rem',
          lineHeight: 1.65
        }}>
          {isUser
            ? <span style={{ color: '#e8e8f0', whiteSpace: 'pre-wrap' }}>{message.content}</span>
            : formatAICritique(message.content)
          }
        </div>
        <div style={{ color: '#3a3a5a', fontSize: '0.68rem', fontFamily: 'monospace', textAlign: isUser ? 'right' : 'left' }}>
          {timeAgo}
        </div>
      </div>
    </div>
  );
}
