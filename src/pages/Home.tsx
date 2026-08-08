import { API_BASE_URL } from '../utils/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import { Book } from '../types';

interface HomeData {
  trending: Book[];
  recentlyAdded: Book[];
  hiddenGems: Book[];
  recommended: Book[];
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  const location = useLocation();
  const searchBarRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    // Fetch home data on initial load
    fetch(`${API_BASE_URL}/api/books/home`)
      .then(res => res.json())
      .then(data => {
        setHomeData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load home data", err);
        setLoading(false);
      });
  }, []);

  const fetchSearchResults = async (pageNum: number, query: string, category: string | null, append = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setFetchingMore(true);
      }
      
      let endpoint = `${API_BASE_URL}/api/books/search?page=${pageNum}&limit=10`;
      if (query) endpoint += `&q=${encodeURIComponent(query)}`;
      if (category) endpoint += `&genre=${encodeURIComponent(category)}`;
      
      const res = await fetch(endpoint);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch search results');
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
         throw new Error("Received invalid data from server.");
      }
      
      if (data.length < 10) setHasMore(false);
      else setHasMore(true);
      
      if (append) {
        setSearchResults(prev => [...prev, ...data]);
      } else {
        setSearchResults(data);
      }
    } catch (err: any) {
      console.error(err);
      if (!append) {
        setError(err.message || 'Failed to fetch search results.');
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery || selectedCategory) {
      setPage(1);
      fetchSearchResults(1, debouncedQuery, selectedCategory, false);
    }
  }, [debouncedQuery, selectedCategory]);

  useEffect(() => {
    if (page > 1 && (debouncedQuery || selectedCategory)) {
      fetchSearchResults(page, debouncedQuery, selectedCategory, true);
    }
  }, [page]);

  const lastBookElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || fetchingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, fetchingMore, hasMore]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('search') === 'focus' && searchBarRef.current) {
      searchBarRef.current.focus();
    }
    
    const urlQuery = params.get('q');
    if (urlQuery !== null && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [location]);

  const categories = [
    "Fiction", "Science Fiction", "Dystopian", "Fantasy", 
    "Classics", "Romance", "Mystery", "Non-Fiction"
  ];

  const renderBookRow = (title: string, books: Book[]) => {
    if (!books || books.length === 0) return null;
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/90">{title}</h2>
          <button className="text-[10px] font-bold text-[#f5c518] uppercase tracking-widest hover:text-white transition-colors flex items-center">
            View All <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {books.map((book) => (
            <div key={book.id} className="w-36 sm:w-44 shrink-0 snap-start">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (loading && page === 1 && !homeData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
      </div>
    );
  }

  const showSearch = debouncedQuery || selectedCategory;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero & Search Section */}
        <section className="py-12 flex flex-col items-center text-center space-y-6 mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-4"
          >
            Discover Your Next<br/><span className="text-[#f5c518]">Great Read</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-bold text-white/50 max-w-2xl uppercase tracking-widest"
          >
            Explore our curated collection, enhanced with AI summaries and personalized recommendations.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full mt-8"
          >
            <SearchBar ref={searchBarRef} value={searchQuery} onChange={setSearchQuery} />
          </motion.div>
        </section>

        {/* Categories Pills */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategory === null 
                  ? 'bg-[#f5c518] text-black' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[#f5c518] text-black' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-sm">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">Unable to load data right now.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#f5c518] text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity">
              Retry
            </button>
          </div>
        ) : showSearch ? (
          <section>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <h2 className="text-xs font-black uppercase tracking-widest">
                Search Results
              </h2>
              <span className="text-[10px] font-bold text-[#f5c518] uppercase tracking-widest">{searchResults.length} results</span>
            </div>
            
            {searchResults.length > 0 ? (
              <>
                <motion.div 
                  layout
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10"
                >
                  {searchResults.map((book, idx) => {
                    const isLastBook = idx === searchResults.length - 1;
                    return (
                      <motion.div
                        key={book.id + idx}
                        ref={isLastBook ? lastBookElementRef : null}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (idx % 10) * 0.05 }}
                      >
                        <BookCard book={book} />
                      </motion.div>
                    );
                  })}
                </motion.div>
                {fetchingMore && (
                  <div className="flex justify-center mt-8 py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#f5c518]" />
                  </div>
                )}
              </>
            ) : (
              <div className="py-24 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-white/40">No books found matching your criteria.</p>
              </div>
            )}
          </section>
        ) : (
          homeData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {renderBookRow("Recommended For You", homeData.recommended)}
              {renderBookRow("Trending Now", homeData.trending)}
              {renderBookRow("Recently Added", homeData.recentlyAdded)}
              {renderBookRow("Hidden Gems", homeData.hiddenGems)}
            </motion.div>
          )
        )}
      </main>

      <Footer />
      
      {/* Scrollbar hide styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
