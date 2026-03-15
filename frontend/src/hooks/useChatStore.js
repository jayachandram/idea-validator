import { create } from 'zustand';
import api from '../utils/api';

const useChatStore = create((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,
  isSending: false,
  hasMore: true,
  page: 1,

  fetchSessions: async (reset = false) => {
    const { page } = get();
    const currentPage = reset ? 1 : page;
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/chat/sessions?page=${currentPage}&limit=20`);
      set(state => ({
        sessions: reset ? data.sessions : [...state.sessions, ...data.sessions],
        hasMore: data.sessions.length === 20,
        page: currentPage + 1
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  loadSession: async (sessionId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/chat/sessions/${sessionId}`);
      set({ activeSession: data.session });
      return data.session;
    } finally {
      set({ isLoading: false });
    }
  },

  createSession: async (persona = 'investor') => {
    const { data } = await api.post('/chat/sessions', { persona });
    set(state => ({ sessions: [data.session, ...state.sessions] }));
    return data.session;
  },

  sendMessage: async (sessionId, message) => {
    set({ isSending: true });

    // Optimistic UI: add user message immediately
    const tempUserMsg = { role: 'user', content: message, timestamp: new Date(), _id: 'temp' };
    set(state => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, messages: [...state.activeSession.messages, tempUserMsg] }
        : null
    }));

    try {
      const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, { message });

      // Replace temp message + add AI reply
      set(state => ({
        activeSession: state.activeSession
          ? {
              ...state.activeSession,
              messages: [
                ...state.activeSession.messages.filter(m => m._id !== 'temp'),
                { role: 'user', content: message, timestamp: new Date() },
                data.reply
              ],
              messageCount: (state.activeSession.messageCount || 0) + 2
            }
          : null
      }));

      // Update session list title if changed
      set(state => ({
        sessions: state.sessions.map(s =>
          s._id === sessionId
            ? { ...s, messageCount: (s.messageCount || 0) + 2, updatedAt: new Date() }
            : s
        )
      }));

      return data.reply;
    } catch (err) {
      // Remove optimistic message on error
      set(state => ({
        activeSession: state.activeSession
          ? { ...state.activeSession, messages: state.activeSession.messages.filter(m => m._id !== 'temp') }
          : null
      }));
      throw err;
    } finally {
      set({ isSending: false });
    }
  },

  deleteSession: async (sessionId) => {
    await api.delete(`/chat/sessions/${sessionId}`);
    set(state => ({
      sessions: state.sessions.filter(s => s._id !== sessionId),
      activeSession: state.activeSession?._id === sessionId ? null : state.activeSession
    }));
  },

  updateSession: async (sessionId, updates) => {
    const { data } = await api.patch(`/chat/sessions/${sessionId}`, updates);
    set(state => ({
      sessions: state.sessions.map(s => s._id === sessionId ? { ...s, ...updates } : s),
      activeSession: state.activeSession?._id === sessionId
        ? { ...state.activeSession, ...updates }
        : state.activeSession
    }));
    return data.session;
  },

  clearActive: () => set({ activeSession: null })
}));

export default useChatStore;
