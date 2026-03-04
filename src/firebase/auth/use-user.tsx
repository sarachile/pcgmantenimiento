
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook to access the authenticated user's state and their Firestore profile data.
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
      
      // First check if user is a superadmin
      const superAdminRef = doc(firestore, 'superAdmins', authUser.uid);
      const superAdminSnap = await getDoc(superAdminRef);
      
      if (superAdminSnap.exists()) {
        setProfile({ ...superAdminSnap.data() as User, id: authUser.uid });
      } else {
        // Search for user within their company (this assumes we know companyId, 
        // usually we'd store companyId in custom claims, but here we scan common paths 
        // or require it to be passed. For MVP, we'll assume the profile is in a 'users' 
        // collection with userId as key, or we need a global lookup).
        // Best practice for multi-tenant: store companyId in a global users/ mapping.
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile({ ...userSnap.data() as User, id: authUser.uid });
        }
      }
      setIsProfileLoading(false);
    }

    fetchProfile();
  }, [authUser, firestore]);

  return {
    user: authUser,
    profile,
    isLoading: isAuthLoading || isProfileLoading,
    isAuthenticated: !!authUser,
    isAdmin: profile?.role === 'companyAdmin' || profile?.role === 'superadmin',
    isTechnician: profile?.role === 'tecnico',
    isSupervisor: profile?.role === 'supervisor',
    isReviewer: profile?.role === 'reviewer',
  };
}
