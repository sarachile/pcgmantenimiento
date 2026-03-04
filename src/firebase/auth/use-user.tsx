'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook de usuario blindado contra re-renders infinitos.
 * Utiliza memoización estricta para asegurar estabilidad en las dependencias de otros hooks.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const lastUidRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!authUser || !firestore) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          lastUidRef.current = null;
        }
        return;
      }

      // Evitar fetch si el UID no ha cambiado
      if (lastUidRef.current === authUser.uid) {
        return;
      }

      try {
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        let fetchedProfile: User | null = null;

        if (userSnap.exists()) {
          fetchedProfile = { ...(userSnap.data() as any), id: authUser.uid } as User;
        } else {
          // Fallback para plataforma admins
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
          setProfile(fetchedProfile);
          lastUidRef.current = authUser.uid;
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    fetchProfile();
    return () => { isMounted = false; };
  }, [authUser?.uid, firestore]);

  const isLoading = isAuthLoading || isProfileLoading;
  const isAuthenticated = !!authUser && !!profile;

  // Memoización del valor de retorno para evitar loops en componentes hijos
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
  }), [authUser, profile, isLoading, isAuthenticated]);
}
