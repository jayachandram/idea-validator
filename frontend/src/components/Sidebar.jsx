import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useChatStore from "../hooks/useChatStore";
import useAuthStore from "../hooks/useAuthStore";

export default function Sidebar({ onNewChat, onClose }) {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const { sessions = [], fetchSessions, deleteSession, isLoading } =
    useChatStore();
  const { user, logout } = useAuthStore();

  const [search, setSearch] = useState("");

  /**
   * Load sessions only when a user exists
   * prevents infinite 401 loops
   */
  useEffect(() => {
    if (!user) return;

    const loadSessions = async () => {
      try {
        await fetchSessions();
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    };

    loadSessions();
  }, [user, fetchSessions]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();

    if (!window.confirm("Delete this session?")) return;

    try {
      await deleteSession(id);

      if (sessionId === id) {
        navigate("/dashboard");
      }

      toast.success("Session deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete session");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Search filtering
   */
  const filtered = sessions.filter((s) =>
    !search
      ? true
      : s?.title?.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * Date grouping
   */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = {
    Today: filtered.filter((s) => new Date(s.updatedAt) >= today),

    Yesterday: filtered.filter((s) => {
      const d = new Date(s.updatedAt);
      return d >= yesterday && d < today;
    }),

    Older: filtered.filter((s) => new Date(s.updatedAt) < yesterday),
  };

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 20,
              background: "#e8c547",
              borderRadius: 6,
              padding: "2px 6px",
            }}
          >
            💡
          </span>

          <span style={styles.logoText}>Idea Validator</span>
        </div>

        <button style={styles.iconBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* New Chat */}
      <button style={styles.newChatBtn} onClick={onNewChat}>
        + New Session
      </button>

      {/* Search */}
      <div style={{ padding: "0 12px 8px" }}>
        <input
          style={styles.searchInput}
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sessions */}
      <div style={styles.sessionList}>
        {isLoading && sessions.length === 0 ? (
          <div style={styles.centerText}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.centerText}>
            {search ? "No results" : "No sessions yet"}
          </div>
        ) : (
          Object.entries(groups).map(([groupName, groupSessions]) =>
            groupSessions.length > 0 ? (
              <div key={groupName}>
                <div style={styles.groupLabel}>{groupName}</div>

                {groupSessions.map((session) => (
                  <div
                    key={session._id}
                    style={{
                      ...styles.sessionItem,
                      ...(sessionId === session._id
                        ? styles.sessionItemActive
                        : {}),
                    }}
                    onClick={() => navigate(`/chat/${session._id}`)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.sessionTitle}>
                        {session.title || "Untitled"}
                      </div>

                      <div style={styles.sessionMeta}>
                        <span style={styles.categoryBadge}>
                          {session.ideaCategory || "General"}
                        </span>

                        <span>·</span>

                        <span>{session.messageCount || 0} msgs</span>
                      </div>
                    </div>

                    <button
                      style={styles.deleteBtn}
                      onClick={(e) => handleDelete(e, session._id)}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            ) : null
          )
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button
          style={styles.profileBtn}
          onClick={() => navigate("/profile")}
        >
          <div style={styles.userAvatar}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.username}>{user?.name}</div>

            <div style={styles.planText}>
              {user?.plan || "free"} plan
            </div>
          </div>
        </button>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          ⏏
        </button>
      </div>
    </div>
  );
}

/**
 * Styles
 */

const styles = {
  sidebar: {
    width: 260,
    background: "#0d0d15",
    borderRight: "1px solid #1a1a2a",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    flexShrink: 0,
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 14px 12px",
    borderBottom: "1px solid #1a1a2a",
  },

  logoText: {
    color: "#e8e8f0",
    fontWeight: 700,
    fontSize: "0.95rem",
  },

  iconBtn: {
    background: "none",
    border: "none",
    color: "#6a6a8a",
    cursor: "pointer",
  },

  newChatBtn: {
    margin: "12px",
    padding: "10px 14px",
    background: "rgba(232,197,71,0.08)",
    border: "1px solid rgba(232,197,71,0.2)",
    borderRadius: 10,
    color: "#e8c547",
    cursor: "pointer",
    fontWeight: 600,
  },

  searchInput: {
    width: "100%",
    background: "#111118",
    border: "1px solid #1a1a2a",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#e8e8f0",
  },

  sessionList: {
    flex: 1,
    overflowY: "auto",
  },

  centerText: {
    padding: 20,
    textAlign: "center",
    color: "#3a3a5a",
  },

  groupLabel: {
    color: "#3a3a5a",
    fontSize: "0.68rem",
    padding: "10px 16px 4px",
  },

  sessionItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    cursor: "pointer",
    borderRadius: 8,
    margin: "1px 8px",
  },

  sessionItemActive: {
    background: "#1a1a24",
    border: "1px solid #2a2a3a",
  },

  sessionTitle: {
    color: "#c8c8e0",
    fontSize: "0.82rem",
    fontWeight: 500,
  },

  sessionMeta: {
    display: "flex",
    gap: 5,
    fontSize: "0.68rem",
    color: "#3a3a5a",
  },

  categoryBadge: {
    color: "#4a6a8a",
  },

  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  footer: {
    padding: 12,
    borderTop: "1px solid #1a1a2a",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  profileBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#2a2a4a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e8c547",
    fontWeight: 700,
  },

  username: {
    color: "#e8e8f0",
    fontSize: "0.85rem",
    fontWeight: 600,
  },

  planText: {
    color: "#6a6a8a",
    fontSize: "0.7rem",
  },

  logoutBtn: {
    background: "none",
    border: "none",
    color: "#6a6a8a",
    cursor: "pointer",
  },
};