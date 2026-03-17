'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User, Role } from '@/lib/types';

/**
 * Hook de usuario blindado contra re-renders infinitos y con fallback para Superadmin.
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

      // Evitar re-fetch si ya tenemos el perfil cargado para este UID
      if (lastUidRef.current === authUser.uid && profile) {
        if (isMounted) setIsProfileLoading(false);
        return;
      }

      try {
        if (isMounted) setIsProfileLoading(true);
        if (!firestore) return;

        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        let fetchedProfile: User | null = null;

        if (userSnap.exists()) {
          fetchedProfile = { ...(userSnap.data() as any), id: authUser.uid } as User;
        } else {
          // FALLBACK CRÍTICO: Si el correo es el de superadmin, otorgar acceso aunque no exista el doc
          if (authUser.email === 'control@pcgoperacion.com') {
            fetchedProfile = {
              id: authUser.uid,
              email: authUser.email,
              name: 'Super Administrador (Core)',
              role: 'superadmin' as Role,
              companyId: 'pcg-central',
              active: true,
              createdAt: new Date().toISOString()
            } as User;
          } else {
            const adminRef = doc(firestore, 'platform_admins', authUser.uid);
            const adminSnap = await getDoc(adminRef);
            
            if (adminSnap.exists()) {
              fetchedProfile = { 
                ...(adminSnap.data() as any), 
                id: authUser.uid, 
                role: 'superadmin' as Role,
                companyId: 'pcg-central',
                active: true
              } as User;
            }
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
  }, [authUser?.uid, firestore, authUser?.email]);

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
