'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook para acceder al estado del usuario y su perfil en Firestore.
 * Estabilizado para evitar bucles de renderizado infinitos.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // Ref para comparar cambios profundos y evitar actualizaciones de estado innecesarias
  const profileRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!authUser || !firestore) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          profileRef.current = "";
        }
        return;
      }

      if (isMounted) setIsProfileLoading(true);
      
      try {
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        let newProfile: User | null = null;

        if (userSnap.exists()) {
          newProfile = { ...(userSnap.data() as any), id: authUser.uid } as User;
        } else {
          const superAdminRef = doc(firestore, 'platform_admins', authUser.uid);
          const superAdminSnap = await getDoc(superAdminRef);
          
          if (superAdminSnap.exists()) {
            newProfile = { 
              ...(superAdminSnap.data() as any), 
              id: authUser.uid, 
              role: 'superadmin',
              companyId: 'pcg-central',
              active: true
            } as User;
          }
        }

        if (isMounted) {
          const profileString = JSON.stringify(newProfile);
          if (profileRef.current !== profileString) {
            profileRef.current = profileString;
            setProfile(newProfile);
          }
        }

      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    fetchProfile();

    return () => { isMounted = false; };
  }, [authUser?.uid, firestore]);

  const isLoading = isAuthLoading || isProfileLoading;
  const isAuthenticated = !!authUser;

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
