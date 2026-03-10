
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  url?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Componente optimizado para renderizar imágenes de Firebase Storage.
 * Utiliza next/image con unoptimized={true} para evitar conflictos de dominio y CORS
 * mientras mantiene los beneficios de lazy-loading intrínseco.
 */
export function FirebaseImage({ url, alt = "Imagen de Terreno", className }: FirebaseImageProps) {
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

  // Si no hay URL o hay error persistente, mostramos placeholder neutro
  if (!url || error) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-100 border border-dashed rounded-xl p-4 text-slate-300", className)}>
        <ImageOff className="h-6 w-6 opacity-20" />
        <span className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40">Sin Imagen</span>
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
      
      <Image
        src={url}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-all duration-500", 
          loading ? "opacity-0 scale-105" : "opacity-100 scale-100"
        )}
        unoptimized={true} // Obligatorio para URLs externas dinámicas de Firebase en modo prototipo
        onLoad={() => setLoading(false)}
        onError={(e) => {
          console.error("Fallo carga imagen Firebase:", url);
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
