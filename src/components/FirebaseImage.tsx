'use client';

import { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  url?: string;
  alt?: string;
  className?: string;
}

/**
 * Componente robusto para cargar imágenes de Firebase Storage.
 * Maneja estados de carga y error de forma atómica para evitar bucles de renderizado.
 */
export function FirebaseImage({ url, alt = "Imagen", className }: FirebaseImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/10 border border-dashed rounded-lg min-h-[100px]", className)}>
        <ImageOff className="h-4 w-4 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/5 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/20" />
        </div>
      )}
      
      <img 
        src={url} 
        alt={alt} 
        className={cn(
          "max-h-full object-contain transition-opacity duration-300", 
          loading ? "opacity-0" : "opacity-100",
          error && "hidden"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />

      {error && (
        <div className="flex flex-col items-center justify-center p-4 text-rose-400 bg-rose-50 w-full h-full rounded-lg">
          <ImageOff className="h-5 w-5 mb-1" />
          <span className="text-[8px] font-bold uppercase">Error de carga</span>
        </div>
      )}
    </div>
  );
}
