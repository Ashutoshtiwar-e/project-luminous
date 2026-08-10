import { API_BASE_URL } from '../utils/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BookCard from '../components/BookCard';
import { Book } from '../types';

interface CategoryGroup {
  category: string;
  books: Book[];
}

export default function Categories() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/books/categories`)
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch categories');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
          setError("Received invalid data from server.");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "An unexpected error occurred.");
        setCategories([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => prev === cat ? null : cat);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Browse by Genre</h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest max-w-2xl">
            Explore deep dives into specific genres, from hard sci-fi to historical romance.
          </p>
        </div>

        {error ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-sm">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">Unable to load categories right now.</p>
            <button onClick={fetchCategories} className="px-6 py-2 bg-[#f5c518] text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity">
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-sm">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest">No categories available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
          {categories.map((group) => {
            const isExpanded = expandedCategory === group.category;
            return (
              <div key={group.category} className="border border-white/10 bg-white/[0.02] rounded-sm overflow-hidden">
                <button 
                  onClick={() => toggleCategory(group.category)}
                  className="w-full px-6 py-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-widest">{group.category}</h2>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {group.books.length} {group.books.length === 1 ? 'Book' : 'Books'}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {group.books.map(book => (
                            <BookCard key={book.id} book={book} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
