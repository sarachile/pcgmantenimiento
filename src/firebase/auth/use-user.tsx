'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook para acceder al estado del usuario y su perfil en Firestore.
 * Estabilizado para evitar bucles infinitos de re-renderizado.
 */
export function useUser() {
  const { user: authUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!authUser || !firestore) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      
      try {
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        
        let newProfile: User | null = null;

        if (userSnap.exists()) {
          newProfile = { ...(userSnap.data() as any), id: authUser.uid } as User;
        } else {
          const superAdminRef = doc(firestore, 'superAdmins', authUser.uid);
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

        // Comparación simple para evitar cambios de identidad si los datos son idénticos
        setProfile(prev => {
          if (!newProfile) return null;
          if (prev && JSON.stringify(prev) === JSON.stringify(newProfile)) {
            return prev;
          }
          return newProfile;
        });

      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsProfileLoading(false);
      }
    }

    fetchProfile();
  }, [authUser?.uid, firestore]); // Depender del UID en lugar del objeto authUser completo

  return {
    user: authUser,
    profile,
    isLoading: isAuthLoading || isProfileLoading,
    isAuthenticated: !!authUser,
    isAdmin: profile?.role === 'companyAdmin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin',
    isCompanyAdmin: profile?.role === 'companyAdmin',
    isTechnician: profile?.role === 'tecnico',
    isSupervisor: profile?.role === 'supervisor',
    isReviewer: profile?.role === 'reviewer',
  };
}
