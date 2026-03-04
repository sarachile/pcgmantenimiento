'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook de usuario optimizado para evitar bucles de renderizado.
 * Utiliza comparación de strings para detectar cambios reales en el perfil.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // Ref para prevenir re-renders infinitos comparando el contenido de los datos
  const profileDataKeyRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!authUser || !firestore) {
        if (isMounted) {
          setProfile(null);
          setIsProfileLoading(false);
          profileDataKeyRef.current = "";
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
          // Intento fallback para superadmins
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
          // Creamos una llave única basada en los datos críticos
          const profileKey = fetchedProfile ? `${fetchedProfile.id}-${fetchedProfile.role}-${fetchedProfile.companyId}` : "none";
          
          if (profileDataKeyRef.current !== profileKey) {
            profileDataKeyRef.current = profileKey;
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
    isAdmin: profile?.role === 'companyAdmin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin',
    isCompanyAdmin: profile?.role === 'companyAdmin',
    isTechnician: profile?.role === 'tecnico',
    isSupervisor: profile?.role === 'supervisor',
    isReviewer: profile?.role === 'reviewer',
  };
}