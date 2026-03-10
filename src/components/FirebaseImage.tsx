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
 * Componente optimizado para reportes PDF y visualización web.
 * Usa etiqueta img estándar para asegurar compatibilidad total con html2canvas y CORS.
 */
export function FirebaseImage({ url, alt = "Imagen de Terreno", className }: FirebaseImageProps) {
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
    return <div className={cn("bg-muted/10 animate-pulse rounded-xl", className)} />;
  }

  if (!url || error) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-100 border border-dashed rounded-xl p-4 text-slate-300", className)}>
        <ImageOff className="h-6 w-6 opacity-20" />
        <span className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40 text-center">Evidencia no disponible</span>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-slate-50 rounded-xl", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary/20" />
        </div>
      )}
      
      <img
        src={url}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500", 
          loading ? "opacity-0" : "opacity-100"
        )}
        crossOrigin="anonymous"
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error("Error cargando imagen:", url);
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
