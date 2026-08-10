import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book } from '../types';
import { Key } from 'react';
import { cleanAndFormatText } from '../utils/textFormatting';
import CoverImage from './CoverImage';

interface BookCardProps {
  book: Book;
  featured?: boolean;
  key?: Key;
}

export default function BookCard({ book, featured = false }: BookCardProps) {
  return (
    <Link to={`/book/${book.id}`} className="block group">
      <motion.div 
        whileHover={{ y: -4 }}
        className="relative aspect-[2/3] overflow-hidden rounded-sm bg-[#1a1a1a] border border-white/10 mb-3"
      >
        <CoverImage 
          src={book.coverImage} 
          alt={`Cover of ${cleanAndFormatText(book.title)}`} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
          <div className="flex items-center mb-1 space-x-1 text-[#f5c518]">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-sm font-bold">{book.rating.toFixed(1)}</span>
          </div>
          <h3 className="text-white text-sm font-bold uppercase tracking-tight leading-tight line-clamp-2">{cleanAndFormatText(book.title)}</h3>
        </div>
      </motion.div>
      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest truncate">{cleanAndFormatText(book.author)}</p>
    </Link>
  );
}
