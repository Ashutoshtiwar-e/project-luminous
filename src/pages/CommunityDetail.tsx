import { API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Send, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/community/${id}/posts`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/community/${id}/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, content })
      });
      
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        setTitle('');
        setContent('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this discussion?")) return;
    
    setDeletingId(postId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/community/${id}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        setPosts(prev => prev.filter(p => p._id !== postId));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete post");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <Link to="/community" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Fandoms
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.85] mb-4">
            {id} <span className="text-[#f5c518]">Fandom</span>
          </h1>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="mb-12 bg-white/5 border border-white/10 p-6 rounded-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">Start a Discussion</h4>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post Title..."
              className="w-full bg-black/50 border border-white/10 rounded-sm p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f5c518]/50"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-black/50 border border-white/10 rounded-sm p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f5c518]/50 min-h-[100px]"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="bg-[#f5c518] text-black font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Submit Discussion
            </button>
          </form>
        ) : (
          <div className="mb-12 bg-white/5 border border-white/10 p-6 rounded-sm text-center">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Log in to create a discussion.</p>
            <Link to="/profile" className="inline-block bg-[#f5c518] text-black font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm hover:opacity-90">
              Go to Login
            </Link>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-widest border-b border-white/10 pb-4">Recent Discussions</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <div key={post._id} className="bg-white/[0.02] border border-white/10 p-6 rounded-sm relative group">
                {user && user._id === post.authorId && (
                  <button 
                    onClick={() => handleDelete(post._id)}
                    disabled={deletingId === post._id}
                    className="absolute top-6 right-6 text-white/30 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete your discussion"
                  >
                    {deletingId === post._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
                <div className="flex items-center justify-between mb-4 pr-8">
                  <h3 className="text-xl font-black tracking-widest uppercase text-white">{post.title}</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-bold uppercase tracking-widest text-[10px] text-[#f5c518]">By {post.authorUsername}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border border-white/10 rounded-sm bg-white/[0.02]">
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">No discussions yet.</p>
              <p className="text-[#f5c518] text-xs font-bold uppercase tracking-widest">Be the first reader to start a conversation.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
