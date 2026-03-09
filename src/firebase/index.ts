
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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
 * Inicializa Firebase de forma robusta.
 * Maneja fallos de persistencia (comunes en navegadores de WhatsApp o Modo Incógnito).
 */
export function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  
  let firestore: Firestore;
  try {
    // Intentamos inicializar con persistencia para soporte offline.
    // Solo si no ha sido inicializado antes por otra llamada.
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e: any) {
    // Si ya existe o si el entorno (WhatsApp/Incognito) bloquea IndexedDB, 
    // obtenemos la instancia existente o una nueva sin persistencia.
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
