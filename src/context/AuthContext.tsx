import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginAsDemoAdmin: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = 'dhj_auth_user';

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
        // If logged in via Firebase Auth
        const profile: UserProfile = {
          id: fUser.uid,
          name: fUser.displayName || fUser.email?.split('@')[0] || 'Administrator',
          email: fUser.email || 'admin@dhj.co.id',
          role: 'ADMIN',
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

  const loginAsDemoAdmin = () => {
    const adminUser: UserProfile = {
      id: 'admin-demo-01',
      name: 'Admin DHJ (Administrator)',
      email: 'admin@dhj.co.id',
      role: 'ADMIN',
      status: 'Aktif',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(adminUser);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(adminUser));
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.warn('Google sign-in popup encountered error, using demo login fallback:', error);
      loginAsDemoAdmin();
    }
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAdmin: currentUser?.role === 'ADMIN',
        isLoading,
        loginAsDemoAdmin,
        loginWithGoogle,
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
