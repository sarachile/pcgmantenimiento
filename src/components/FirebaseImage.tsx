
'use client';

import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  path?: string;
  url?: string;
  alt?: string;
  className?: string;
}

/**
 * Componente para carga de imágenes de Firebase.
 * Usa la URL directa si está disponible, o resuelve el path si es necesario.
 */
export function FirebaseImage({ path, url, alt = "Imagen", className }: FirebaseImageProps) {
  const storage = useStorage();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Si ya tenemos una URL completa que funciona, la usamos directamente
    if (url && url.startsWith('http')) {
      setResolvedUrl(url);
      setLoading(false);
      return;
    }

    if (!storage || !path) {
      if (!url) setError(true);
      setLoading(false);
      return;
    }

    const resolveImage = async () => {
      setLoading(true);
      setError(false);
      try {
        const fileRef = ref(storage, path);
        const downloadUrl = await getDownloadURL(fileRef);
        setResolvedUrl(downloadUrl);
      } catch (e) {
        console.error("Error resolviendo imagen:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    resolveImage();
  }, [storage, path, url]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 animate-pulse rounded-lg", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/10 border border-dashed rounded-lg", className)}>
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img 
      src={resolvedUrl} 
      alt={alt} 
      className={cn("object-contain", className)}
      loading="lazy"
      crossOrigin="anonymous"
    />
  );
}
