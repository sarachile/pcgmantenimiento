'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook para acceder al estado del usuario y su perfil en Firestore.
 * Estabilizado mediante comparación profunda para evitar bucles de renderizado.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // Ref para rastrear la versión serializada del perfil y evitar actualizaciones innecesarias
  const profileStringRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!authUser || !firestore) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          profileStringRef.current = "";
        }
        return;
      }

      try {
        // Intentar cargar desde la colección de usuarios de empresa
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        let newProfile: User | null = null;

        if (userSnap.exists()) {
          newProfile = { ...(userSnap.data() as any), id: authUser.uid } as User;
        } else {
          // Intentar cargar como administrador global
          const adminRef = doc(firestore, 'platform_admins', authUser.uid);
          const adminSnap = await getDoc(adminRef);
          
          if (adminSnap.exists()) {
            newProfile = { 
              ...(adminSnap.data() as any), 
              id: authUser.uid, 
              role: 'superadmin',
              companyId: 'pcg-central',
              active: true
            } as User;
          }
        }

        if (isMounted) {
          const newProfileString = JSON.stringify(newProfile);
          // Solo actualizamos el estado si los DATOS han cambiado realmente
          if (profileStringRef.current !== newProfileString) {
            profileStringRef.current = newProfileString;
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    fetchProfile();
    return () => { isMounted = false; };
  }, [authUser?.uid, firestore]);

  const isLoading = isAuthLoading || isProfileLoading;
  const isAuthenticated = !!authUser && !!profile;

  return {
    user: authUser,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin: profile?.role === 'companyAdmin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin',
    isCompanyAdmin: profile?.role === 'companyAdmin',
    isTechnician: profile?.role === 'tecnico',
    isSupervisor: profile?.role === 'supervisor',
    isReviewer: profile?.role === 'reviewer',
  };
}
