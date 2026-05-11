'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore,
  Firestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Inicializa Firebase de forma robusta y eficiente.
 * Implementa un patrón de singleton para evitar excesos de tasa (Rate Exceeded).
 */
export function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  
  let firestore: Firestore;
  
  try {
    // Intentamos obtener la instancia existente para no saturar las conexiones
    firestore = getFirestore(app);
  } catch (e: any) {
    // Si falla la obtención simple, inicializamos con caché persistente
    try {
      firestore = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (innerError) {
      firestore = getFirestore(app);
    }
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
