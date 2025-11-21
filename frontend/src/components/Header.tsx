﻿import { Search, LogOut } from "lucide-react";
import { useAuth } from "../stores/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  showWelcome?: boolean;
};

export default function Header({ title, subtitle, showWelcome = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch();
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      navigate('/accounts', { state: { searchQuery: searchQuery.trim() } });
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">
          {title || "Dashboard"}
        </h1>
        {subtitle && (
          <p className="text-slate-600 text-sm mt-1">{subtitle}</p>
        )}
          {showWelcome && (
          <p className="text-slate-500 text-sm">
            Welcome back
            {user ? `, ${user.name ?? user.email}` : "!"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">

        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}