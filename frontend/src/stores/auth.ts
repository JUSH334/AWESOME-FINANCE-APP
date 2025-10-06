import { create } from "zustand";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  isAuth: boolean;
  login: (u: User, remember?: boolean) => void;
  logout: () => void;
  hydrate: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  login: (user, remember) => {
    set({ user, isAuth: true });
    if (remember) localStorage.setItem("myfin.user", JSON.stringify(user));
  },
  logout: () => { set({ user: null, isAuth: false }); localStorage.removeItem("myfin.user"); },
  hydrate: () => {
    const s = localStorage.getItem("myfin.user");
    if (s) try { const user = JSON.parse(s) as User; set({ user, isAuth: true }); } catch {}
  },
}));
