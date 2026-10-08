import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
        <Search size={14} />
      </div>
      <input
        type="text"
        placeholder="Cari kata kunci permohonan bantuan..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="block w-full pl-9 pr-3 py-2 border-2 border-border-custom bg-input-bg text-text-primary placeholder:text-text-muted font-mono text-xs rounded-none focus:outline-none transition-colors"
      />
    </div>
  );
}
