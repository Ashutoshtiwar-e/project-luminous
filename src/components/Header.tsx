import React from 'react';
import { Search, User, Bookmark, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  const navItems = [
    { name: 'Discover', path: '/' },
    { name: 'AI Discovery', path: '/ai-discovery' },
    { name: 'Categories', path: '/categories' },
    { name: 'Lists', path: '/lists' },
    { name: 'Community', path: '/community' }
  ];

  const handleSearchClick = () => {
    navigate('/?search=focus');
    setMobileMenuOpen(false);
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileMenuOpen(false);
      setMobileSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-white/70 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-[#f5c518] text-black font-black px-2 py-0.5 rounded text-xl uppercase tracking-tighter">LIBRE</div>
              <span className="text-sm font-semibold tracking-widest text-white/40 uppercase hidden sm:inline-block">Database</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex h-full items-center gap-8 text-xs font-bold uppercase tracking-widest text-white/60">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.name}
                  to={item.path}
                  className={`relative h-full flex items-center transition-colors duration-200 hover:text-white cursor-pointer ${isActive ? 'text-[#f5c518]' : ''}`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#f5c518]"></span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleSearchClick}
              className="text-white/70 hover:text-white transition-colors cursor-pointer hidden sm:block" 
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link to="/profile" className="text-white/70 hover:text-white transition-colors cursor-pointer hidden sm:block" aria-label="My List">
              <Bookmark className="h-5 w-5" />
            </Link>
            <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 shrink-0 ring-2 ring-white/10 flex items-center justify-center cursor-pointer hover:ring-white/30 transition-all">
              {user ? (
                <span className="text-white font-black text-xs uppercase">{user.username.charAt(0)}</span>
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 h-16">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-[#f5c518] text-black font-black px-2 py-0.5 rounded text-xl uppercase tracking-tighter">LIBRE</div>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col p-8 space-y-8">
              <form onSubmit={handleMobileSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text" 
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  placeholder="Search books..." 
                  className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#f5c518]/50 text-lg"
                />
              </form>
              
              {navItems.map(item => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-black uppercase tracking-widest ${location.pathname === item.path ? 'text-[#f5c518]' : 'text-white/70 hover:text-white'}`}
                >
                  {item.name}
                </Link>
              ))}
              
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 text-lg font-black uppercase tracking-widest text-white/70 hover:text-white border-t border-white/10 pt-8 mt-4"
              >
                <Bookmark className="w-5 h-5" /> My Library
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
