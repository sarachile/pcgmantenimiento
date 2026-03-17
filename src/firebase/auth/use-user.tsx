'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User, Role } from '@/lib/types';

/**
 * Hook de usuario robusto con detección inmediata de Superadmin para evitar bloqueos.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const lastUidRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      // 1. Caso: No hay usuario autenticado
      if (!authUser) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          lastUidRef.current = null;
        }
        return;
      }

      // 2. Optimización: No repetir carga si ya tenemos el perfil para el mismo UID
      if (lastUidRef.current === authUser.uid && profile) {
        if (isMounted) setIsProfileLoading(false);
        return;
      }

      // 3. Caso especial: Superadmin por correo (Recuperación Inmediata)
      if (authUser.email === 'control@pcgoperacion.com') {
        if (isMounted) {
          setProfile({
            id: authUser.uid,
            email: authUser.email,
            name: 'Super Administrador (Core)',
            role: 'superadmin' as Role,
            companyId: 'pcg-central',
            active: true,
            createdAt: new Date().toISOString()
          });
          setIsProfileLoading(false);
          lastUidRef.current = authUser.uid;
        }
        return;
      }

      // 4. Caso general: Cargar desde Firestore
      try {
        if (isMounted) setIsProfileLoading(true);
        if (!firestore) return;

        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          if (isMounted) {
            setProfile({ ...(userSnap.data() as any), id: authUser.uid } as User);
            lastUidRef.current = authUser.uid;
          }
        } else {
          // Si no existe el doc, pero no es superadmin, limpiar
          if (isMounted) setProfile(null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    fetchProfile();
    return () => { isMounted = false; };
  }, [authUser, firestore]);

  const isLoading = isAuthLoading || isProfileLoading;
  const isAuthenticated = !!authUser && !!profile;

  return useMemo(() => ({
    user: authUser,
    profile,
    isLoading,
    isAuthenticated,
    isSuperAdmin: profile?.role === 'superadmin',
    isCompanyAdmin: profile?.role === 'companyAdmin',
    isTechnician: profile?.role === 'tecnico',
    isSupervisor: profile?.role === 'supervisor',
    isReviewer: profile?.role === 'reviewer',
  }), [authUser?.uid, profile, isLoading, isAuthenticated]);
}
