import React from 'react';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export default function CoverImage({ 
  src, 
  alt, 
  fallbackSrc = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop", 
  ...props 
}: CoverImageProps) {
  return (
    <img
      src={src}
      alt={alt || "Book Cover"}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackSrc) {
          target.src = fallbackSrc;
        }
      }}
      loading="lazy"
      {...props}
    />
  );
}
