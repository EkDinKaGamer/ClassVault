'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { RefreshCw, Settings2, ShieldAlert } from 'lucide-react';

/**
 * FirebaseClientProvider
 * 
 * Handles Firebase initialization with robust error checking for both
 * production builds and runtime execution.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<{
    app: FirebaseApp;
    db: Firestore;
    storage: FirebaseStorage;
  } | null>(null);
  const [error, setError] = useState<{ title: string; message: string; type: 'config' | 'connection' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Safety check for required Firebase config keys
    const requiredKeys = ['apiKey', 'projectId', 'appId'];
    const missingKeys = requiredKeys.filter(key => 
      !firebaseConfig[key as keyof typeof firebaseConfig] || 
      firebaseConfig[key as keyof typeof firebaseConfig] === "undefined" ||
      firebaseConfig[key as keyof typeof firebaseConfig] === ""
    );

    // During 'next build', env vars might be empty. We don't want to crash the pre-render.
    if (missingKeys.length > 0) {
      console.warn("Firebase configuration is incomplete. This is expected during static build analysis.");
      // We don't set a hard error here to allow pre-rendering to continue if possible
      // but we ensure services stay null so the provider doesn't try to use invalid config.
      return;
    }

    try {
      let app: FirebaseApp;
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
      
      const db = getFirestore(app);
      const storage = getStorage(app);
      setServices({ app, db, storage });
    } catch (err: any) {
      console.error('Firebase Initialization Error:', err);
      // Only set UI error if we are on the client and not in a build environment
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        setError({
          type: 'connection',
          title: "Vault Connection Error",
          message: "We couldn't reach the secure resource vault. Please check your network connection."
        });
      }
    }
  }, []);

  // During SSR/Static collection, we return a simple loading state or the children 
  if (!isMounted) return <>{children}</>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border text-center space-y-6 animate-in fade-in zoom-in">
          <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-rose-600">
            {error.type === 'config' ? <Settings2 className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold">{error.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{error.message}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" /> Retry Sync
          </button>
        </div>
      </div>
    );
  }

  // If services aren't ready (e.g. during build or initial load), we show the children
  // wrapped in a null provider or a loading state. For static export, we prefer children.
  if (!services) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider app={services.app} db={services.db} storage={services.storage}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
