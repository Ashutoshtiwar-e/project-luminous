import { forwardRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ value, onChange }, ref) => {
  return (
    <div className="relative max-w-2xl mx-auto w-full group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-white/30 group-focus-within:text-[#f5c518] transition-colors" />
      </div>
      <input
        ref={ref}
        type="text"
        className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#f5c518]/50 transition-all shadow-lg"
        placeholder="Search for books, authors, or genres..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
export default SearchBar;
