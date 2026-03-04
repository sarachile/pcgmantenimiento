
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook to access the authenticated user's state and their Firestore profile data.
 * Correctly identifies superadmins and company roles.
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
        // 1. Check if user is a superadmin in the privileged collection
        const superAdminRef = doc(firestore, 'superAdmins', authUser.uid);
        const superAdminSnap = await getDoc(superAdminRef);
        
        if (superAdminSnap.exists()) {
          setProfile({ 
            ...(superAdminSnap.data() as any), 
            id: authUser.uid, 
            role: 'superadmin' 
          } as User);
        } else {
          // 2. Standard multi-tenant lookup in global users collection
          const userRef = doc(firestore, 'users', authUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setProfile({ ...(userSnap.data() as any), id: authUser.uid } as User);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsProfileLoading(false);
      }
    }

    fetchProfile();
  }, [authUser, firestore]);

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
