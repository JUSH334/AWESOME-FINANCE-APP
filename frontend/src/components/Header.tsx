﻿import { Search } from "lucide-react";
import { useAuth } from "../stores/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

type HeaderProps = {
  title?: string; // this will come from AppShell
};

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch();
    }
  };

  // Handle search button click or Enter
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Navigate to accounts page with search query
      navigate('/accounts', { state: { searchQuery: searchQuery.trim() } });
      // Clear the search after a moment to allow the navigation
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">
          {title || "Dashboard"}
        </h1>
        <p className="text-slate-500 text-sm">
          Welcome back
          {user ? `, ${user.name ?? user.email}` : "!"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" 
            onClick={handleSearch}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search transactions…"
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            disabled={isSearching}
          />
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          Logout
        </button>
      </div>
    </div>
  );
}