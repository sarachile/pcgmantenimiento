
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Inicializa Firebase de forma robusta.
 * Maneja fallos de persistencia (comunes en navegadores de WhatsApp o Modo Incógnito).
 */
export function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  
  let firestore;
  try {
    // Intentamos inicializar con persistencia para soporte offline.
    // Si ya está inicializado o el entorno es restringido, esto lanzará una excepción.
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e: any) {
    // Fallback: Si falla la persistencia, usamos la instancia estándar (memoria).
    // Esto previene el error "a client-side exception has occurred" en móviles.
    firestore = getFirestore(app);
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore,
    storage: getStorage(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './auth/use-user';
