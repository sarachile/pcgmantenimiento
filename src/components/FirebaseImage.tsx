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

export function FirebaseImage({ path, url, alt = "Imagen", className }: FirebaseImageProps) {
  const storage = useStorage();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!storage) return;

    const resolve = async () => {
      setLoading(true);
      setError(false);
      try {
        if (path) {
          const fileRef = ref(storage, path);
          const dUrl = await getDownloadURL(fileRef);
          setResolvedUrl(dUrl);
        } else if (url) {
          // Si ya es una URL de firebasestorage con token, la usamos directamente
          setResolvedUrl(url);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Error loading Firebase image:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [storage, path, url]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 animate-pulse", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/10 border border-dashed", className)}>
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img 
      src={resolvedUrl} 
      alt={alt} 
      className={cn("object-contain", className)}
      crossOrigin="anonymous"
    />
  );
}
