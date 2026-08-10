import React from 'react';

export interface CoverImageProps {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  loading?: "eager" | "lazy";
}

export default function CoverImage({ 
  src, 
  alt, 
  fallbackSrc = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop", 
  className,
  onError,
  loading = "lazy",
  ...props 
}: CoverImageProps) {
  return (
    <img
      src={src || fallbackSrc}
      alt={alt || "Book Cover"}
      className={className}
      onError={(e) => {
        if (onError) onError(e);
        const target = e.target;
        if (target.src !== fallbackSrc) {
          target.src = fallbackSrc;
        }
      }}
      loading={loading}
      {...props}
    />
  );
}
