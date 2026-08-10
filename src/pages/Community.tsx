import { API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { Link, useNavigate } from 'react-router-dom';

const AVAILABLE_TAGS = ['Anime', 'Manga', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'YA', 'Classics', 'General', 'Questions', 'Recommendations'];

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const communityId = 'general';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/community/${communityId}/posts`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [communityId]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    try {
      
      const res = await fetch(`${API_BASE_URL}/api/community/${communityId}/posts`, {
        method: 'POST', credentials: 'include',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ title, content, tags: selectedTags })
      });
      
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        setTitle('');
        setContent('');
        setSelectedTags([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this discussion?")) return;
    
    setDeletingId(postId);
    try {
      
      const res = await fetch(`${API_BASE_URL}/api/community/${communityId}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
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
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.85] mb-4">
            Reader <span className="text-[#f5c518]">Community</span>
          </h1>
          <p className="text-sm font-bold text-white/50 max-w-2xl uppercase tracking-widest">
            A common chat room to discuss everything related to books, genres, and authors.
          </p>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="mb-12 bg-white/5 border border-white/10 p-6 rounded-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white/70">Start a Discussion</h4>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post Title..."
              className="w-full bg-black/50 border border-white/10 rounded-sm p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f5c518]/50"
              required
            />
            
            <div className="py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Add Tags (Optional)</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-colors ${
                      selectedTags.includes(tag) 
                        ? 'bg-[#f5c518] text-black border-[#f5c518]' 
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

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
          <h2 className="text-xs font-black uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Recent Discussions
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <div 
                key={post._id} 
                onClick={() => navigate(`/community/post/${post._id}`)}
                className="bg-white/[0.02] border border-white/10 p-6 rounded-sm relative group cursor-pointer hover:border-[#f5c518]/30 transition-colors"
              >
                {user && user._id === post.authorId && (
                  <button 
                    onClick={(e) => handleDelete(e, post._id)}
                    disabled={deletingId === post._id}
                    className="absolute top-6 right-6 text-white/30 hover:text-red-500 transition-colors disabled:opacity-50 z-10"
                    title="Delete your discussion"
                  >
                    {deletingId === post._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
                <div className="flex items-center justify-between mb-4 pr-8">
                  <h3 className="text-xl font-black tracking-widest uppercase text-white group-hover:text-[#f5c518] transition-colors">{post.title}</h3>
                </div>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-white/5 text-white/60 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-white/70 text-sm leading-relaxed mb-6 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-bold uppercase tracking-widest text-[10px] text-[#f5c518]">By {post.authorUsername}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {post.replyCount || 0} Replies
                    </span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
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
