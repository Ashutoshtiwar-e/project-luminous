import { Bot } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="h-20 shrink-0 bg-[#f5c518] flex items-center px-4 md:px-8 text-black mt-auto">
      <div className="mx-auto max-w-7xl w-full flex items-center gap-3">
        <div className="bg-black text-white p-1.5 rounded">
          <Bot className="w-5 h-5" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline-block">Ask our AI Engine:</span>
        <p className="text-sm italic font-medium truncate">"What are some similar space-themed books with realistic physics?"</p>
        <div className="ml-auto flex gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-1 opacity-60">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 border border-black/20 text-[10px] font-mono font-bold">CMD</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 border border-black/20 text-[10px] font-mono font-bold">K</kbd>
          </div>
          <button 
            onClick={() => alert("AI generation logic placeholder")}
            className="px-4 py-2 border border-black/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-[#f5c518] active:scale-95 transition-all cursor-pointer"
          >
            Generate Recs
          </button>
        </div>
      </div>
    </footer>
  );
}
