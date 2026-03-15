import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      /**
       * Set user manually
       */
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user
        }),

      /**
       * Store token
       */
      setTokens: (accessToken) => {
        if (!accessToken) return;

        localStorage.setItem("accessToken", accessToken);

        set({
          accessToken,
          isAuthenticated: true
        });
      },

      /**
       * Login success handler
       */
      loginSuccess: (data) => {
        if (!data?.accessToken) return;

        localStorage.setItem("accessToken", data.accessToken);

        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true
        });
      },

      /**
       * Logout
       */
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (err) {
          console.warn("Logout API failed");
        }

        localStorage.removeItem("accessToken");

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false
        });
      },

      /**
       * Fetch logged in user
       * PROTECTED against missing token
       */
      fetchUser: async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false
          });
          return;
        }

        try {
          set({ isLoading: true });

          const { data } = await api.get("/auth/me");

          set({
            user: data.user,
            isAuthenticated: true,
            accessToken: token
          });
        } catch (err) {
          console.error("Auth check failed", err);

          localStorage.removeItem("accessToken");

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false
          });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Update user profile locally
       */
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }))
    }),
    {
      name: "auth-storage",

      /**
       * Persist only token
       */
      partialize: (state) => ({
        accessToken: state.accessToken
      })
    }
  )
);

export default useAuthStore;