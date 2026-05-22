
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { NoteCard } from '@/components/NoteCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Clock, SortAsc, AlertCircle, FileText } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useRole } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SubjectPageClient() {
  const params = useParams();
  const subjectId = params?.subjectId;
  const router = useRouter();
  const db = useFirestore();
  const { role } = useRole();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');

  // Memoized Firestore references
  const subjectRef = useMemo(() => db && subjectId ? doc(db, 'subjects', subjectId as string) : null, [db, subjectId]);
  
  // Basic query for useCollection - sorting happens client-side
  const notesQuery = useMemo(() => db && subjectId ? query(collection(db, 'notes'), where('subjectId', '==', subjectId)) : null, [db, subjectId]);

  const { data: subject, loading: subjectLoading, error: subjectError } = useDoc(subjectRef);
  const { data: notes, loading: notesLoading, error: notesError } = useCollection(notesQuery);

  const isAdmin = role === 'admin';

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    let result = [...notes];
    
    // Search
    if (searchTerm) {
      result = result.filter(n => 
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        n.chapter?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter
    if (activeTab === 'free') result = result.filter(n => !n.isPremium);
    else if (activeTab === 'premium') result = result.filter(n => n.isPremium);
    
    // Sort
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'newest') return (b.uploadDate?.seconds || 0) - (a.uploadDate?.seconds || 0);
      if (sortBy === 'oldest') return (a.uploadDate?.seconds || 0) - (b.uploadDate?.seconds || 0);
      if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });
    
    return result;
  }, [notes, searchTerm, activeTab, sortBy]);

  const handleDeleteNote = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
      toast({ title: "Material Removed" });
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
  };

  if (subjectError || notesError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ClassVaultHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <AlertCircle className="h-20 w-20 text-rose-500 opacity-20" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Library Sync Failed</h2>
            <p className="text-muted-foreground text-lg">We couldn't connect to the resource vault.</p>
          </div>
          <Button className="rounded-2xl h-14 px-12 font-bold" onClick={() => window.location.reload()}>Retry Access</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClassVaultHeader />
      <main className="flex-1">
        <div className={cn("relative border-b py-24 overflow-hidden", subjectLoading ? "bg-slate-50" : subject?.colorBanner || 'bg-primary/5')}>
          {subject?.bannerType === 'image' && subject?.thumbnail && (
            <img src={subject.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" alt="" />
          )}
          <div className="container mx-auto px-4 relative z-10 space-y-6">
            <Badge className="bg-white/90 dark:bg-slate-900/90 text-primary border-none shadow-sm px-6 py-1.5 rounded-xl font-bold uppercase tracking-widest text-[10px]">
              {notes?.length || 0} Materials • {notes?.filter(n => n.isPremium).length || 0} Elite
            </Badge>
            {subjectLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-6 w-96 rounded-xl" />
              </div>
            ) : (
              <>
                <h1 className="text-5xl md:text-7xl font-headline font-bold text-foreground leading-tight tracking-tight">{subject?.name}</h1>
                <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">{subject?.description}</p>
              </>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border">
            <div className="relative w-full lg:max-w-lg">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search topics, chapters or keywords..." 
                className="pl-14 h-16 rounded-2xl border-2 text-lg focus:ring-primary shadow-sm" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border shadow-sm">
                <TabsList className="bg-transparent h-12 gap-1">
                  <TabsTrigger value="all" className="rounded-xl px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-none">All</TabsTrigger>
                  <TabsTrigger value="free" className="rounded-xl px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-none">Free</TabsTrigger>
                  <TabsTrigger value="premium" className="rounded-xl px-6 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white shadow-none">Elite</TabsTrigger>
                </TabsList>
              </Tabs>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl h-14 px-6 gap-2 border-2 font-bold shadow-sm">
                    <SortAsc className="h-5 w-5" /> 
                    {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Alphabetical'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl p-2 w-48">
                  <DropdownMenuItem onClick={() => setSortBy('newest')} className="rounded-xl h-11 font-bold gap-2">
                    <Clock className="h-4 w-4" /> Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')} className="rounded-xl h-11 font-bold gap-2">
                    <Clock className="h-4 w-4" /> Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('az')} className="rounded-xl h-11 font-bold gap-2">
                    <SortAsc className="h-4 w-4" /> A - Z
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAdmin && (
                <Button onClick={() => router.push('/admin')} className="rounded-2xl h-14 px-8 font-bold shadow-lg shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" /> Upload Material
                </Button>
              )}
            </div>
          </div>

          {notesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in duration-700">
              {filteredNotes.map(note => <NoteCard key={note.id} note={note as any} isAdmin={isAdmin} onDelete={handleDeleteNote} />)}
            </div>
          ) : (
            <div className="py-32 text-center text-muted-foreground flex flex-col items-center gap-6">
              <div className="bg-slate-100 dark:bg-slate-900 p-8 rounded-full">
                <FileText className="h-16 w-16 opacity-10" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">No materials found.</p>
                <p className="text-lg opacity-60">{searchTerm ? 'Try adjusting your search terms.' : 'This library is currently empty.'}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
