import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem('contesthon_guest_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        const appUser: AppUser = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
        };
        setUser(appUser);
        localStorage.setItem('contesthon_guest_user', JSON.stringify(appUser));
      } else {
        const stored = localStorage.getItem('contesthon_guest_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUp = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const signInAsGuest = (email = 'student@college.edu', name = 'Demo Student') => {
    const guestUser: AppUser = {
      uid: 'demo-student-uid',
      email,
      displayName: name,
    };
    localStorage.setItem('contesthon_guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
    return guestUser;
  };

  const logout = async () => {
    localStorage.removeItem('contesthon_guest_user');
    setUser(null);
    try {
      await signOut(auth);
    } catch {}
  };

  return { user, loading, signIn, signUp, signInWithGoogle, signInAsGuest, logout };
}
