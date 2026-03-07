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

export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Inicializamos Firestore con persistencia local habilitada.
  // Esto permite que las OTs y Checklists funcionen sin internet,
  // sincronizando los cambios automáticamente al recuperar señal.
  let firestore;
  try {
    firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    // Si ya está inicializado (por hot reload en desarrollo), usamos la instancia existente
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
    storage: getStorage(firebaseApp)
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
