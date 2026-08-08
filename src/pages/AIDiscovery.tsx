import { API_BASE_URL } from '../utils/api';
import React, { useState } from 'react';
import { cleanAndFormatText } from '../utils/textFormatting';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Sparkles, BookOpen, Brain, Activity, Heart, ArrowRight, TrendingUp, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoverImage from '../components/CoverImage';

interface AIRecommendation {
  id: string;
  matchPercentage: number;
  whyItMatches: string;
  themes: string[];
  readingDifficulty: string;
  mood: string;
  pacing: string;
  writingStyle: string;
  emotionalTone: string;
  targetAudience: string;
  matchBreakdown: {
    theme: number;
    mood: number;
    pacing: number;
    difficulty: number;
  };
  book: {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    genre: string[];
  };
  relatedBooks: {
    id: string;
    title: string;
    author: string;
    coverImage: string;
  }[];
}

const ProgressBar = ({ label, value }: { label: string, value: number }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/50">
        <span>{label}</span>
        <span className="text-white/80">{value}/10</span>
      </div>
      <div className="w-full h-1 bg-white/5 overflow-hidden flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex-1 h-full relative">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: i < value ? 1 : 0 }}
              transition={{ delay: 0.2 + (i * 0.05) }}
              className="absolute inset-0 bg-[#f5c518]"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AIDiscovery() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIRecommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const examplePrompts = [
    "Fantasy with dragons",
    "Books like Interstellar",
    "Slow emotional romance",
    "Fast thriller",
    "Books about artificial intelligence",
    "Something funny and under 250 pages"
  ];

  const handleSearch = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = presetQuery || query;
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setLoading(true);
    setHasSearched(true);
    setErrorMsg('');
    setResults([]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!res.ok) {
        let errData;
        try { errData = await res.json(); } catch(e) {}
        throw new Error((errData && errData.error) || 'Failed to discover books');
      }

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during discovery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center px-4 py-16 md:py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#f5c518]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-[#f5c518]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f5c518]">Project Luminous AI</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Semantic Discovery</h1>
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest max-w-xl mx-auto">
              Describe the kind of book you want to read in natural language. Our AI will explain exactly why each recommendation fits.
            </p>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearch} 
            className="w-full relative mb-12"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-[#f5c518]/20 to-orange-500/20 rounded-sm blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-[#111] border border-white/10 rounded-sm">
                <Search className="absolute left-6 w-6 h-6 text-white/30" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you in the mood for?"
                  className="w-full bg-transparent border-none py-6 pl-16 pr-32 text-lg text-white placeholder-white/20 focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 px-6 py-3 bg-[#f5c518] text-black text-xs font-black uppercase tracking-widest rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Discover'}
                </button>
              </div>
            </div>
          </motion.form>

          {/* Initial State - Example Prompts */}
          {!hasSearched && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Try these examples</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(undefined, prompt)}
                    className="px-4 py-2 bg-white/[0.02] hover:bg-white/10 border border-white/5 rounded-full text-xs font-semibold text-white/70 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {errorMsg && (
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-sm text-center mb-8">
              {errorMsg}
            </div>
          )}

          {/* Results Area */}
          <div className="w-full flex flex-col gap-12">
            <AnimatePresence mode="popLayout">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full py-24 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-white/5 rounded-sm"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-[#f5c518] mb-6" />
                  <p className="text-white/70 text-sm font-bold uppercase tracking-widest animate-pulse">
                    Analyzing millions of semantic connections...
                  </p>
                </motion.div>
              )}

              {!loading && hasSearched && results.length === 0 && !errorMsg && (
                 <motion.div
                 key="empty"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="w-full py-24 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-white/5 rounded-sm"
               >
                 <Brain className="w-12 h-12 text-white/20 mb-4" />
                 <p className="text-white/50 text-sm font-bold uppercase tracking-widest">
                   No exact matches found in our database. Try a different prompt.
                 </p>
               </motion.div>
              )}

              {!loading && results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full flex flex-col"
                >
                  <div className="w-full bg-[#111] border border-white/10 p-6 md:p-8 flex flex-col md:flex-row gap-8 rounded-sm relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f5c518] to-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Left Column: Cover & Match % */}
                    <div className="shrink-0 w-32 md:w-48 mx-auto md:mx-0 relative flex flex-col gap-4">
                      <Link to={`/book/${result.book.id}`} className="relative block">
                        <div className="absolute -top-3 -right-3 w-12 h-12 bg-black rounded-full border-2 border-[#f5c518] flex items-center justify-center z-10 shadow-xl">
                          <span className="text-[#f5c518] font-black text-sm">{result.matchPercentage}%</span>
                        </div>
                        <CoverImage 
                          src={result.book.coverImage} 
                          alt={cleanAndFormatText(result.book.title)}
                          className="w-full h-auto aspect-[2/3] object-cover rounded-sm shadow-2xl group-hover:-translate-y-2 transition-transform duration-500"
                        />
                      </Link>
                      
                      {/* Match Breakdown Bars */}
                      <div className="space-y-3 p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                        <h4 className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1 border-b border-white/10 pb-1">Match Profile</h4>
                        <ProgressBar label="Theme" value={result.matchBreakdown.theme} />
                        <ProgressBar label="Mood" value={result.matchBreakdown.mood} />
                        <ProgressBar label="Pacing" value={result.matchBreakdown.pacing} />
                        <ProgressBar label="Difficulty" value={result.matchBreakdown.difficulty} />
                      </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 flex flex-col">
                      <div className="mb-4">
                        <Link to={`/book/${result.book.id}`}>
                          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-1 hover:text-[#f5c518] transition-colors">
                            {cleanAndFormatText(result.book.title)}
                          </h2>
                        </Link>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
                          By {cleanAndFormatText(result.book.author)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.book.genre.map((g, i) => (
                            <span key={i} className="px-2 py-1 bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-white/10 text-white/70">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI Explanation Box */}
                      <div className="bg-gradient-to-br from-[#f5c518]/5 to-transparent border border-[#f5c518]/20 p-5 rounded-sm mb-6 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 text-[#f5c518]/10">
                          <Sparkles className="w-24 h-24" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#f5c518] mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Why this matches your query
                        </h3>
                        <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium relative z-10">
                          {cleanAndFormatText(result.whyItMatches)}
                        </p>
                      </div>

                      {/* Extended Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto mb-6 bg-white/[0.01] p-4 border border-white/5 rounded-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5"><Brain className="w-3 h-3" /> Tone</span>
                          <p className="text-xs font-bold text-white/80">{result.emotionalTone}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Pacing</span>
                          <p className="text-xs font-bold text-white/80">{result.pacing}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3" /> Difficulty</span>
                          <p className="text-xs font-bold text-white/80">{result.readingDifficulty}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5"><User className="w-3 h-3" /> Audience</span>
                          <p className="text-xs font-bold text-white/80">{result.targetAudience}</p>
                        </div>
                        <div className="col-span-2 md:col-span-4 mt-2 border-t border-white/5 pt-3 flex flex-col gap-1">
                           <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Writing Style</span>
                           <p className="text-xs font-bold text-white/80">{result.writingStyle}</p>
                        </div>
                        <div className="col-span-2 md:col-span-4 mt-1 flex flex-col gap-1">
                           <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5"><Brain className="w-3 h-3" /> Core Themes</span>
                           <p className="text-xs font-bold text-white/80 truncate">{result.themes.join(', ')}</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Related Books Ribbon */}
                  {result.relatedBooks && result.relatedBooks.length > 0 && (
                    <div className="bg-[#1a1a1a] border-x border-b border-white/5 p-4 md:px-8 py-4 rounded-b-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-white/50">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Readers also explored</span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
                        {result.relatedBooks.map(rb => (
                          <Link 
                            key={rb.id} 
                            to={`/book/${rb.id}`}
                            className="group/mini flex items-center gap-3 shrink-0 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 p-2 rounded-sm transition-colors"
                          >
                            <CoverImage src={rb.coverImage} alt={rb.title} className="w-8 h-12 object-cover rounded-sm group-hover/mini:scale-105 transition-transform" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 truncate w-32 group-hover/mini:text-[#f5c518]">{rb.title}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 truncate w-32">{rb.author}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
