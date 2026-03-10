'use client';

import { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  url?: string | null;
  alt?: string;
  className?: string;
  forceCORS?: boolean;
}

/**
 * Componente optimizado para reportes PDF y visualización web.
 * Soporta fondos transparentes (logotipos) y fotos de terreno.
 */
export function FirebaseImage({ url, alt = "Imagen de Terreno", className, forceCORS = false }: FirebaseImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resetear estado si la URL cambia
  useEffect(() => {
    if (url) {
      setLoading(true);
      setError(false);
    }
  }, [url]);

  if (!mounted) {
    return <div className={cn("bg-muted/5 animate-pulse rounded-xl", className)} />;
  }

  if (!url || error) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-50 border border-dashed rounded-xl p-4 text-slate-300", className)}>
        <ImageOff className="h-6 w-6 opacity-20" />
        <span className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40 text-center">No disponible</span>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-transparent rounded-xl", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary/20" />
        </div>
      )}
      
      <img
        key={url}
        src={url}
        alt={alt}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-500", 
          loading ? "opacity-0" : "opacity-100"
        )}
        crossOrigin={forceCORS ? "anonymous" : undefined}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
