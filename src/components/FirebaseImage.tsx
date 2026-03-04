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
 * Componente definitivo para carga de imágenes de Firebase.
 * Resuelve la ruta y obtiene un token fresco siempre (Option A).
 */
export function FirebaseImage({ path, url, alt = "Imagen", className }: FirebaseImageProps) {
  const storage = useStorage();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!storage) return;

    const resolveImage = async () => {
      setLoading(true);
      setError(false);
      try {
        let finalPath = path;

        // Si recibimos una URL completa de Firebase, extraemos la ruta interna
        if (!finalPath && url && url.includes('firebasestorage.googleapis.com')) {
          const decodedUrl = decodeURIComponent(url);
          const pathStart = decodedUrl.indexOf('/o/') + 3;
          const pathEnd = decodedUrl.indexOf('?', pathStart);
          finalPath = pathEnd === -1 
            ? decodedUrl.substring(pathStart) 
            : decodedUrl.substring(pathStart, pathEnd);
        }

        if (finalPath) {
          const fileRef = ref(storage, finalPath);
          const downloadUrl = await getDownloadURL(fileRef);
          setResolvedUrl(downloadUrl);
        } else if (url) {
          setResolvedUrl(url);
        } else {
          setError(true);
        }
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