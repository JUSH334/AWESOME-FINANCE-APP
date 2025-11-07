import { create } from "zustand";
import type { User } from "../types";
import { api } from "../services/api";

type AuthState = {
  user: User | null;
  isAuth: boolean;
  login: (u: User, remember?: boolean) => void;
  logout: () => void;
  hydrate: () => Promise<void>;  // Added Promise<void> return type
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  login: (user, remember) => {
    set({ user, isAuth: true });
    if (remember) localStorage.setItem("myfin.user", JSON.stringify(user));
  },
  logout: () => { 
    set({ user: null, isAuth: false }); 
    localStorage.removeItem("myfin.user");
    api.logout();
  },
  hydrate: async () => {
    try {
      // First, try to get user from JWT token
      const user = await api.getCurrentUser();
      if (user) {
        set({ user, isAuth: true });
        return;
      }

      // Fallback to localStorage (for backward compatibility)
      const s = localStorage.getItem("myfin.user");
      if (s) {
        try { 
          const user = JSON.parse(s) as User; 
          set({ user, isAuth: true }); 
        } catch {
          localStorage.removeItem("myfin.user");
        }
      }
    } catch (error) {
      console.error("Hydration failed:", error);
      // Clear any invalid state
      set({ user: null, isAuth: false });
    }
  },
}));