
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
 * Componente robusto para renderizar imágenes de Firebase Storage.
 * Maneja estados de error de forma defensiva y muestra placeholders.
 */
export function FirebaseImage({ url, alt = "Imagen", className }: FirebaseImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url) {
      setLoading(true);
      setError(false);
    } else {
      setLoading(false);
      setError(false);
    }
  }, [url]);

  // Si no hay URL o hubo un error, mostramos un placeholder elegante en lugar de una imagen rota
  if (!url || error) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted/10 border border-dashed rounded-2xl min-h-[100px] p-4 text-muted-foreground/30", className)}>
        <ImageOff className="h-6 w-6 mb-2" />
        {error && <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Error de carga</span>}
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-slate-50", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 animate-pulse z-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
        </div>
      )}
      
      {/* Usamos img estándar para evitar interferencias de optimización de Next.js que causan logs de consola extra */}
      <img 
        src={url} 
        alt={alt} 
        className={cn(
          "max-w-full max-h-full object-contain transition-opacity duration-500", 
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
