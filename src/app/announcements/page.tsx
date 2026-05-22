'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bell, Calendar, Pin, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AnnouncementsPage() {
  const db = useFirestore();
  const [now, setNow] = useState<Timestamp | null>(null);

  useEffect(() => {
    setNow(Timestamp.now());
  }, []);
  
  const announcementsQuery = useMemo(() => 
    db && now ? query(
      collection(db, 'announcements'), 
      where('publishDate', '<=', now),
      orderBy('publishDate', 'desc')
    ) : null
  , [db, now]);

  const { data: announcements, loading, error } = useCollection(announcementsQuery);

  useEffect(() => {
    if (announcements && announcements.length > 0) {
      const newestTime = announcements[0].publishDate?.seconds || 0;
      localStorage.setItem('cv_last_read_announcement', newestTime.toString());
    }
  }, [announcements]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <ClassVaultHeader />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center space-y-4 mb-16 animate-in fade-in duration-700">
          <div className="bg-primary/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6"><Bell className="h-8 w-8 text-primary" /></div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold">Platform Updates</h1>
          <p className="text-lg text-muted-foreground">Stay informed about new content releases and system improvements.</p>
        </div>

        {error ? (
          <div className="p-12 text-center bg-rose-50 rounded-[3rem] border-2 border-rose-100 space-y-6">
            <AlertCircle className="h-20 w-20 text-rose-500 mx-auto opacity-20" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-rose-900">Broadcast Interrupted</h3>
              <p className="text-rose-700">We encountered an issue fetching the latest updates. Please check your connection.</p>
            </div>
            <Button className="rounded-2xl h-14 px-8 font-bold bg-rose-600 hover:bg-rose-700" onClick={() => window.location.reload()}>Retry Connection</Button>
          </div>
        ) : (
          <div className="space-y-8 relative">
            <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-slate-200 hidden md:block" />
            
            {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />) : 
             announcements && announcements.length > 0 ? (
               announcements.map((ann, i) => (
                <div key={ann.id} className="flex gap-12 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="hidden md:flex flex-col items-center pt-8">
                    <div className={cn("z-10 rounded-full p-2 border-2 shadow-sm", ann.isPinned ? "border-amber-500 bg-amber-50" : "border-primary bg-white")}>
                      <div className={cn("w-2 h-2 rounded-full", ann.isPinned ? "bg-amber-500" : "bg-primary")} />
                    </div>
                  </div>
                  <Card className={cn("border-none shadow-sm rounded-[2.5rem] flex-1 group transition-all hover:shadow-xl", ann.isPinned && "bg-amber-50/30 border-l-8 border-l-amber-500")}>
                    <CardHeader className="p-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("px-4 py-1 rounded-xl uppercase font-bold text-[10px]", ann.isPinned ? "border-amber-500 text-amber-600" : "border-primary text-primary")}>
                            {ann.isPinned ? 'Important' : 'Update'}
                          </Badge>
                          {ann.isPinned && <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs"><Calendar className="h-4 w-4" /> {ann.publishDate?.toDate ? ann.publishDate.toDate().toLocaleDateString() : 'Recently'}</div>
                      </div>
                      <CardTitle className="text-3xl font-bold group-hover:text-primary transition-colors">{ann.title}</CardTitle>
                      <CardDescription className="text-xl mt-6 leading-relaxed text-foreground/80">{ann.message}</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ))
             ) : (
              <div className="py-24 text-center text-muted-foreground border-2 border-dashed rounded-[3rem] bg-slate-50/50 italic">
                No announcements have been made yet. Check back soon for updates!
              </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
