
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

export type Role = 'student' | 'premium-student' | 'admin' | null;

interface FirebaseContextValue {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  role: Role;
  setRole: (role: Role) => void;
  isLoadingRole: boolean;
  appCodes: { adminCode: string; premiumCode: string } | null;
  refreshAppCodes: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  db: null,
  storage: null,
  role: null,
  setRole: () => {},
  isLoadingRole: true,
  appCodes: null,
  refreshAppCodes: async () => {},
});

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().db;
export const useStorage = () => useFirebase().storage;
export const useRole = () => {
  const { role, setRole, isLoadingRole, appCodes, refreshAppCodes } = useFirebase();
  return { role, setRole, isLoadingRole, appCodes, refreshAppCodes };
};

export function FirebaseProvider({
  children,
  app,
  db,
  storage,
}: {
  children: ReactNode;
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
}) {
  const [role, setRoleState] = useState<Role>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [appCodes, setAppCodes] = useState<{ adminCode: string; premiumCode: string } | null>(null);

  const fetchAppCodes = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'appCodes'));
      if (snap.exists()) {
        setAppCodes(snap.data() as any);
      } else {
        // Fallback to defaults if not set in Firestore
        setAppCodes({ adminCode: '234567', premiumCode: '345678' });
      }
    } catch (e) {
      console.error("Failed to fetch app codes", e);
      setAppCodes({ adminCode: '234567', premiumCode: '345678' });
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('cv_role') as Role;
    if (savedRole) {
      setRoleState(savedRole);
    }
    setIsLoadingRole(false);
    fetchAppCodes();
  }, [db]);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('cv_role', newRole);
    } else {
      localStorage.removeItem('cv_role');
    }
  };

  const contextValue = useMemo(() => ({
    app,
    db,
    storage,
    role,
    setRole,
    isLoadingRole,
    appCodes,
    refreshAppCodes: fetchAppCodes
  }), [app, db, storage, role, isLoadingRole, appCodes]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}
