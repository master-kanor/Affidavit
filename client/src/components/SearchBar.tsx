import React, { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showHistory?: boolean;
  value?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search evidence...",
  debounceMs = 300,
  showHistory = true,
  value = "",
  onClear,
}) => {
  const [query, setQuery] = useState(value);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("evidenceSearchHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to load search history:", error);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query);
      } else {
        onSearch("");
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
    onClear?.();
    setShowHistoryDropdown(false);
  }, [onSearch, onClear]);

  const handleHistoryClick = useCallback((item: string) => {
    setQuery(item);
    setShowHistoryDropdown(false);
  }, []);

  const handleAddToHistory = useCallback(() => {
    if (query.trim() && !history.includes(query)) {
      const newHistory = [query, ...history].slice(0, 10); // Keep last 10 searches
      setHistory(newHistory);
      localStorage.setItem("evidenceSearchHistory", JSON.stringify(newHistory));
    }
  }, [query, history]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("evidenceSearchHistory");
  }, []);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Save to history when search is performed (after debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleAddToHistory();
      }
    }, debounceMs + 100);

    return () => clearTimeout(timer);
  }, [query, debounceMs, handleAddToHistory]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => showHistory && setShowHistoryDropdown(true)}
          className="pl-10 pr-10 py-2 w-full"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search History Dropdown */}
      {showHistoryDropdown && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Recent Searches
            </p>
            <div className="space-y-1">
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  <Search className="inline w-3 h-3 mr-2 text-slate-400" />
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2 border-t border-slate-200">
            <button
              onClick={handleClearHistory}
              className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
