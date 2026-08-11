import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

const AuthContext = createContext({
  dbUser: null,
  role: 'STUDENT',
  dbRole: 'STUDENT',
  status: 'ACTIVE',
  isSyncing: false,
  isLoading: false,
  syncError: null,
  syncUser: async () => {},
  toggleRole: async () => {},
  switchDevRole: async () => {},
  refetchDbUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [dbUser, setDbUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const syncUserWithBackend = useCallback(async (clerkUser) => {
    if (!clerkUser) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      let token = null;
      try {
        token = await getToken();
      } catch (tErr) {
        console.warn('Could not retrieve Clerk JWT token:', tErr);
      }

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const firstName = clerkUser.firstName;
      const lastName = clerkUser.lastName;
      const imageUrl = clerkUser.imageUrl;
      const name = clerkUser.fullName || `${firstName || ''} ${lastName || ''}`.trim() || email?.split('@')[0];

      const headers = {
        'Content-Type': 'application/json',
        'x-clerk-user-id': clerkUser.id,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/users/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clerkId: clerkUser.id,
          email,
          name,
          firstName,
          lastName,
          imageUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to sync user (${response.status})`);
      }

      const data = await response.json();
      if (data.user) {
        setDbUser(data.user);
      }
    } catch (err) {
      console.error('User sync error:', err);
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [getToken, API_BASE_URL]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUserWithBackend(user);
    } else if (isLoaded && !isSignedIn) {
      setDbUser(null);
    }
  }, [isLoaded, isSignedIn, user, syncUserWithBackend]);

  const switchDevRole = async (targetRole) => {
    if (!user) return null;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const email = user.primaryEmailAddress?.emailAddress;

      const response = await fetch(`${API_BASE_URL}/users/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id,
        },
        body: JSON.stringify({
          clerkId: user.id,
          email,
          role: targetRole
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        setDbUser(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Dev role switch error:', err);
      setSyncError(err.message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const currentRole = dbUser?.role || 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        dbUser,
        role: currentRole,
        dbRole: currentRole,
        status: dbUser?.status || 'ACTIVE',
        isSyncing,
        isLoading: isSyncing,
        syncError,
        syncUser: () => syncUserWithBackend(user),
        toggleRole: switchDevRole,
        switchDevRole,
        refetchDbUser: () => user && syncUserWithBackend(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
