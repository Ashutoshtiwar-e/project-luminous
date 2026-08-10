import { API_BASE_URL } from '../utils/api';
import React, { useState, useRef, useEffect } from 'react';
import { cleanAndFormatText } from '../utils/textFormatting';
import { Bot, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAssistantProps {
  bookId?: string;
  bookTitle: string;
}

export default function AIAssistant({ bookId, bookTitle }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Hi! I'm here to answer questions specifically about "${bookTitle}". What would you like to know?` }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What is this book about?",
    "Who is this book for?",
    "What do readers like about it?",
    "How difficult is it?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendQuery = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, bookId })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer || "Sorry, I couldn't process that." 
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: err.message || "Error connecting to AI. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendQuery(query);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 bg-[#f5c518] rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform z-40 group"
        aria-label="Ask About This Book"
      >
        <Bot className="h-6 w-6 text-black group-hover:scale-110 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] bg-[#0e0e0e] border border-white/10 rounded-sm shadow-2xl z-50 flex flex-col overflow-hidden font-sans max-h-[80vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0a0a]">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-[#f5c518]" />
                <span className="font-black text-[10px] uppercase tracking-widest text-white">Ask About This Book</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Close Assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 bg-[#0a0a0a]/50">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`max-w-[85%] rounded-sm p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#f5c518] text-black self-end font-medium' 
                      : 'bg-white/5 text-white/90 border border-white/10 self-start'
                  }`}
                >
                  {cleanAndFormatText(msg.text)}
                </div>
              ))}
              
              {messages.length === 1 && !isLoading && (
                <div className="flex flex-col gap-2 mt-2 self-start max-w-[85%]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Suggested</span>
                  {suggestedQuestions.map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendQuery(sq)}
                      className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-3 py-2 rounded-sm transition-colors"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="max-w-[85%] rounded-sm p-3 text-sm bg-white/5 text-white/50 border border-white/10 self-start flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#0a0a0a] flex items-center space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#f5c518]/50 transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="h-9 w-9 shrink-0 rounded-full bg-[#f5c518] flex items-center justify-center disabled:opacity-50 transition-opacity"
                disabled={!query.trim() || isLoading}
                aria-label="Send message"
              >
                <Send className="h-4 w-4 text-black ml-[-2px]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
