import { API_BASE_URL } from '../utils/api';
import { useParams, Link } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';
import { Star, ChevronLeft, BookmarkPlus, Bookmark, Play, Loader2, Send, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BookCard from '../components/BookCard';
import AIAssistant from '../components/AIAssistant';
import CoverImage from '../components/CoverImage';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { cleanAndFormatText } from '../utils/textFormatting';

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, updateSavedBooks } = useAuth();
  
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const [reviewDigest, setReviewDigest] = useState<any>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [digestError, setDigestError] = useState('');

  const [overviewText, setOverviewText] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchOverview = async () => {
    if (overviewText) {
      setIsOverviewModalOpen(true);
      return;
    }
    setLoadingOverview(true);
    setOverviewError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/books/${id}/overview`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate overview');
      setOverviewText(data.overview);
      setIsOverviewModalOpen(true);
    } catch (err) {
      setOverviewError(err.message || 'Failed to generate overview');
    } finally {
      setLoadingOverview(false);
    }
  };

  const toggleSpeech = () => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(cleanAndFormatText(overviewText));
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (id) {
      setLoadingDigest(true);
      fetch(`${API_BASE_URL}/api/books/${id}/review-digest`)
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to load review digest');
          }
          return data;
        })
        .then(data => {
          if (data.notEnoughReviews) {
            setDigestError('Not enough community reviews yet.');
          } else {
            setReviewDigest(data);
          }
          setLoadingDigest(false);
        })
        .catch(err => {
          console.error(err);
          setDigestError(err.message || 'Failed to load review digest');
          setLoadingDigest(false);
        });
    }
  }, [id, book?.reviews?.length]); // Re-fetch if reviews length changes

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/books/${id}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch book');
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/books`).then(res => res.json())
    ])
      .then(([bookData, allBooks]) => {
        setBook(bookData);
        if (bookData) {
           setRelatedBooks(allBooks.filter((b: Book) => b.id !== bookData.id && b.genre.some(g => bookData.genre.includes(g))).slice(0, 4));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const isSaved = user?.savedBooks.includes(id || '') || false;
  
  const handleSaveToggle = async () => {
    if (!user) {
      alert("Please login first to save books.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/books/${id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        updateSavedBooks(data.savedBooks);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/books/${id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBook(prev => prev ? { ...prev, reviews: prev.reviews.filter(r => r.id !== reviewId) } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setReviewText(review.text);
    setReviewRating(review.rating);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first to submit a review.");
      return;
    }
    if (!reviewText.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (editingReviewId) {
        const res = await fetch(`${API_BASE_URL}/api/books/${id}/reviews/${editingReviewId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ text: reviewText, rating: reviewRating })
        });
        if (res.ok) {
          setBook(prev => prev ? { 
            ...prev, 
            reviews: prev.reviews.map(r => 
              r.id === editingReviewId ? { ...r, text: reviewText, rating: reviewRating } : r
            )
          } : null);
          setReviewText('');
          setReviewRating(5);
          setEditingReviewId(null);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/books/${id}/reviews`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ text: reviewText, rating: reviewRating })
        });
        if (res.ok) {
          const newReview = await res.json();
          setBook(prev => prev ? { ...prev, reviews: [newReview, ...prev.reviews] } : null);
          setReviewText('');
          setReviewRating(5);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans">
        <h1 className="text-2xl font-bold mb-4 uppercase">Book not found</h1>
        <Link to="/" className="text-[#f5c518] hover:underline font-bold uppercase tracking-widest text-xs">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      {/* Featured Hero Section (Editorial/Bold) */}
      <section className="relative flex flex-col justify-end p-8 md:p-12 min-h-[60vh] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent">
        <div 
          className="absolute inset-0 -z-10 bg-center bg-cover opacity-30" 
          style={{ backgroundImage: `linear-gradient(rgba(10,10,10,0.8), rgba(10,10,10,0))` }}
        ></div>
        
        <div className="mx-auto max-w-7xl w-full flex flex-col md:flex-row gap-8 md:items-end">
          <div className="flex-1">
            <Link to="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white mb-8 group transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Browse
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest">
                {cleanAndFormatText(book.genre[0])}
              </span>
              <div className="flex items-center gap-1 text-[#f5c518]">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{book.rating.toFixed(1)}</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-8xl font-black leading-[0.85] tracking-tighter mb-4 uppercase">
              {cleanAndFormatText(book.title)}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-xs font-medium text-white/50 mb-8 uppercase tracking-widest">
              <Link to={`/author/${encodeURIComponent(book.author)}`} className="hover:text-[#f5c518] transition-colors">By {cleanAndFormatText(book.author)}</Link>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{cleanAndFormatText(book.genre.join(", "))}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{book.pageCount} Pages</span>
              <span className="hidden sm:inline">•</span>
              <span>Published {new Date(book.publicationDate).getFullYear()}</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleSaveToggle}
                className={`px-8 py-4 ${isSaved ? 'bg-white text-black' : 'bg-[#f5c518] text-black'} font-black uppercase text-xs tracking-widest rounded-sm hover:scale-105 transition-transform flex items-center gap-2`}
              >
                {isSaved ? <Bookmark className="w-4 h-4 fill-current" /> : <BookmarkPlus className="w-4 h-4" />}
                {isSaved ? 'Saved to Library' : 'Save to Library'}
              </button>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={fetchOverview}
                  disabled={loadingOverview}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md border-white/20 text-white border font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {loadingOverview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loadingOverview ? 'Generating...' : 'AI Overview'}
                </button>
                {overviewError && <span className="text-red-400 text-[10px] font-bold tracking-wider">{overviewError}</span>}
              </div>

            </div>
          </div>
          
          <div className="w-48 md:w-64 shrink-0 rounded-sm overflow-hidden shadow-2xl border border-white/10 mt-8 md:mt-0">
            <CoverImage 
              src={book.coverImage} 
              alt={cleanAndFormatText(book.title)} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop";
              }}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 md:px-8 py-12 flex flex-col md:flex-row gap-12 w-full flex-1">
        {/* Left Column: Details & Reviews */}
        <div className="md:w-[60%] space-y-12">
          {/* Synopsis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5c518] mb-6">Synopsis</h3>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium whitespace-pre-wrap">
              {cleanAndFormatText(book.summary)}
            </p>
          </motion.div>

          {/* AI Review Digest */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {loadingDigest ? (
              <div className="p-8 border border-white/10 bg-white/[0.02] rounded-sm flex flex-col items-center justify-center gap-4 mb-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Analyzing Community Sentiment...</p>
              </div>
            ) : reviewDigest ? (
              <div className="mb-12 bg-[#111] border border-white/10 p-6 md:p-8 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#f5c518] to-orange-500"></div>
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <Sparkles className="w-5 h-5 text-[#f5c518]" />
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">AI Review Digest</h3>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#f5c518] border border-[#f5c518]/30 px-2 py-1 rounded-sm bg-[#f5c518]/10">
                    {reviewDigest.confidence}% Confidence
                  </span>
                </div>
                
                <p className="text-sm md:text-base text-white/90 leading-relaxed mb-8 italic">
                  "{reviewDigest.summary}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Pros */}
                  <div className="bg-white/[0.02] p-5 rounded-sm border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Readers Loved
                    </h4>
                    <ul className="space-y-3">
                      {reviewDigest.pros.map((pro: string, i: number) => (
                        <li key={i} className="text-xs font-bold text-white/80 flex items-start gap-2">
                          <span className="text-green-400 font-black shrink-0">✓</span> <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="bg-white/[0.02] p-5 rounded-sm border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Readers Disliked
                    </h4>
                    <ul className="space-y-3">
                      {reviewDigest.cons.map((con: string, i: number) => (
                        <li key={i} className="text-xs font-bold text-white/80 flex items-start gap-2">
                          <span className="text-red-400 font-black shrink-0">✗</span> <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="flex flex-col gap-1 border-l-2 border-[#f5c518]/30 pl-3">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Experience</span>
                    <p className="text-xs font-bold text-white/80">{reviewDigest.readingExperience}</p>
                  </div>
                  <div className="flex flex-col gap-1 border-l-2 border-[#f5c518]/30 pl-3">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Style</span>
                    <p className="text-xs font-bold text-white/80">{reviewDigest.writingStyle}</p>
                  </div>
                  <div className="flex flex-col gap-1 border-l-2 border-[#f5c518]/30 pl-3">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Pacing</span>
                    <p className="text-xs font-bold text-white/80">{reviewDigest.pacing}</p>
                  </div>
                  <div className="flex flex-col gap-1 border-l-2 border-[#f5c518]/30 pl-3">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Difficulty</span>
                    <p className="text-xs font-bold text-white/80">{reviewDigest.difficulty}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400 w-24 shrink-0 pt-0.5">Who Should Read It</span>
                    <p className="text-xs font-bold text-white/90">{reviewDigest.recommendedFor}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 w-24 shrink-0 pt-0.5">Who Might Not Enjoy It</span>
                    <p className="text-xs font-bold text-white/90">{reviewDigest.notRecommendedFor}</p>
                  </div>
                </div>

              </div>
            ) : digestError === 'Not enough community reviews yet.' ? (
              <div className="mb-12 bg-white/[0.02] border border-white/5 p-6 rounded-sm flex items-center justify-center">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Not enough community reviews yet.
                </p>
              </div>
            ) : null}
          </motion.div>

          {/* Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5c518] mb-6">User Reviews</h3>
            
            {user ? (
              <form onSubmit={handleReviewSubmit} className="mb-8 bg-white/5 border border-white/10 p-6 rounded-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">Write a Review</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-[#f5c518] text-[#f5c518]' : 'text-white/20'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  className="w-full bg-black/50 border border-white/10 rounded-sm p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f5c518]/50 min-h-[100px]"
                  required
                />
                <div className="flex items-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || !reviewText.trim()}
                    className="bg-[#f5c518] text-black font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {editingReviewId ? 'Update Review' : 'Submit Review'}
                  </button>
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewText('');
                        setReviewRating(5);
                      }}
                      className="ml-4 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mb-8 bg-white/5 border border-white/10 p-6 rounded-sm text-center">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Log in to share your thoughts on this book.</p>
                <Link to="/profile" className="inline-block bg-[#f5c518] text-black font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm hover:opacity-90">
                  Go to Login
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {book.reviews && book.reviews.length > 0 ? (
                book.reviews.map(review => (
                  <div key={review.id} className="bg-white/[0.02] border border-white/10 p-6 rounded-sm relative group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold uppercase tracking-widest text-[10px]">{review.user}</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{review.date}</span>
                    </div>
                    <div className="flex mb-4 text-[#f5c518]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-white/20'}`} />
                      ))}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{cleanAndFormatText(review.text)}</p>
                    
                    {user && user._id === review.userId && (
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button 
                          onClick={() => handleEditReview(review)}
                          className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 border border-white/5 text-center rounded-sm">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">No reviews yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: AI & Recommendations */}
        <div className="md:w-[40%]">
          <div className="sticky top-24 flex flex-col gap-8">
            {/* Content Warnings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 border border-white/10 bg-white/[0.02] rounded-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#f5c518]">Content Warnings</h3>
              </div>
              {book.contentWarnings && book.contentWarnings.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {book.contentWarnings.map((warning, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      {warning}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-xs uppercase tracking-widest font-bold">No content warnings reported.</p>
              )}
            </motion.div>

          {/* AI Summary Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 border border-white/10 bg-white/[0.02] rounded-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f5c518]">AI Insight Summary</h3>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <ul className="space-y-6">
              {book.aiSummary.map((point, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="text-[#f5c518] font-bold text-sm">{(idx + 1).toString().padStart(2, '0')}</span>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{cleanAndFormatText(point)}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Recommendations */}
          {relatedBooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 border border-white/10 bg-[#0e0e0e] rounded-sm flex-1"
            >
              <h3 className="text-xs font-black uppercase tracking-widest mb-6">Similar to this genre</h3>
              <div className="grid grid-cols-2 gap-6">
                {relatedBooks.map(b => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </motion.div>
          )}
          </div>
        </div>
      </main>

      <Footer />
      <AIAssistant bookId={book.id} bookTitle={cleanAndFormatText(book.title)} />

      {isOverviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0e0e0e] border border-white/10 rounded-sm shadow-2xl max-w-2xl w-full p-6 md:p-8 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#f5c518] flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> AI Overview
              </h2>
              <button 
                onClick={() => {
                  if (isSpeaking) toggleSpeech();
                  setIsOverviewModalOpen(false);
                }} 
                className="text-white/50 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto mb-8 pr-2">
              <p className="text-white/80 leading-relaxed text-sm md:text-base">
                {cleanAndFormatText(overviewText)}
              </p>
            </div>
            
            <div className="flex justify-end mt-auto pt-4 border-t border-white/10">
              {window.speechSynthesis && (
                <button
                  onClick={toggleSpeech}
                  className="px-6 py-3 bg-[#f5c518] text-black font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {isSpeaking ? 'Stop Listening' : 'Listen to Overview'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
