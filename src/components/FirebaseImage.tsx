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
 * Por defecto carga sin CORS para máxima compatibilidad en el Dashboard.
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
        key={url} // Forzar re-render si cambia la URL
        src={url}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500", 
          loading ? "opacity-0" : "opacity-100"
        )}
        // Solo usamos anonymous si es estrictamente necesario (ej: generación de PDF)
        crossOrigin={forceCORS ? "anonymous" : undefined}
        onLoad={() => setLoading(false)}
        onError={() => {
          // No logueamos console.error para evitar el overlay de NextJS
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
