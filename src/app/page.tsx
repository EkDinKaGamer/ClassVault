'use client';

import { useState, useEffect, useMemo } from 'react';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { SearchNotes } from '@/components/SearchNotes';
import { NoteCard } from '@/components/NoteCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calculator, Globe, Laptop, Languages, Beaker, Bell, ArrowRight, TrendingUp, User, ShieldAlert, Zap, Trophy, Brain, ChevronRight, Pin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRole, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, where, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ClassVaultLogo } from '@/components/ClassVaultLogo';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, any> = {
  Beaker, Calculator, BookOpen, Globe, Languages, Laptop, Brain,
};

export default function Home() {
  const { role, setRole, isLoadingRole } = useRole();
  const db = useFirestore();
  const [showSplash, setShowSplash] = useState(true);

  const isAdmin = role === 'admin';

  // Memoized Firestore Queries
  const configDocRef = useMemo(() => db ? doc(db, 'settings', 'homeConfig') : null, [db]);
  const { data: config, loading: configLoading } = useDoc(configDocRef);
  
  const homeConfig = config || {
    welcomeText: 'Master Your Subjects with Precision Notes',
    featuredMessage: 'Revolutionizing Academic Excellence',
    visibleSections: ['hero', 'updates', 'pulse', 'subjects', 'latest']
  };

  // Safe timestamp for queries
  const [now, setNow] = useState<Timestamp | null>(null);
  
  useEffect(() => {
    setNow(Timestamp.now());
    const timer = setTimeout(() => setShowSplash(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const latestNotesQuery = useMemo(() => 
    db ? query(collection(db, 'notes'), orderBy('isPinned', 'desc'), orderBy('uploadDate', 'desc'), limit(4)) : null
  , [db]);
  const { data: latestNotes, loading: notesLoading } = useCollection(latestNotesQuery);

  const allNotesQuery = useMemo(() => db ? collection(db, 'notes') : null, [db]);
  const { data: notes } = useCollection(allNotesQuery);

  const announcementsQuery = useMemo(() => 
    db && now ? query(
      collection(db, 'announcements'), 
      where('publishDate', '<=', now),
      orderBy('publishDate', 'desc'),
      limit(3)
    ) : null
  , [db, now]);
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection(announcementsQuery);

  const subjectsQuery = useMemo(() => db ? collection(db, 'subjects') : null, [db]);
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery);

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8 text-center px-4 animate-in fade-in zoom-in duration-300">
          <ClassVaultLogo iconOnly className="scale-[2] animate-bounce" />
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">ClassVault</h1>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.4em]">Elite Academic Access</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingRole) return null;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-500">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="text-center pt-16">
              <div className="bg-primary/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 text-primary">
                <User className="h-12 w-12" />
              </div>
              <CardTitle className="text-4xl font-headline font-bold">Student Hub</CardTitle>
              <CardDescription className="text-xl mt-4 px-8">Access the full library of professional study materials.</CardDescription>
            </CardHeader>
            <CardContent className="pb-16 pt-8 px-12 text-center">
              <Button size="lg" className="w-full rounded-[1.5rem] h-16 text-xl font-bold shadow-xl" onClick={() => setRole('student')}>
                Continue as Student
              </Button>
            </CardContent>
          </Card>
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="text-center pt-16">
              <div className="bg-blue-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 text-blue-600">
                <ShieldAlert className="h-12 w-12" />
              </div>
              <CardTitle className="text-4xl font-headline font-bold">Admin Portal</CardTitle>
              <CardDescription className="text-xl mt-4 px-8">Secure system management for educators.</CardDescription>
            </CardHeader>
            <CardContent className="pb-16 pt-8 px-12 text-center">
              <Button variant="outline" size="lg" className="w-full rounded-[1.5rem] h-16 text-xl font-bold border-2" onClick={() => window.location.href = '/admin'}>
                Admin Verification
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-500">
      <ClassVaultHeader />
      
      <main className="flex-1">
        {homeConfig.visibleSections.includes('hero') && (
          <section className="bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-24 border-b">
            <div className="container mx-auto px-4 text-center space-y-12">
              <div className="max-w-4xl mx-auto space-y-6">
                {configLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-8 w-48 rounded-full" />
                    <Skeleton className="h-16 w-full max-w-2xl rounded-2xl" />
                  </div>
                ) : (
                  <>
                    <Badge className="bg-primary/10 text-primary border-none px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">{homeConfig.featuredMessage}</Badge>
                    <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground leading-[1.1]">{homeConfig.welcomeText}</h1>
                  </>
                )}
              </div>
              <SearchNotes />
            </div>
          </section>
        )}

        <div className="container mx-auto px-4 py-20 space-y-32">
          {homeConfig.visibleSections.includes('updates') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-3xl font-headline font-bold flex items-center gap-3"><Bell className="h-7 w-7 text-primary" /> Updates</h2>
                  <Button variant="ghost" asChild className="rounded-xl font-bold text-primary">
                    <Link href="/announcements" className="gap-2">All Updates <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {announcementsLoading ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />) : 
                  announcementsError ? (
                    <div className="p-8 text-center bg-rose-50 rounded-3xl border border-rose-100 space-y-3">
                      <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                      <p className="font-bold text-rose-800">Failed to load updates</p>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                  ) :
                  announcements && announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <Card key={ann.id} className={cn("border-none shadow-sm rounded-[2rem] group border-l-8", ann.isPinned ? "border-l-amber-500 bg-amber-50/20" : "border-l-primary")}>
                        <CardHeader className="p-8">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                              {ann.isPinned && <Pin className="h-5 w-5 text-amber-500 fill-amber-500" />}
                              {ann.title}
                            </CardTitle>
                            <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">{ann.publishDate?.toDate ? ann.publishDate.toDate().toLocaleDateString() : 'Recently'}</span>
                          </div>
                          <CardDescription className="text-lg mt-4 line-clamp-2">{ann.message}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))
                  ) : (
                    <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-[2rem] italic">
                      No updates broadcasted yet.
                    </div>
                  )}
                </div>
              </div>

              {homeConfig.visibleSections.includes('pulse') && (
                <Card className="bg-slate-900 text-white h-full rounded-[2.5rem] relative border-none shadow-2xl">
                  <CardHeader className="p-10"><CardTitle className="text-3xl font-bold">Platform Pulse</CardTitle></CardHeader>
                  <CardContent className="space-y-10 p-10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg opacity-80 font-bold">Materials</span>
                      {notes === null ? <Skeleton className="h-10 w-16 bg-white/10" /> : <span className="text-3xl font-bold">{notes?.length || 0}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg opacity-80 font-bold">Subjects</span>
                      {subjectsLoading ? <Skeleton className="h-10 w-16 bg-white/10" /> : <span className="text-3xl font-bold">{subjects?.length || 0}</span>}
                    </div>
                    <Button variant="secondary" className="w-full h-14 rounded-2xl text-lg font-bold" asChild><Link href="/subjects">Browse Library</Link></Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {homeConfig.visibleSections.includes('subjects') && (
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b pb-8">
                <h2 className="text-4xl font-headline font-bold">Explore by Subject</h2>
                <Button variant="ghost" asChild className="rounded-xl font-bold text-primary text-lg">
                  <Link href="/subjects" className="gap-2">View All Categories <ArrowRight className="h-5 w-5" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {subjectsLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[2.5rem]" />) : 
                subjects?.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-3xl">
                    No subjects defined yet.
                  </div>
                ) : (
                  subjects?.map((subject) => {
                    const Icon = iconMap[subject.iconName] || BookOpen;
                    return (
                      <Link key={subject.id} href={`/subjects/${subject.id}`} className="group">
                        <Card className="h-full flex flex-col items-center justify-center p-8 gap-4 text-center rounded-[2.5rem] bg-white hover:shadow-xl transition-all">
                          <div className={cn("p-6 rounded-[2rem] transition-all group-hover:scale-110", subject.colorBanner || 'bg-primary/5')}><Icon className="h-10 w-10 text-primary group-hover:text-white" /></div>
                          <h3 className="font-headline font-bold text-lg">{subject.name}</h3>
                        </Card>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {homeConfig.visibleSections.includes('latest') && (
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b pb-8">
                <h2 className="text-4xl font-headline font-bold flex items-center gap-4"><TrendingUp className="h-10 w-10 text-primary" /> Latest Releases</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {notesLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-[2rem]" />) : 
                latestNotes?.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-[2.5rem] italic">
                    No materials published yet.
                  </div>
                ) : (
                  latestNotes?.map((note) => <NoteCard key={note.id} note={note as any} isAdmin={isAdmin} />)
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t bg-slate-50 py-24 mt-20">
        <div className="container mx-auto px-4 text-center">
          <ClassVaultLogo className="mx-auto mb-8" />
          <p className="text-muted-foreground text-xs uppercase tracking-widest">&copy; {new Date().getFullYear()} ClassVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
