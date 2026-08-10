import { API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Post, Reply } from '../types';

export default function PostThread() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const communityId = 'general';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/community/${communityId}/posts/${postId}/replies`)
      .then(res => res.json())
      .then(data => {
        if (data.post) {
          setPost(data.post);
          setReplies(data.replies || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      
      const res = await fetch(`${API_BASE_URL}/api/community/${communityId}/posts/${postId}/replies`, {
        method: 'POST', credentials: 'include',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ content })
      });
      
      if (res.ok) {
        const newReply = await res.json();
        setReplies(prev => [...prev, newReply]);
        setContent('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link to="/community" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Community
        </Link>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
          </div>
        ) : !post ? (
          <div className="py-12 text-center border border-white/10 rounded-sm bg-white/[0.02]">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest">Discussion not found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/5 border border-[#f5c518]/20 p-6 md:p-8 rounded-sm relative">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-[#f5c518]/10 text-[#f5c518] text-[9px] font-bold uppercase tracking-widest rounded-sm border border-[#f5c518]/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase text-white mb-6 leading-tight">{post.title}</h1>
              <p className="text-white/80 text-base leading-relaxed mb-8 whitespace-pre-wrap">{post.content}</p>
              
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-bold uppercase tracking-widest text-[10px] text-[#f5c518]">OP: {post.authorUsername}</span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest border-b border-white/10 pb-4">
                Replies ({replies.length})
              </h2>
              
              {replies.length > 0 ? (
                <div className="space-y-4">
                  {replies.map(reply => (
                    <div key={reply._id} className="bg-white/[0.02] border border-white/10 p-5 rounded-sm ml-0 sm:ml-8">
                      <p className="text-white/70 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{reply.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-widest text-[9px] text-[#f5c518]">{reply.authorUsername}</span>
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest text-center py-8">No replies yet.</p>
              )}
            </div>

            {user ? (
              <form onSubmit={handleSubmit} className="mt-8 bg-black/30 border border-white/10 p-6 rounded-sm ml-0 sm:ml-8">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-4">Add a Reply</h4>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-white/5 border border-white/10 rounded-sm p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f5c518]/50 min-h-[100px] mb-4"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="bg-[#f5c518] text-black font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Post Reply
                </button>
              </form>
            ) : (
              <div className="mt-8 border border-white/10 p-6 rounded-sm ml-0 sm:ml-8 text-center bg-white/[0.02]">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Log in to reply to this thread.</p>
                <Link to="/profile" className="inline-block bg-white/10 text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm hover:bg-white/20">
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
