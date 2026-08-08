import { API_BASE_URL } from '../utils/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Plus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoverImage from '../components/CoverImage';
import { useAuth } from '../context/AuthContext';

const communities = [
  { id: 'manga', name: 'Manga', desc: 'Discuss latest chapters, recommendations, and series.', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop' },
  { id: 'fantasy', name: 'Fantasy', desc: 'Epic world-building, magic systems, and legendary quests.', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop' },
  { id: 'scifi', name: 'Science Fiction', desc: 'Space operas, cyberpunk, and speculative futures.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop' },
  { id: 'mystery', name: 'Mystery', desc: 'Whodunnits, thrillers, and true crime enthusiasts.', image: 'https://images.unsplash.com/photo-1587876931567-564ce588bfbd?q=80&w=1000&auto=format&fit=crop' },
  { id: 'romance', name: 'Romance', desc: 'Heartwarming stories, tropes, and character shipping.', image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=1000&auto=format&fit=crop' },
  { id: 'nonfiction', name: 'Non-Fiction', desc: 'Biographies, history, science, and self-improvement.', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1000&auto=format&fit=crop' },
  { id: 'horror', name: 'Horror', desc: 'Supernatural scares, psychological thrills, and monsters.', image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1000&auto=format&fit=crop' },
  { id: 'classics', name: 'Classics', desc: 'Timeless literature, philosophical texts, and deep dives.', image: 'https://images.unsplash.com/photo-1555448248-2571daf6344b?q=80&w=1000&auto=format&fit=crop' },
  { id: 'ya', name: 'Young Adult', desc: 'Coming of age, dystopias, and teen drama.', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1000&auto=format&fit=crop' },
  { id: 'comics', name: 'Comics & Graphic Novels', desc: 'Superheroes, indie comics, and visual storytelling.', image: 'https://images.unsplash.com/photo-1536853702580-e88383a8b417?q=80&w=1000&auto=format&fit=crop' },
];

export default function Community() {
  const { user, updateJoinedCommunities } = useAuth();
  const navigate = useNavigate();
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  const toggleJoin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      alert("Please login first to join communities.");
      return;
    }

    setLoadingIds(prev => ({ ...prev, [id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/community/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        updateJoinedCommunities(data.joinedCommunities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCardClick = (id: string) => {
    navigate(`/community/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f5c518]/30 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.85] mb-4">
            Reader <span className="text-[#f5c518]">Fandoms</span>
          </h1>
          <p className="text-sm font-bold text-white/50 max-w-2xl uppercase tracking-widest">
            Join the conversation. Connect with readers who share your passion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((comm, idx) => (
            <motion.div
              key={comm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleCardClick(comm.id)}
              className="group relative rounded-sm overflow-hidden bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20 cursor-pointer"
            >
              <div className="h-32 w-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10"></div>
                <CoverImage 
                  src={comm.image} 
                  alt={comm.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                />
              </div>
              
              <div className="p-6 pt-0 relative z-20 flex flex-col h-[calc(100%-8rem)]">
                <div className="flex justify-between items-start mb-2 -mt-4">
                  <h3 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-md">{comm.name}</h3>
                </div>
                
                <p className="text-sm text-white/60 mb-6 flex-1">
                  {comm.desc}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  
                  
                  <button
                    onClick={(e) => toggleJoin(e, comm.id)}
                    disabled={loadingIds[comm.id]}
                    className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                      user?.joinedCommunities?.includes(comm.id)
                        ? 'bg-white/10 text-white'
                        : 'bg-[#f5c518] text-black hover:bg-[#f5c518]/90'
                    } disabled:opacity-50`}
                  >
                    {!user?.joinedCommunities?.includes(comm.id) && !loadingIds[comm.id] && <Plus className="w-3 h-3" />}
                    {loadingIds[comm.id] ? '...' : (user?.joinedCommunities?.includes(comm.id) ? 'Joined' : 'Join')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
