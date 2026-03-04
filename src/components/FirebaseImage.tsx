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
 * Componente robusto para cargar imágenes de Firebase Storage.
 * Resuelve automáticamente rutas o URLs con tokens expirados.
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
        let finalRef = null;

        if (path) {
          finalRef = ref(storage, path);
        } else if (url && url.includes('firebasestorage.googleapis.com')) {
          // Extraer la ruta del archivo de una URL de Firebase para re-obtener un token válido
          try {
            const decodedUrl = decodeURIComponent(url);
            const pathStart = decodedUrl.indexOf('/o/') + 3;
            const pathEnd = decodedUrl.indexOf('?', pathStart);
            const extractedPath = pathEnd === -1 
              ? decodedUrl.substring(pathStart) 
              : decodedUrl.substring(pathStart, pathEnd);
            
            finalRef = ref(storage, extractedPath);
          } catch (e) {
            // Si falla el parseo, intentar usar la URL original directamente
            setResolvedUrl(url);
            setLoading(false);
            return;
          }
        } else if (url) {
          setResolvedUrl(url);
          setLoading(false);
          return;
        }

        if (finalRef) {
          const downloadUrl = await getDownloadURL(finalRef);
          setResolvedUrl(downloadUrl);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Error resolviendo imagen de Firebase:", e);
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
    />
  );
}
