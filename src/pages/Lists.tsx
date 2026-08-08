import { API_BASE_URL } from '../utils/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoverImage from '../components/CoverImage';
import { Book } from '../types';

interface AlphaGroup {
  letter: string;
  books: Book[];
}

export default function Lists() {
  const [groupedBooks, setGroupedBooks] = useState<AlphaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/books/alphabetical`)
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setGroupedBooks(data);
        } else {
          setGroupedBooks([]);
          setError("Received invalid data from server.");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'An unexpected error occurred.');
        setGroupedBooks([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLists();
  }, []);

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
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">A-Z Index</h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest max-w-2xl">
            Browse our entire collection alphabetically.
          </p>
        </div>

        {/* Quick jump navigation */}
        <div className="sticky top-20 z-40 bg-[#0a0a0a]/90 backdrop-blur-md py-4 mb-12 border-y border-white/10 flex flex-wrap justify-center gap-1 sm:gap-2">
          {groupedBooks.map((group) => (
            <a
              key={group.letter}
              href={`#letter-${group.letter}`}
              className="w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-[#f5c518] hover:text-black rounded-sm transition-colors text-white/50"
            >
              {group.letter}
            </a>
          ))}
        </div>

        <div className="space-y-16">
          {groupedBooks.map((group) => (
            <section key={group.letter} id={`letter-${group.letter}`} className="scroll-mt-32">
              <div className="flex items-baseline gap-4 mb-8 border-b border-white/10 pb-2">
                <h2 className="text-4xl md:text-6xl font-black uppercase text-[#f5c518]">{group.letter}</h2>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{group.books.length} Books</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {group.books.map((book) => (
                  <Link 
                    key={book.id} 
                    to={`/book/${book.id}`}
                    className="group flex gap-4 p-4 rounded-sm hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                    <div className="w-16 h-24 shrink-0 bg-[#1a1a1a] rounded-sm overflow-hidden">
                      <CoverImage 
                        src={book.coverImage} 
                        alt={cleanAndFormatText(book.title)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop";
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-[#f5c518] transition-colors truncate mb-1">
                        {cleanAndFormatText(book.title)}
                      </h3>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest truncate mb-2">
                        {cleanAndFormatText(book.author)}
                      </p>
                      <div className="flex items-center gap-1 text-[#f5c518]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-bold">{book.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
