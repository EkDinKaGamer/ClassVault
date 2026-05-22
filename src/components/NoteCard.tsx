
'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Lock, FileText, Download, Eye, Edit, Trash2, 
  Book, GraduationCap, 
  Calculator, Laptop, Globe, Rocket, Pencil, Lightbulb, Atom, 
  Variable, Code, Sparkles, School, Trophy, Target, Brain, Orbit, TestTube, FlaskConical, Star, Crown, Pin,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Loader2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRole, useFirestore } from '@/firebase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const ICON_MAP: Record<string, any> = {
  Book, GraduationCap, FlaskConical, Calculator, Laptop, 
  Globe, Rocket, Pencil, Lightbulb, Atom, Variable, Code, Sparkles, 
  School, FileText, Trophy, Target, Brain, Orbit, TestTube
};

interface Note {
  id: string;
  title: string;
  subjectId: string;
  chapter: string;
  description: string;
  fileUrl: string;
  fileType: string;
  thumbnail?: string;
  colorBanner?: string;
  iconName?: string;
  bannerType?: 'color' | 'icon' | 'image';
  isPremium: boolean;
  isPinned?: boolean;
  viewCount?: number;
  downloadCount?: number;
  uploadDate: any; 
  premiumPassword?: string;
}

export function NoteCard({ note, isAdmin = false, onDelete }: { note: Note; isAdmin?: boolean; onDelete?: (id: string) => void; }) {
  const { role } = useRole();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewerError, setViewerError] = useState(false);

  const isUnlocked = role === 'admin' || role === 'premium-student';

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('cv_favorites') || '[]');
    setIsFavorite(favorites.includes(note.id));
  }, [note.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('cv_favorites') || '[]');
    const newFavorites = isFavorite ? favorites.filter((id: string) => id !== note.id) : [...favorites, note.id];
    localStorage.setItem('cv_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    toast({ title: isFavorite ? "Removed from Favorites" : "Added to Favorites" });
  };

  const trackView = async () => {
    if (!db) return;
    const noteRef = doc(db, 'notes', note.id);
    updateDoc(noteRef, {
      viewCount: increment(1),
      lastOpenedAt: serverTimestamp()
    }).catch(e => console.error("Analytics track failed", e));
  };

  const trackDownload = async () => {
    if (!db) return;
    const noteRef = doc(db, 'notes', note.id);
    updateDoc(noteRef, {
      downloadCount: increment(1),
      lastDownloadedAt: serverTimestamp()
    }).catch(e => console.error("Analytics track failed", e));
  };

  const handleOpen = () => {
    if (note.isPremium && !isUnlocked) {
      setShowPremiumPrompt(true);
      return;
    }
    trackView();
    setShowViewer(true);
  };

  const handleDownload = () => {
    if (note.isPremium && !isUnlocked) {
      setShowPremiumPrompt(true);
      return;
    }
    trackDownload();
    
    // Convert Google Drive view link to direct download
    let downloadUrl = note.fileUrl;
    if (downloadUrl.includes('drive.google.com') && downloadUrl.includes('/file/d/')) {
      const match = downloadUrl.match(/\/file\/d\/(.+?)\//);
      if (match && match[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    window.open(downloadUrl, '_blank');
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com') && url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/(.+?)\//);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return url;
  };

  const BannerIcon = note.iconName ? (ICON_MAP[note.iconName] || FileText) : FileText;

  return (
    <>
      <Card className={cn("overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-white dark:bg-slate-900 h-full flex flex-col rounded-[2rem]", note.isPinned && "ring-2 ring-primary ring-offset-2")}>
        <div className={cn("relative aspect-video flex items-center justify-center cursor-pointer", note.colorBanner || 'bg-blue-600')} onClick={handleOpen}>
          {note.bannerType === 'image' && note.thumbnail ? <img src={note.thumbnail} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" /> : 
           note.bannerType === 'icon' ? <BannerIcon className="h-16 w-16 text-white drop-shadow-lg group-hover:scale-110 transition-transform" /> : <div className="absolute inset-0 bg-white/10 opacity-20" />}
          
          <div className="absolute top-4 left-4 flex gap-2">
            {note.isPinned && <div className="bg-white/90 p-2 rounded-xl text-blue-600 shadow-sm"><Pin className="h-3 w-3 fill-current" /></div>}
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-white text-[10px] font-bold flex items-center gap-1"><Eye className="h-3 w-3" /> {note.viewCount || 0}</div>
          </div>

          <button onClick={toggleFavorite} className={cn("absolute top-4 right-4 z-20 p-2 rounded-xl backdrop-blur-md", isFavorite ? "bg-amber-500 text-white shadow-lg" : "bg-black/20 text-white")}><Star className={cn("h-4 w-4", isFavorite && "fill-current")} /></button>
          {note.isPremium && !isUnlocked && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"><Lock className="h-8 w-8 text-white" /></div>}
        </div>
        
        <CardHeader className="p-6">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{note.chapter || 'Section'}</p>
          <h3 className="font-headline font-bold text-xl line-clamp-2 mt-1">{note.title}</h3>
        </CardHeader>
        
        <CardContent className="px-6 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{note.description}</p>
        </CardContent>
        
        <CardFooter className="p-6 mt-6 border-t flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={handleOpen}><Eye className="h-4 w-4" /> View</Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold" onClick={handleDownload}><Download className="h-4 w-4" /> Save</Button>
          </div>
          {isAdmin && (
            <div className="flex gap-2 pt-2 border-t w-full">
              <Button variant="ghost" className="flex-1 h-10 text-destructive font-bold" onClick={() => onDelete?.(note.id)}><Trash2 className="h-4 w-4" /> Delete</Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Modern Enhanced Viewer */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className={cn("p-0 border-none overflow-hidden transition-all duration-300", isFullScreen ? "max-w-none w-screen h-screen rounded-none" : "max-w-5xl h-[85vh] rounded-[2.5rem]")}>
          {showViewer && (
            <div className="flex flex-col h-full bg-slate-900">
              <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-bold text-sm line-clamp-1">{note.title}</h4>
                    <p className="text-[10px] opacity-60 uppercase font-bold">{note.chapter}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.max(50, prev - 10))} className="h-10 w-10 text-white hover:bg-white/10"><ZoomOut className="h-4 w-4" /></Button>
                  <span className="text-xs font-bold w-12 text-center">{zoom}%</span>
                  <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.min(200, prev + 10))} className="h-10 w-10 text-white hover:bg-white/10"><ZoomIn className="h-4 w-4" /></Button>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="h-10 w-10 text-white hover:bg-white/10">
                    {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowViewer(false)} className="h-10 w-10 text-white hover:bg-white/10 ml-2">
                    <span className="sr-only">Close</span>
                    <Trash2 className="h-4 w-4 rotate-45" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 relative overflow-auto bg-slate-800 flex items-start justify-center p-8">
                {viewerError ? (
                  <div className="flex flex-col items-center justify-center text-white space-y-4 pt-20">
                    <AlertCircle className="h-16 w-16 text-rose-500" />
                    <div className="text-center">
                      <h3 className="text-xl font-bold">Failed to load resource</h3>
                      <p className="opacity-60">The file might be private or unavailable.</p>
                    </div>
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => {setViewerError(false); setZoom(100);}}>Retry Loading</Button>
                  </div>
                ) : note.fileType === 'pdf' ? (
                  <iframe 
                    src={getEmbedUrl(note.fileUrl)} 
                    className="w-full h-full bg-white rounded-xl shadow-2xl" 
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    onError={() => setViewerError(true)}
                  />
                ) : (
                  <img 
                    src={note.fileUrl} 
                    className="max-w-full h-auto rounded-xl shadow-2xl transition-all" 
                    style={{ width: `${zoom}%` }}
                    onError={() => setViewerError(true)}
                  />
                )}
              </div>
              <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-center">
                <Button onClick={handleDownload} className="gap-2 rounded-xl font-bold h-12 px-8"><Download className="h-4 w-4" /> Download Original File</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumPrompt} onOpenChange={setShowPremiumPrompt}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-sm text-center">
          <DialogHeader>
            <div className="bg-amber-100 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-amber-600"><Crown className="h-10 w-10" /></div>
            <DialogTitle className="text-3xl font-bold">Elite Resource</DialogTitle>
            <DialogDescription className="text-lg">This study material is reserved for Elite members. Unlock all content with a premium passcode.</DialogDescription>
          </DialogHeader>
          <div className="pt-8 space-y-4">
            <Button className="w-full h-14 rounded-2xl font-bold bg-amber-500 text-lg shadow-xl" onClick={() => {setShowPremiumPrompt(false); router.push('/premium');}}>Go to Premium</Button>
            <Button variant="ghost" className="w-full h-14 rounded-2xl font-bold" onClick={() => setShowPremiumPrompt(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
