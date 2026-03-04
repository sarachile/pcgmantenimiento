'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook de usuario altamente estable para evitar bucles de renderizado.
 * Utiliza una llave de datos serializada para prevenir actualizaciones de estado innecesarias.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // Ref para rastrear la identidad de los datos y evitar re-renders infinitos
  const profileKeyRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!authUser || !firestore) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          profileKeyRef.current = "";
        }
        return;
      }

      try {
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        let fetchedProfile: User | null = null;

        if (userSnap.exists()) {
          fetchedProfile = { ...(userSnap.data() as any), id: authUser.uid } as User;
        } else {
          // Fallback para administradores de plataforma
          const adminRef = doc(firestore, 'platform_admins', authUser.uid);
          const adminSnap = await getDoc(adminRef);
          
          if (adminSnap.exists()) {
            fetchedProfile = { 
              ...(adminSnap.data() as any), 
              id: authUser.uid, 
              role: 'superadmin',
              companyId: 'pcg-central',
              active: true
            } as User;
          }
        }

        if (isMounted) {
          // Generamos una llave de identidad basada en datos críticos
          const currentDataKey = fetchedProfile 
            ? `${fetchedProfile.id}-${fetchedProfile.role}-${fetchedProfile.companyId}-${fetchedProfile.active}`
            : "none";
          
          // Solo actualizamos el estado si los datos reales han cambiado
          if (profileKeyRef.current !== currentDataKey) {
            profileKeyRef.current = currentDataKey;
            setProfile(fetchedProfile);
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
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
    isSuperAdmin: profile?.role === 'superadmin',
    isCompanyAdmin: profile?.role === 'companyAdmin',
    isTechnician: profile?.role === 'tecnico',
    isSupervisor: profile?.role === 'supervisor',
    isReviewer: profile?.role === 'reviewer',
  };
}
