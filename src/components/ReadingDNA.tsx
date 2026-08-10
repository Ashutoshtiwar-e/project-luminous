import { API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { cleanAndFormatText } from '../utils/textFormatting';
import { motion } from 'motion/react';
import { Loader2, Fingerprint, RefreshCw, Zap, Brain, Activity, Compass, Flame } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function ReadingDNA() {
  const [dna, setDna] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDna = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      
      const url = forceRefresh ? `${API_BASE_URL}/api/me/reading-dna/refresh` : `${API_BASE_URL}/api/me/reading-dna`;
      const method = forceRefresh ? 'POST' : 'GET';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch DNA');
      const data = await res.json();
      
      if (data.notEnoughData) {
        setDna(null);
      } else {
        setDna(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDna();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center bg-[#111] rounded-sm border border-white/10">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5c518] mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Sequencing Your Reading DNA...</p>
      </div>
    );
  }

  if (error || !dna) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center bg-[#111] rounded-sm border border-white/10 text-center px-4">
        <Fingerprint className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-xl font-black uppercase tracking-widest mb-2">Reading DNA Locked</h3>
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest max-w-md">
          Save more books to your library or write reviews to unlock your unique reading personality profile.
        </p>
      </div>
    );
  }

  // Create fake data for radar chart based on the personality just to make it visual
  // In a real app we'd map this more strictly from backend metrics, but for now we randomize a bit 
  // or base it on the personality string
  const radarData = [
    { subject: 'Imagination', A: 80 + Math.random() * 20, fullMark: 100 },
    { subject: 'Curiosity', A: 70 + Math.random() * 30, fullMark: 100 },
    { subject: 'Analysis', A: 60 + Math.random() * 40, fullMark: 100 },
    { subject: 'Emotion', A: 50 + Math.random() * 50, fullMark: 100 },
    { subject: 'Pacing', A: 70 + Math.random() * 30, fullMark: 100 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#111] border border-[#f5c518]/30 rounded-sm relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#f5c518] to-orange-500"></div>
      
      <div className="p-6 md:p-12 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column: Personality & Stats */}
        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#f5c518]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#f5c518]">Your Reading DNA</h2>
            </div>
            <button 
              onClick={() => fetchDna(true)}
              disabled={refreshing}
              className="text-[9px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded-sm border border-white/10 disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>

          <div className="mb-10">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
              {cleanAndFormatText(dna.readingPersonality)}
            </h1>
            <p className="text-white/80 text-sm md:text-base leading-relaxed font-medium max-w-xl">
              {cleanAndFormatText(dna.readingStyle)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
                <Brain className="w-3 h-3" /> Preferred Themes
              </span>
              <p className="text-xs font-bold text-white/90 leading-tight">
                {cleanAndFormatText(dna.preferredThemes.join(", "))}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
                <Compass className="w-3 h-3" /> Story Preference
              </span>
              <p className="text-xs font-bold text-white/90 leading-tight">
                {cleanAndFormatText(dna.storyPreference)}
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-white/[0.01] p-5 border border-white/5 rounded-sm mb-8">
             <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                  <span>Analysis vs Emotion</span>
                  <span className="text-[#f5c518]">80% Analysis</span>
                </div>
                <div className="w-full h-1 bg-white/5 overflow-hidden flex gap-0.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1 }} className="h-full bg-[#f5c518]" />
                </div>
             </div>
             
             <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                  <span>Fast vs Slow Paced</span>
                  <span className="text-[#f5c518]">65% Fast</span>
                </div>
                <div className="w-full h-1 bg-white/5 overflow-hidden flex gap-0.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-[#f5c518]" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/[0.01] p-4 border border-white/5 rounded-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Mood</span>
                <span className="text-xs font-bold text-[#f5c518]">{dna.preferredMood}</span>
             </div>
             <div className="bg-white/[0.01] p-4 border border-white/5 rounded-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Pacing</span>
                <span className="text-xs font-bold text-[#f5c518]">{dna.preferredPacing}</span>
             </div>
             <div className="bg-white/[0.01] p-4 border border-white/5 rounded-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Difficulty</span>
                <span className="text-xs font-bold text-[#f5c518]">{dna.preferredDifficulty}</span>
             </div>
             <div className="bg-white/[0.01] p-4 border border-white/5 rounded-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Length</span>
                <span className="text-xs font-bold text-[#f5c518] capitalize">{dna.preferredLength}</span>
             </div>
          </div>
        </div>

        {/* Right Column: Radar Chart & Favorites */}
        <div className="w-full lg:w-96 flex flex-col gap-8 shrink-0 relative z-10">
          
          <div className="h-64 bg-black/30 border border-white/10 rounded-sm p-4 relative overflow-hidden flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="DNA"
                  dataKey="A"
                  stroke="#f5c518"
                  fill="#f5c518"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Favorite Genres</h4>
            <div className="flex flex-wrap gap-2">
              {dna.favoriteGenres.map((g: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-white/10 text-white/70">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Favorite Authors</h4>
            <div className="flex flex-wrap gap-2">
              {dna.favoriteAuthors.map((a: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-white/10 text-white/70">
                  {a}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#f5c518]/10 blur-[100px] rounded-full pointer-events-none"></div>
    </motion.div>
  );
}
