import { API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, LogOut, User, Settings, Bookmark, Search, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReadingDNA from '../components/ReadingDNA';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';
import BookCard from '../components/BookCard';

export default function Profile() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetMasterKey, setResetMasterKey] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setSettingsError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setSettingsError('New password must be at least 6 characters');
      return;
    }
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsLoading(true);

    try {
      
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
      credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      setSettingsSuccess('Password successfully updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [fetchingBooks, setFetchingBooks] = useState(false);

  useEffect(() => {
    if (user) {
      setFetchingBooks(true);
      
      fetch(`${API_BASE_URL}/api/books/saved`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          setSavedBooks(Array.isArray(data) ? data : []);
          setFetchingBooks(false);
        })
        .catch(err => {
          console.error(err);
          setFetchingBooks(false);
        });
    } else {
      setSavedBooks([]);
    }
  }, [user]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResetMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
      credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }
      
      setResetMsg(data.message || `Password reset link sent to ${email}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password.trim() || (!isLogin && !username.trim())) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || (isLogin ? 'Login failed' : 'Registration failed'));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">
        <Header />
        
        {/* Profile Hero */}
        <section className="relative pt-24 pb-12 px-4 md:px-8 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 flex items-center justify-center shadow-2xl shrink-0 ring-4 ring-white/10">
              <span className="text-6xl font-black text-white uppercase">{user.username.charAt(0)}</span>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">{user.username}</h1>
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">{user.email}</p>
              
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                
                {showSettings ? (
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-3 h-3" /> Settings
                  </button>
                )}

                <button 
                  onClick={handleLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3 h-3" /> Log Out
                </button>
              </div>
            </div>
          </div>
        </section>

        
        {/* Profile Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 w-full py-12 flex flex-col gap-12">
          {showSettings ? (
            <section className="max-w-2xl mx-auto w-full">
              <h2 className="text-lg font-black uppercase tracking-widest mb-8 text-[#f5c518] flex items-center gap-2">
                <Settings className="w-5 h-5" /> Account Settings
              </h2>

              <div className="bg-[#111] border border-white/10 rounded-sm p-8 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 border-b border-white/10 pb-2">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Username</label>
                    <div className="bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white/70">
                      {user.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white/70">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-sm p-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 border-b border-white/10 pb-2">Security</h3>
                
                {settingsError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-sm text-center">
                    {settingsError}
                  </div>
                )}
                {settingsSuccess && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest rounded-sm text-center">
                    {settingsSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#f5c518]/50 text-white transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#f5c518]/50 text-white transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="w-full sm:w-auto bg-[#f5c518] text-black font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {settingsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Password
                  </button>
                </form>
              </div>
            </section>
          ) : (
            <>
              {/* Reading DNA Hero */}
              <section>
                <ReadingDNA />
              </section>

              <section>
                <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[#f5c518]" /> My Library
                  </h2>
                  <span className="text-[10px] font-bold text-[#f5c518] uppercase tracking-widest">
                    {savedBooks.length} {savedBooks.length === 1 ? 'Book' : 'Books'}
                  </span>
                </div>
                
                {fetchingBooks ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#f5c518]" />
                  </div>
                ) : savedBooks.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {savedBooks.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center bg-[#111] border border-white/10 rounded-sm">
                    <Search className="w-8 h-8 text-white/20 mb-4" />
                    <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-6">Your library is empty</p>
                    <button 
                      onClick={() => navigate('/ai-discovery')}
                      className="bg-[#f5c518] text-black px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Discover Books
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
</main>
        
        <Footer />
      </div>
    );
  }

  // Auth Screen
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#111] p-8 md:p-12 border border-white/10 rounded-sm shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#f5c518] to-orange-500"></div>
            
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg('');
                setResetMsg('');
              }}
              className="mb-6 text-[10px] font-bold text-white/50 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" /> Back to login
            </button>

            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
              Reset Password
            </h1>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-8">
              Reset your password using the Master Key
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-sm text-center">
                {errorMsg}
              </div>
            )}
            
            {resetMsg && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest rounded-sm text-center">
                {resetMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#f5c518]/50 text-white transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f5c518] text-black font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Reset Password
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111] p-8 md:p-12 border border-white/10 rounded-sm shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#f5c518] to-orange-500"></div>
          
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-8">
            {isLogin ? 'Access your library and recommendations' : 'Join the AI-powered book discovery platform'}
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-sm text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#f5c518]/50 text-white transition-colors"
                  placeholder="Enter username"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#f5c518]/50 text-white transition-colors"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-bold text-[#f5c518] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#f5c518]/50 text-white transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f5c518] text-black font-black text-[10px] uppercase tracking-widest py-4 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-8">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg('');
                }} 
                className="ml-2 text-[#f5c518] hover:text-white transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
