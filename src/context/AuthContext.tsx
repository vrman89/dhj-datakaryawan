import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { dataService } from '../services/dataService';
import { UserProfile } from '../types';

interface LoginResult {
  success: boolean;
  user?: UserProfile;
  errorMessage?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  loginWithCredentials: (username: string, password: string) => Promise<LoginResult>;
  unlockSuperAdmin: (username: string, password: string) => Promise<LoginResult>;
  lockSuperAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// New session key so older cached demo sessions don't auto-bypass the login gate
const LOCAL_AUTH_KEY = 'dhj_auth_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const profile: UserProfile = {
          id: fUser.uid,
          name: fUser.displayName || fUser.email?.split('@')[0] || 'Administrator',
          username: fUser.email?.split('@')[0] || 'admin',
          email: fUser.email || 'admin@dhj.co.id',
          role: fUser.email === 'virman.coc00@gmail.com' ? 'SUPER_ADMIN' : 'ADMIN',
          status: 'Aktif',
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithCredentials = async (
    username: string,
    password: string
  ): Promise<LoginResult> => {
    const { account, error } = await dataService.authenticateAdminAccount(
      username,
      password
    );
    if (!account) {
      return {
        success: false,
        errorMessage: error || 'Username atau kata sandi salah.',
      };
    }

    const userProfile: UserProfile = {
      id: account.id,
      name: account.displayName,
      username: account.username,
      email: `${account.username}@dhj.co.id`,
      role: account.role,
      status: account.status,
      createdAt: account.createdAt,
    };
    setCurrentUser(userProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(userProfile));
    return { success: true, user: userProfile };
  };

  const unlockSuperAdmin = async (
    username: string,
    password: string
  ): Promise<LoginResult> => {
    const { account, error } = await dataService.authenticateAdminAccount(
      username,
      password,
      'SUPER_ADMIN'
    );
    if (!account) {
      return {
        success: false,
        errorMessage: error || 'Username atau password Super Admin salah.',
      };
    }

    const elevatedProfile: UserProfile = {
      id: account.id,
      name: account.displayName,
      username: account.username,
      email: `${account.username}@dhj.co.id`,
      role: 'SUPER_ADMIN',
      status: account.status,
      createdAt: account.createdAt,
    };
    setCurrentUser(elevatedProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(elevatedProfile));
    return { success: true, user: elevatedProfile };
  };

  const lockSuperAdmin = () => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    const downgraded: UserProfile = {
      ...currentUser,
      role: 'ADMIN',
    };
    setCurrentUser(downgraded);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(downgraded));
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_AUTH_KEY);
  };

  const isAdmin =
    currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAdmin,
        isSuperAdmin,
        isLoading,
        loginWithCredentials,
        unlockSuperAdmin,
        lockSuperAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
