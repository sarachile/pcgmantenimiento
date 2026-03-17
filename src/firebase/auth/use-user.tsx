'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User, Role } from '@/lib/types';

/**
 * Hook de usuario optimizado para evitar bucles de redirección.
 * Prioriza la detección inmediata de Superadmin por correo.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const lastUidRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!authUser) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          lastUidRef.current = null;
        }
        return;
      }

      // Caso especial: Superadmin por correo (Acceso Inmediato)
      if (authUser.email === 'control@pcgoperacion.com') {
        if (isMounted) {
          setProfile({
            id: authUser.uid,
            email: authUser.email!,
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

      // Evitar recargas innecesarias
      if (lastUidRef.current === authUser.uid && profile) {
        if (isMounted) setIsProfileLoading(false);
        return;
      }

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
    isBuildingAdmin: profile?.role === 'buildingAdmin',
  }), [authUser?.uid, profile, isLoading, isAuthenticated]);
}
