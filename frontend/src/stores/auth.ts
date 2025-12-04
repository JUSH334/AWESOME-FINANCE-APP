import { create } from "zustand";
import type { User } from "../types";
import { api } from "../services/api";

type AuthState = {
  user: User | null;
  isAuth: boolean;
  login: (u: User, remember?: boolean) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  
  login: (user, remember = true) => {
    set({ user, isAuth: true });
    
    // Store user data based on remember preference
    if (remember) {
      // Persistent: survives browser close
      localStorage.setItem("myfin.user", JSON.stringify(user));
      sessionStorage.removeItem("myfin.session.user");
    } else {
      // Temporary: cleared when browser closes
      sessionStorage.setItem("myfin.session.user", JSON.stringify(user));
      localStorage.removeItem("myfin.user");
    }
  },
  
  logout: () => { 
    set({ user: null, isAuth: false }); 
    // Clear both storage types
    localStorage.removeItem("myfin.user");
    sessionStorage.removeItem("myfin.session.user");
    // Clear JWT tokens (handled in api.ts)
    api.logout();
  },
  
  hydrate: async () => {
    try {
      // First, try to get user from JWT token (checks both sessionStorage and localStorage)
      const user = await api.getCurrentUser();
      if (user) {
        set({ user, isAuth: true });
        return;
      }

      // Fallback: check sessionStorage first (temp), then localStorage (persistent)
      const sessionUser = sessionStorage.getItem("myfin.session.user");
      const persistentUser = localStorage.getItem("myfin.user");
      const userStr = sessionUser || persistentUser;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          set({ user, isAuth: true });
        } catch {
          // Invalid JSON, clear everything
          localStorage.removeItem("myfin.user");
          sessionStorage.removeItem("myfin.session.user");
          set({ user: null, isAuth: false });
        }
      } else {
        // No user data found
        set({ user: null, isAuth: false });
      }
    } catch (error) {
      console.error("Hydration failed:", error);
      // Clear any invalid state
      set({ user: null, isAuth: false });
      localStorage.removeItem("myfin.user");
      sessionStorage.removeItem("myfin.session.user");
    }
  },
}));