'use client';

import { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  url?: string;
  alt?: string;
  className?: string;
}

/**
 * Componente para renderizar imágenes de Firebase Storage con soporte para CORS.
 * Añade crossOrigin="anonymous" por defecto para compatibilidad con html2canvas.
 */
export function FirebaseImage({ url, alt = "Imagen", className }: FirebaseImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Resetear estados si cambia la URL
    setLoading(true);
    setError(false);
  }, [url]);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/10 border border-dashed rounded-2xl min-h-[100px]", className)}>
        <ImageOff className="h-5 w-5 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 animate-pulse z-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
        </div>
      )}
      
      <img 
        src={url} 
        alt={alt} 
        className={cn(
          "max-h-full object-contain transition-opacity duration-500", 
          loading ? "opacity-0" : "opacity-100",
          error && "hidden"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        crossOrigin="anonymous"
      />

      {error && (
        <div className="flex flex-col items-center justify-center p-4 text-rose-400 bg-rose-50 w-full h-full rounded-2xl">
          <ImageOff className="h-6 w-6 mb-2" />
          <span className="text-[10px] font-black uppercase tracking-widest">Error de carga</span>
        </div>
      )}
    </div>
  );
}
