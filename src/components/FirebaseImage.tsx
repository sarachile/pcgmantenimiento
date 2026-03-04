'use client';

import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  url?: string;
  alt?: string;
  className?: string;
}

/**
 * Componente robusto para cargar imágenes de Firebase Storage.
 * Prioriza la URL directa si existe, de lo contrario muestra un placeholder de error.
 */
export function FirebaseImage({ url, alt = "Imagen", className }: FirebaseImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError(true);
      return;
    }
    setError(false);
    setLoading(true);
  }, [url]);

  if (error || !url) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/10 border border-dashed rounded-lg min-h-[100px]", className)}>
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/5 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
        </div>
      )}
      <img 
        src={url} 
        alt={alt} 
        className={cn("max-h-full object-contain transition-opacity duration-300", loading ? "opacity-0" : "opacity-100")}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        crossOrigin="anonymous"
      />
    </div>
  );
}
