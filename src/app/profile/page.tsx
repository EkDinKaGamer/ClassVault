
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Settings, Crown, LogOut, FileText, ShieldCheck, User, Sparkles, Moon, Sun, Trash2, Heart, Loader2 } from 'lucide-react';
import { useRole, useFirestore, useCollection } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NoteCard } from '@/components/NoteCard';
import { collection, query, where, documentId } from 'firebase/firestore';

/**
 * Loading state for the profile shell
 */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Authenticating Vault...</p>
    </div>
  );
}

/**
 * The inner content of the profile page that uses useSearchParams
 */
function ProfileContent() {
  const { role, setRole, isLoadingRole } = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  
  // Safe access to search params after hydration
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const defaultTab = tabParam || 'status';

  const [isDark, setIsDark] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  // Memoized Firestore Queries
  const favoritesQuery = useMemo(() => 
    db && favorites.length > 0 ? query(collection(db, 'notes'), where(documentId(), 'in', favorites.slice(0, 10))) : null
  , [db, favorites]);

  const historyQuery = useMemo(() => 
    db && history.length > 0 ? query(collection(db, 'notes'), where(documentId(), 'in', history.slice(0, 10))) : null
  , [db, history]);

  const { data: favoriteNotes } = useCollection(favoritesQuery);
  const { data: historyNotes } = useCollection(historyQuery);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
      setFavorites(JSON.parse(localStorage.getItem('cv_favorites') || '[]'));
      setHistory(JSON.parse(localStorage.getItem('cv_history') || '[]'));
    }
  }, []);

  useEffect(() => {
    // Redirection should only happen on the client after mounting
    if (isMounted && !isLoadingRole && !role) {
      router.replace('/');
    }
  }, [role, isLoadingRole, router, isMounted]);

  if (!isMounted || isLoadingRole || !role) {
    return <ProfileSkeleton />;
  }

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('cv_theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const clearHistory = () => {
    localStorage.removeItem('cv_history');
    setHistory([]);
  };

  const isAdmin = role === 'admin';
  const isPremium = role === 'premium-student';

  const handleLogout = () => {
    setRole(null);
    router.push('/');
  };

  const getRoleDisplay = () => {
    if (isAdmin) return 'Administrator';
    if (isPremium) return 'Premium Student';
    return 'Student';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <ClassVaultHeader />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900">
              <CardHeader className="text-center pb-8 pt-12">
                <Avatar className="h-28 w-28 mx-auto mb-6 border-4 border-primary/10 shadow-xl">
                  <AvatarFallback className={`text-3xl font-bold ${isAdmin ? "bg-blue-100 text-blue-600" : isPremium ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                    {isAdmin ? 'A' : isPremium ? 'P' : 'S'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl font-headline font-bold">{getRoleDisplay()}</CardTitle>
                <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-primary mt-1">Platform Member</CardDescription>
                <div className="pt-6 flex justify-center">
                  <Badge className={isAdmin ? "bg-blue-600 px-4 h-8 rounded-xl" : isPremium ? "bg-amber-500 px-4 h-8 rounded-xl" : "bg-primary px-4 h-8 rounded-xl"}>
                    {isAdmin ? 'ELITE ACCESS' : isPremium ? 'ELITE ACCESS' : 'STANDARD ACCESS'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 p-3">
                <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-4 rounded-2xl h-14 text-muted-foreground font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                  {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-primary" />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 rounded-2xl h-14 text-muted-foreground font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Settings className="h-5 w-5" /> Account Settings
                </Button>
                <div className="pt-6 mt-6 border-t px-2 pb-2">
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-4 rounded-2xl h-14 text-destructive hover:bg-destructive/5 hover:text-destructive font-bold">
                    <LogOut className="h-5 w-5" /> Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {!isPremium && !isAdmin && (
              <Card className="bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative rounded-[2.5rem]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <CardHeader className="p-8">
                  <Crown className="h-10 w-10 mb-6 text-amber-400" />
                  <CardTitle className="text-2xl">Go Elite</CardTitle>
                  <CardDescription className="text-white/70 text-base mt-2">Unlock the full library of exam boosters and premium guides.</CardDescription>
                </CardHeader>
                <CardFooter className="p-8 pt-0">
                  <Button variant="secondary" className="w-full h-14 font-bold shadow-xl rounded-2xl text-lg" asChild>
                    <Link href="/premium">Get Elite Access</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3 space-y-12">
            <h1 className="text-4xl font-headline font-bold text-foreground">Personal Dashboard</h1>

            <Tabs defaultValue={defaultTab} className="space-y-10">
              <TabsList className="bg-transparent border-b rounded-none w-full justify-start p-0 h-auto gap-12">
                <TabsTrigger value="status" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-5 text-lg font-bold transition-all">
                  Membership
                </TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-5 text-lg font-bold transition-all">
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="downloads" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-5 text-lg font-bold transition-all">
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm rounded-[3rem] overflow-hidden">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b p-10">
                    <div className="flex items-center gap-8">
                      <div className={`p-6 rounded-[2rem] text-white shadow-lg ${isAdmin ? "bg-blue-600" : isPremium ? "bg-amber-500" : "bg-primary"}`}>
                        {isAdmin ? <ShieldCheck className="h-12 w-12" /> : isPremium ? <Sparkles className="h-12 w-12" /> : <User className="h-12 w-12" />}
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold">{getRoleDisplay()} Access</CardTitle>
                        <CardDescription className="text-lg mt-2 font-medium">
                          {isAdmin ? 'Complete platform management enabled.' : isPremium ? 'Full access to Elite resources unlocked.' : 'You are currently browsing as a standard student.'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] space-y-3 border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-xl flex items-center gap-3">
                          <ShieldCheck className="h-6 w-6 text-emerald-500" /> Platform Security
                        </h4>
                        <p className="text-muted-foreground">Encryption Status: Active & Secure</p>
                      </div>
                      <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] space-y-3 border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-xl flex items-center gap-3">
                          <Crown className="h-6 w-6 text-amber-500" /> Elite Content
                        </h4>
                        <p className="text-muted-foreground">Access Level: {isPremium || isAdmin ? 'Unrestricted' : 'Standard'}</p>
                      </div>
                    </div>
                    {(isAdmin || isPremium) && (
                      <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        {isAdmin && (
                          <Button className="rounded-2xl h-16 px-12 text-lg font-bold shadow-xl shadow-primary/20 flex-1" asChild>
                            <Link href="/admin">Manage Platform</Link>
                          </Button>
                        )}
                        <Button variant="outline" className="rounded-2xl h-16 px-12 text-lg font-bold border-2 flex-1" onClick={handleLogout}>
                          Sign Out
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {favoriteNotes && favoriteNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favoriteNotes.map(note => <NoteCard key={note.id} note={note as any} isAdmin={isAdmin} />)}
                  </div>
                ) : (
                  <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
                    <Heart className="h-20 w-20 mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-bold">No favorites saved.</p>
                    <p className="mt-2 text-muted-foreground">Click the star icon on any note to save it here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="downloads" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Recently Opened Materials</h3>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive font-bold gap-2 hover:bg-destructive/5 rounded-xl">
                      <Trash2 className="h-4 w-4" /> Clear History
                    </Button>
                  )}
                </div>
                {historyNotes && historyNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {historyNotes.map(note => <NoteCard key={note.id} note={note as any} isAdmin={isAdmin} />)}
                  </div>
                ) : (
                  <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
                    <Clock className="h-20 w-20 mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-bold">Your library is empty.</p>
                    <p className="mt-2 text-muted-foreground">Notes you open will appear here automatically.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Main Profile Page shell with Suspense boundary required for useSearchParams
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
