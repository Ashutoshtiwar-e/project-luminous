import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BookCard from '../components/BookCard';
import { Book } from '../types';

export default function Author() {
  const { name } = useParams<{ name: string }>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = () => {
    if (!name) return;
    
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/books?author=${encodeURIComponent(name)}`)
      .then(async res => {
        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to load books by author');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
           setBooks(data);
        } else {
           setBooks([]);
           setError("Received invalid data from server.");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'An unexpected error occurred.');
        setBooks([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
      </div>
    );
  }

  const authorName = books.length > 0 ? books[0].author : decodeURIComponent(name || '');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-[#f5c518] transition-colors mb-6">
            <ArrowLeft className="w-3 h-3 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 border-b border-white/10 pb-8">
            <div>
              <p className="text-[#f5c518] text-[10px] font-bold uppercase tracking-widest mb-2">Author Profile</p>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{authorName}</h1>
            </div>
            
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/10 px-4 py-3 rounded-sm">
              <BookOpen className="w-5 h-5 text-white/50" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Published Works</p>
                <p className="text-xl font-black">{books.length}</p>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-sm">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">Unable to load author details right now.</p>
            <button onClick={fetchBooks} className="px-6 py-2 bg-[#f5c518] text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity">
              Retry
            </button>
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-sm">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest">No books found by this author.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
