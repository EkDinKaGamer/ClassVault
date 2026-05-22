
'use client';

import { useState, useMemo } from 'react';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { NoteCard } from '@/components/NoteCard';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, ShieldCheck, Zap, DownloadCloud, FileQuestion, Lock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useRole } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function PremiumPage() {
  const { role, setRole, appCodes } = useRole();
  const db = useFirestore();
  const { toast } = useToast();
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const premiumNotesQuery = useMemo(() => 
    db ? query(collection(db, 'notes'), where('isPremium', '==', true)) : null
  , [db]);

  const { data: notes } = useCollection(premiumNotesQuery);

  const isPremiumOrAdmin = role === 'premium-student' || role === 'admin';

  const handleUnlockPremium = () => {
    if (!appCodes) return;
    setIsVerifying(true);
    setTimeout(() => {
      if (passcode === appCodes.premiumCode) {
        setRole('premium-student');
        toast({
          title: "Premium Unlocked!",
          description: "Welcome to ClassVault Elite. All resources are now available.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Incorrect Password",
          description: "Please enter the correct premium access code.",
        });
      }
      setIsVerifying(false);
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClassVaultHeader />
      
      <main className="flex-1 pb-20">
        <section className="bg-slate-950 text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50 opacity-10" />
          <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 px-6 py-1 text-sm font-bold tracking-widest uppercase">
              ClassVault Elite
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight">
              Elevate Your <br /><span className="text-amber-500">Learning Game</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Unlock professional-grade exam boosters, exclusive revision sheets, and priority practice material designed for toppers.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-5 w-5 text-amber-500" /> Secure Access
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <DownloadCloud className="h-5 w-5 text-amber-500" /> Unlimited Downloads
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="h-5 w-5 text-amber-500" /> Instant Unlock
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 -mt-16 relative z-20 space-y-16">
          {!isPremiumOrAdmin ? (
            <Card className="max-w-2xl mx-auto shadow-2xl border-none rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="bg-amber-500 p-12 text-center text-white space-y-4">
                <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2">
                  <Lock className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-headline font-bold">Premium Access Required</h2>
                <p className="text-white/90">Enter your 6-digit access code to unlock the Elite library.</p>
              </div>
              <CardContent className="p-12 space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="premium-code" className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center block">Enter Elite Passcode</Label>
                  <Input 
                    id="premium-code"
                    type="password"
                    maxLength={6}
                    className="text-center text-4xl h-20 tracking-[1em] font-mono rounded-3xl border-2 border-slate-200 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="••••••"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full h-16 rounded-[1.5rem] text-xl font-bold bg-amber-500 hover:bg-amber-600 shadow-xl transition-all hover:scale-[1.02]"
                  onClick={handleUnlockPremium}
                  disabled={isVerifying || passcode.length < 6}
                >
                  {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : "Unlock Elite Access"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have a code? Contact administration to purchase access.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-2xl border-none">
                  <CardHeader className="text-center p-8">
                    <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-xl">Exam Boosters</CardTitle>
                    <CardDescription>Consolidated high-yield notes for quick revision before exams.</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="shadow-2xl border-none">
                  <CardHeader className="text-center p-8">
                    <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileQuestion className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Important Questions</CardTitle>
                    <CardDescription>Curated lists of questions that are most likely to appear in exams.</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="shadow-2xl border-none">
                  <CardHeader className="text-center p-8">
                    <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Crown className="h-8 w-8 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xl">Sample Papers</CardTitle>
                    <CardDescription>Full-length practice tests with detailed expert solutions.</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
                    <Crown className="h-8 w-8 text-amber-500" /> Elite Resource Library
                  </h2>
                  <Badge variant="outline" className="px-4 py-1 border-amber-500 text-amber-600">Access Granted</Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {notes?.map((note) => (
                    <NoteCard key={note.id} note={note as any} />
                  ))}
                  {notes && notes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground italic">
                      No premium resources found in the database.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Card className="bg-slate-900 text-white p-12 text-center rounded-[3rem] border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-4xl font-headline font-bold">Ready to take the lead?</h2>
              <p className="text-slate-400 text-lg">
                Join 5,000+ top students using ClassVault Premium to achieve academic excellence.
              </p>
              {!isPremiumOrAdmin && (
                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl h-16 px-12 text-xl shadow-lg">
                    Get Premium Access
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
