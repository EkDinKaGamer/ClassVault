
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { useRole, useFirestore, useCollection, useStorage } from '@/firebase';
import { doc, setDoc, deleteDoc, collection, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Trash2, FileText, Bell, ShieldCheck, ArrowLeft, Loader2, Upload, 
  Book, GraduationCap, Calculator, Laptop, Globe, Rocket, Pencil, Lightbulb, Atom, Variable, Code, 
  Sparkles, School, Trophy, Target, Brain, Orbit, TestTube, FlaskConical,
  Database, Crown, Pin, Settings, Save, TrendingUp, Download, Eye, Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BANNER_COLORS = [
  { name: 'Blue', class: 'bg-blue-600' },
  { name: 'Sky', class: 'bg-sky-500' },
  { name: 'Navy', class: 'bg-slate-900' },
  { name: 'Purple', class: 'bg-purple-600' },
  { name: 'Violet', class: 'bg-violet-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Red', class: 'bg-rose-600' },
  { name: 'Orange', class: 'bg-orange-500' },
  { name: 'Yellow', class: 'bg-yellow-400' },
  { name: 'Gold', class: 'bg-amber-500' },
  { name: 'Green', class: 'bg-emerald-600' },
  { name: 'Lime', class: 'bg-lime-500' },
  { name: 'Teal', class: 'bg-teal-500' },
  { name: 'Cyan', class: 'bg-cyan-500' },
  { name: 'Gray', class: 'bg-slate-500' },
  { name: 'Dark Gray', class: 'bg-slate-700' },
  { name: 'Black', class: 'bg-black' },
  { name: 'Brown', class: 'bg-amber-900' },
  { name: 'Deep Blue Gradient', class: 'bg-gradient-to-br from-blue-700 to-indigo-900' },
  { name: 'Sunset Gradient', class: 'bg-gradient-to-br from-orange-400 to-rose-600' },
  { name: 'Nature Gradient', class: 'bg-gradient-to-br from-emerald-400 to-teal-700' },
  { name: 'Purple Dream', class: 'bg-gradient-to-br from-violet-600 to-purple-900' },
  { name: 'Cyber Gradient', class: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
];

const EDUCATIONAL_ICONS = [
  { name: 'Book', icon: Book },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'FlaskConical', icon: FlaskConical },
  { name: 'Calculator', icon: Calculator },
  { name: 'Laptop', icon: Laptop },
  { name: 'Globe', icon: Globe },
  { name: 'Rocket', icon: Rocket },
  { name: 'Pencil', icon: Pencil },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Atom', icon: Atom },
  { name: 'Variable', icon: Variable },
  { name: 'Code', icon: Code },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'School', icon: School },
  { name: 'FileText', icon: FileText },
  { name: 'Trophy', icon: Trophy },
  { name: 'Target', icon: Target },
  { name: 'Brain', icon: Brain },
  { name: 'Orbit', icon: Orbit },
  { name: 'TestTube', icon: TestTube },
];

export default function AdminDashboard() {
  const { role, setRole, isLoadingRole, appCodes, refreshAppCodes } = useRole();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Memoized Firestore Collections
  const notesQuery = useMemo(() => db ? collection(db, 'notes') : null, [db]);
  const subjectsQuery = useMemo(() => db ? collection(db, 'subjects') : null, [db]);
  const announcementsQuery = useMemo(() => db ? collection(db, 'announcements') : null, [db]);

  const { data: notes, loading: notesLoading } = useCollection(notesQuery);
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery);
  const { data: announcements, loading: announcementsLoading } = useCollection(announcementsQuery);

  // App Config State
  const [homeConfig, setHomeConfig] = useState({
    welcomeText: 'Master Your Subjects with Precision Notes',
    featuredMessage: 'Revolutionizing Academic Excellence',
    visibleSections: ['hero', 'updates', 'pulse', 'subjects', 'latest']
  });
  const [codesForm, setCodesForm] = useState({ adminCode: '234567', premiumCode: '345678' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Form States
  const [isEditingNote, setIsEditingNote] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: '', subjectId: '', chapter: '', description: '', fileUrl: '', fileType: 'pdf', thumbnail: '', isPremium: false, isPinned: false, colorBanner: 'bg-blue-600', iconName: 'FileText', bannerType: 'color' as 'color' | 'icon' | 'image'
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingSubject, setIsEditingSubject] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({ 
    name: '', iconName: 'Book', description: '', colorBanner: 'bg-blue-600', thumbnail: '', bannerType: 'color' as 'color' | 'icon' | 'image' 
  });

  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', isPinned: false, publishDate: '' });

  // Delete Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; coll: string; id: string; title: string }>({
    open: false, coll: '', id: '', title: ''
  });

  useEffect(() => {
    if (db && role === 'admin') {
      getDoc(doc(db, 'settings', 'homeConfig')).then((snap) => {
        if (snap.exists()) setHomeConfig(snap.data() as any);
      });
      getDoc(doc(db, 'settings', 'appCodes')).then((snap) => {
        if (snap.exists()) setCodesForm(snap.data() as any);
      });
    }
  }, [db, role]);

  if (isLoadingRole) return <div className="p-12 text-center flex flex-col items-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-bold text-muted-foreground">Authenticating Access...</p></div>;

  const handleVerify = () => {
    if (!appCodes) return;
    setIsVerifying(true);
    setTimeout(() => {
      if (passcode === appCodes.adminCode) {
        setRole('admin');
        toast({ title: "Admin Session Started", description: "You now have full control of ClassVault." });
      } else {
        toast({ variant: "destructive", title: "Access Denied", description: "The admin code you entered is invalid." });
      }
      setIsVerifying(false);
    }, 600);
  };

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-primary p-12 text-center text-white space-y-3">
            <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Admin Portal</CardTitle>
            <p className="text-white/70 text-sm">Secure access required for library management</p>
          </div>
          <CardContent className="p-12 space-y-6">
            <div className="space-y-4 text-center">
              <Label htmlFor="passcode" className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Enter 6-Digit Admin Code</Label>
              <Input 
                id="passcode" 
                type="password" 
                maxLength={6} 
                className="text-center text-4xl h-20 tracking-[1em] font-mono rounded-3xl border-2 border-slate-200 focus:ring-primary focus:border-primary shadow-sm" 
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <Button className="w-full h-16 rounded-2xl text-xl font-bold shadow-xl transition-all active:scale-95" onClick={handleVerify} disabled={isVerifying || passcode.length < 6}>
              {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify & Continue"}
            </Button>
            <Button variant="ghost" className="w-full gap-2 rounded-xl text-muted-foreground" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" /> Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveConfig = () => {
    if (!db) return;
    setIsSavingConfig(true);
    const homePromise = setDoc(doc(db, 'settings', 'homeConfig'), homeConfig);
    const codesPromise = setDoc(doc(db, 'settings', 'appCodes'), codesForm);

    Promise.all([homePromise, codesPromise])
      .then(() => {
        toast({ title: "Configuration Updated", description: "Public settings and security codes have been saved." });
        refreshAppCodes();
      })
      .finally(() => setIsSavingConfig(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    // Validation
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid File Type", description: "Only PDF and Images (PNG/JPG) are allowed." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const storageRef = ref(storage, `notes/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        setIsUploading(false);
        setUploadProgress(null);
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setNoteForm(prev => ({ ...prev, fileUrl: downloadURL, fileType: file.type.includes('pdf') ? 'pdf' : 'image' }));
          setUploadProgress(null);
          setIsUploading(false);
          toast({ title: "File Uploaded Successfully" });
        });
      }
    );
  };

  const handleSaveNote = () => {
    if (!db) return;
    
    if (!noteForm.title || !noteForm.subjectId || !noteForm.fileUrl) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Title, Subject, and File are required." });
      return;
    }

    const noteId = isEditingNote || doc(collection(db, 'notes')).id;
    const data = {
      ...noteForm,
      viewCount: (notes?.find(n => n.id === noteId) as any)?.viewCount || 0,
      downloadCount: (notes?.find(n => n.id === noteId) as any)?.downloadCount || 0,
      uploadDate: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    setDoc(doc(db, 'notes', noteId), data, { merge: true })
      .then(() => {
        setIsEditingNote(null);
        setNoteForm({ title: '', subjectId: '', chapter: '', description: '', fileUrl: '', fileType: 'pdf', thumbnail: '', isPremium: false, isPinned: false, colorBanner: 'bg-blue-600', iconName: 'FileText', bannerType: 'color' });
        toast({ title: "Resource Saved" });
      });
  };

  const handleSaveSubject = () => {
    if (!db || !subjectForm.name) return;
    
    // Check for duplicate names
    const isDuplicate = subjects?.some(s => s.name.toLowerCase() === subjectForm.name.toLowerCase() && s.id !== isEditingSubject);
    if (isDuplicate) {
      toast({ variant: "destructive", title: "Duplicate Name", description: "A subject with this name already exists." });
      return;
    }

    const subjectId = isEditingSubject || doc(collection(db, 'subjects')).id;
    const data = { ...subjectForm, createdAt: serverTimestamp() };

    setDoc(doc(db, 'subjects', subjectId), data, { merge: true })
      .then(() => {
        setIsEditingSubject(null);
        setSubjectForm({ name: '', iconName: 'Book', description: '', colorBanner: 'bg-blue-600', thumbnail: '', bannerType: 'color' });
        toast({ title: "Subject Saved" });
      });
  };

  const handleSaveAnnouncement = () => {
    if (!db || !announcementForm.title) return;
    const annId = isEditingAnnouncement || doc(collection(db, 'announcements')).id;
    
    const data = { 
      ...announcementForm, 
      publishDate: announcementForm.publishDate ? Timestamp.fromDate(new Date(announcementForm.publishDate)) : serverTimestamp(),
      createdAt: serverTimestamp() 
    };

    setDoc(doc(db, 'announcements', annId), data, { merge: true })
      .then(() => {
        setIsEditingAnnouncement(null);
        setAnnouncementForm({ title: '', message: '', isPinned: false, publishDate: '' });
        toast({ title: "Announcement Published" });
      });
  };

  const handleDeleteConfirmed = () => {
    if (!db || !deleteConfirm.id) return;
    deleteDoc(doc(db, deleteConfirm.coll, deleteConfirm.id))
      .then(() => {
        toast({ title: "Deleted Permanently" });
        setDeleteConfirm({ open: false, coll: '', id: '', title: '' });
      });
  };

  // Stats Logic
  const totalViews = useMemo(() => notes?.reduce((acc, n) => acc + (n.viewCount || 0), 0) || 0, [notes]);
  const totalDownloads = useMemo(() => notes?.reduce((acc, n) => acc + (n.downloadCount || 0), 0) || 0, [notes]);
  const mostPopularNote = useMemo(() => [...(notes || [])].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0], [notes]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <ClassVaultHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary">Admin Control Center</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage platform content, analytics and security.</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border flex items-center gap-4 px-6">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Database className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-muted-foreground uppercase">Sync Status</p><p className="font-bold">Active</p></div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col items-center justify-center space-y-2">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Eye className="h-6 w-6" /></div>
            <p className="text-3xl font-bold">{totalViews}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Total Views</p>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col items-center justify-center space-y-2">
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><Download className="h-6 w-6" /></div>
            <p className="text-3xl font-bold">{totalDownloads}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Total Downloads</p>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col items-center justify-center space-y-2">
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600"><TrendingUp className="h-6 w-6" /></div>
            <p className="text-lg font-bold line-clamp-1 text-center w-full">{mostPopularNote?.title || 'None'}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Most Viewed</p>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col items-center justify-center space-y-2">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Crown className="h-6 w-6" /></div>
            <p className="text-3xl font-bold">{notes?.filter(n => n.isPremium).length || 0}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Elite Resources</p>
          </Card>
        </div>

        <Tabs defaultValue="notes" className="space-y-8">
          <TabsList className="bg-white border p-1.5 rounded-[1.5rem] h-auto shadow-sm w-full lg:w-auto">
            <TabsTrigger value="notes" className="gap-2 rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Notes</TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2 rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Subjects</TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2 rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Updates</TabsTrigger>
            <TabsTrigger value="config" className="gap-2 rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"><Settings className="h-4 w-4" /> App Config</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-10 bg-white border-b">
                <CardTitle className="text-2xl font-bold">{isEditingNote ? 'Edit Material' : 'Publish Resource'}</CardTitle>
                <CardDescription>Configure file source and visual branding. Pinned notes appear first.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-bold">Title</Label>
                    <Input value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} placeholder="Intro to Physics" className="rounded-2xl h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Subject</Label>
                    <Select value={noteForm.subjectId} onValueChange={v => setNoteForm({...noteForm, subjectId: v})}>
                      <SelectTrigger className="rounded-2xl h-14"><SelectValue placeholder="Assign Subject" /></SelectTrigger>
                      <SelectContent className="rounded-2xl">{subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-bold">Visual Identity</Label>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-3 p-4 border rounded-[2rem] bg-slate-50/50">
                    {BANNER_COLORS.map(c => (
                      <button key={c.name} onClick={() => setNoteForm({...noteForm, colorBanner: c.class, bannerType: 'color'})} className={cn("h-10 w-10 rounded-xl border-4 transition-all", c.class, noteForm.colorBanner === c.class ? "border-primary" : "border-white")} />
                    ))}
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 p-4 border rounded-[2rem] bg-slate-50/50">
                    {EDUCATIONAL_ICONS.map(i => {
                      const Icon = i.icon;
                      return (
                        <button key={i.name} onClick={() => setNoteForm({...noteForm, iconName: i.name, bannerType: 'icon'})} className={cn("h-12 w-12 flex items-center justify-center rounded-xl border-4", noteForm.iconName === i.name ? "border-primary bg-primary text-white" : "border-white bg-white text-muted-foreground")}><Icon className="h-6 w-6" /></button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <Label className="font-bold">Source Material</Label>
                    <Button variant="outline" className="w-full rounded-2xl h-16 gap-3 border-dashed" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      {isUploading ? 'Uploading...' : 'Select File'}
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} />
                    {uploadProgress !== null && <Progress value={uploadProgress} className="h-2" />}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Or Paste Direct Link (Google Drive Preview supported)</Label>
                      <Input value={noteForm.fileUrl} onChange={e => setNoteForm({...noteForm, fileUrl: e.target.value})} placeholder="https://drive.google.com/..." className="rounded-2xl h-14" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="font-bold">Details</Label>
                    <Input value={noteForm.chapter} onChange={e => setNoteForm({...noteForm, chapter: e.target.value})} placeholder="Chapter Number" className="rounded-2xl h-14" />
                    <Textarea value={noteForm.description} onChange={e => setNoteForm({...noteForm, description: e.target.value})} placeholder="Summary..." className="rounded-2xl h-24" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2rem] border">
                  <div className="flex items-center space-x-4">
                    <Checkbox id="isPremiumNote" checked={noteForm.isPremium} onCheckedChange={checked => setNoteForm({...noteForm, isPremium: !!checked})} />
                    <Label htmlFor="isPremiumNote" className="font-bold text-amber-600 flex items-center gap-2"><Crown className="h-5 w-5" /> Elite Material</Label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Checkbox id="isPinnedNote" checked={noteForm.isPinned} onCheckedChange={checked => setNoteForm({...noteForm, isPinned: !!checked})} />
                    <Label htmlFor="isPinnedNote" className="font-bold text-blue-600 flex items-center gap-2"><Pin className="h-5 w-5" /> Featured / Pinned</Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSaveNote} className="rounded-2xl h-16 px-12 text-xl font-bold flex-1" disabled={isUploading}>Save Resource</Button>
                  {isEditingNote && <Button variant="ghost" onClick={() => setIsEditingNote(null)} className="h-16 px-8 rounded-2xl font-bold">Cancel</Button>}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {!notesLoading && notes?.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-[3rem]">
                  No resources uploaded yet. Start by publishing your first note.
                </div>
              )}
              {notes?.map(note => (
                <div key={note.id} className="bg-white rounded-[2rem] overflow-hidden border shadow-sm group relative">
                  <div className={cn("aspect-video flex items-center justify-center relative", note.colorBanner)}>
                    {note.bannerType === 'icon' && (() => {
                      const Icon = EDUCATIONAL_ICONS.find(i => i.name === note.iconName)?.icon || FileText;
                      return <Icon className="h-12 w-12 text-white" />;
                    })()}
                    {note.isPinned && <div className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full text-blue-600 shadow-sm"><Pin className="h-3 w-3 fill-current" /></div>}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                      <Button size="sm" className="rounded-xl font-bold" onClick={() => { setIsEditingNote(note.id); setNoteForm(note as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</Button>
                      <Button size="sm" variant="destructive" className="rounded-xl font-bold" onClick={() => setDeleteConfirm({ open: true, coll: 'notes', id: note.id, title: note.title })}>Delete</Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold line-clamp-1">{note.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {note.viewCount || 0}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {note.downloadCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 bg-white border-b">
                  <CardTitle className="text-2xl font-bold">Home Branding</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <Label className="font-bold">Main Welcome Text</Label>
                    <Input value={homeConfig.welcomeText} onChange={e => setHomeConfig({...homeConfig, welcomeText: e.target.value})} className="rounded-2xl h-14" />
                  </div>
                  <div className="space-y-4">
                    <Label className="font-bold">Featured Tagline</Label>
                    <Input value={homeConfig.featuredMessage} onChange={e => setHomeConfig({...homeConfig, featuredMessage: e.target.value})} className="rounded-2xl h-14" />
                  </div>
                  <div className="space-y-4">
                    <Label className="font-bold">Visible Sections</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {['hero', 'updates', 'pulse', 'subjects', 'latest'].map(section => (
                        <div key={section} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border">
                          <Switch 
                            checked={homeConfig.visibleSections.includes(section)} 
                            onCheckedChange={(checked) => {
                              const newSections = checked 
                                ? [...homeConfig.visibleSections, section]
                                : homeConfig.visibleSections.filter(s => s !== section);
                              setHomeConfig({...homeConfig, visibleSections: newSections});
                            }} 
                          />
                          <span className="font-bold capitalize text-sm">{section}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 bg-white border-b">
                  <CardTitle className="text-2xl font-bold">Security Codes</CardTitle>
                  <CardDescription>Control who can access Admin and Elite features.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <Label className="font-bold">Admin Verification Code</Label>
                    <Input value={codesForm.adminCode} onChange={e => setCodesForm({...codesForm, adminCode: e.target.value})} className="rounded-2xl h-14 font-mono text-2xl" maxLength={6} />
                  </div>
                  <div className="space-y-4">
                    <Label className="font-bold">Elite (Premium) Access Code</Label>
                    <Input value={codesForm.premiumCode} onChange={e => setCodesForm({...codesForm, premiumCode: e.target.value})} className="rounded-2xl h-14 font-mono text-2xl" maxLength={6} />
                  </div>
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 space-y-2">
                    <p className="font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Best Practice</p>
                    <p className="text-xs leading-relaxed">Changing these codes will take effect immediately. Existing sessions will not be logged out until they refresh.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Button onClick={handleSaveConfig} className="rounded-2xl h-16 px-12 text-xl font-bold w-full" disabled={isSavingConfig}>
              {isSavingConfig ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
              Save Configuration
            </Button>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-8 animate-in fade-in">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-10 bg-white border-b">
                <CardTitle className="text-2xl font-bold">{isEditingSubject ? 'Edit Subject' : 'New Subject'}</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-bold">Name</Label>
                    <Input value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} className="rounded-2xl h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Description</Label>
                    <Input value={subjectForm.description} onChange={e => setSubjectForm({...subjectForm, description: e.target.value})} className="rounded-2xl h-14" />
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-3 border p-4 rounded-[2rem] bg-slate-50/50">
                  {BANNER_COLORS.map(c => (
                    <button key={c.name} onClick={() => setSubjectForm({...subjectForm, colorBanner: c.class, bannerType: 'color'})} className={cn("h-10 w-10 rounded-xl", c.class, subjectForm.colorBanner === c.class && "ring-4 ring-primary ring-offset-2")} />
                  ))}
                </div>
                <Button onClick={handleSaveSubject} className="rounded-2xl h-16 px-12 text-xl font-bold flex-1">Save Category</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-8 animate-in fade-in">
             <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-10 bg-white border-b">
                <CardTitle className="text-2xl font-bold">Broadcast Center</CardTitle>
                <CardDescription>Schedule or publish platform-wide updates.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <Input value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} placeholder="Title" className="rounded-2xl h-14" />
                <Textarea value={announcementForm.message} onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})} placeholder="Message" className="rounded-2xl h-32" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border">
                    <Switch checked={announcementForm.isPinned} onCheckedChange={v => setAnnouncementForm({...announcementForm, isPinned: v})} />
                    <Label className="font-bold">Pin to Top</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Scheduled Publish Date (Optional)</Label>
                    <Input type="datetime-local" value={announcementForm.publishDate} onChange={e => setAnnouncementForm({...announcementForm, publishDate: e.target.value})} className="rounded-2xl h-14" />
                  </div>
                </div>

                <Button onClick={handleSaveAnnouncement} className="rounded-2xl h-16 px-12 text-xl font-bold w-full">Publish Update</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-slate-50 py-24 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">&copy; {new Date().getFullYear()} ClassVault. All rights reserved.</p>
        </div>
      </footer>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ ...deleteConfirm, open: false })}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
          <AlertDialogHeader className="text-center">
            <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600"><Trash2 className="h-10 w-10" /></div>
            <AlertDialogTitle className="text-3xl font-bold">Confirm Deletion?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteConfirm.title}"</span>? {deleteConfirm.coll === 'subjects' && 'Deleting a subject may leave related notes uncategorized.'} This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-6">
            <AlertDialogCancel className="rounded-2xl h-14 font-bold flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="rounded-2xl h-14 font-bold bg-destructive text-white flex-1">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
