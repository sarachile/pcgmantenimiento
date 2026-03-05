
'use client';

import { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  url?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Componente robusto para renderizar imágenes de Firebase Storage.
 * Maneja silenciosamente errores de carga y previene errores de hidratación.
 */
export function FirebaseImage({ url, alt = "Imagen", className }: FirebaseImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (url) {
      setLoading(true);
      setError(false);
    } else {
      setLoading(false);
      setError(false);
    }
  }, [url]);

  if (!mounted) {
    return <div className={cn("bg-muted/10 animate-pulse rounded-xl", className)} />;
  }

  // Si no hay URL, el archivo fue borrado o hay error de permisos, mostramos placeholder neutro
  if (!url || error) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted/5 border border-dashed rounded-xl p-4 text-muted-foreground/20", className)}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-slate-50", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-primary/20" />
        </div>
      )}
      
      <img 
        src={url} 
        alt={alt} 
        className={cn(
          "max-w-full max-h-full object-contain transition-opacity duration-300", 
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          setLoading(false);
          setError(true);
          // Prevenir log de error infinito en consola si la imagen de fallback también fallara
          (e.target as HTMLImageElement).onerror = null;
        }}
      />
    </div>
  );
}
