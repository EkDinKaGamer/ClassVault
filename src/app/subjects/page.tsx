'use client';

import { useMemo } from 'react';
import { ClassVaultHeader } from '@/components/ClassVaultHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Book, GraduationCap, Calculator, Laptop, Globe, Rocket, Pencil, 
  Lightbulb, Atom, Variable, Code, Sparkles, School, FileText, 
  Trophy, Target, Brain, Orbit, TestTube, ChevronRight, Plus, FlaskConical 
} from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useRole } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Book, GraduationCap, Calculator, Laptop, Globe, Rocket, Pencil, 
  Lightbulb, Atom, Variable, Code, Sparkles, School, FileText, 
  Trophy, Target, Brain, Orbit, TestTube, FlaskConical
};

export default function SubjectsPage() {
  const db = useFirestore();
  const { role } = useRole();
  
  const subjectsQuery = useMemo(() => 
    db ? collection(db, 'subjects') : null
  , [db]);

  const { data: subjects } = useCollection(subjectsQuery);
  const isAdmin = role === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClassVaultHeader />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-headline font-bold">Subject Directory</h1>
              <p className="text-lg text-muted-foreground">Select a category to explore professional study material.</p>
            </div>
            {isAdmin && (
              <Button asChild variant="outline" className="rounded-xl border-primary text-primary">
                <Link href="/admin"><Plus className="h-4 w-4 mr-2" /> Add Category</Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects?.map((subject) => {
              const Icon = ICON_MAP[subject.iconName] || Book;
              return (
                <Link key={subject.id} href={`/subjects/${subject.id}`}>
                  <Card className="h-full border-border/50 hover:shadow-xl transition-all duration-300 group overflow-hidden relative rounded-3xl">
                    <div className={cn("h-32 flex items-center justify-center relative", subject.colorBanner || 'bg-primary/5')}>
                      {subject.bannerType === 'image' && subject.thumbnail ? (
                        <img src={subject.thumbnail} className="absolute inset-0 w-full h-full object-cover" alt="" />
                      ) : subject.bannerType === 'icon' ? (
                        <Icon className="h-12 w-12 text-white drop-shadow-md" />
                      ) : (
                        <div className="absolute inset-0 bg-white/10" />
                      )}
                    </div>
                    <CardHeader className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="rounded-lg">Browse Library</Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                      <CardTitle className="text-2xl font-headline font-bold mb-2 group-hover:text-primary transition-colors">{subject.name}</CardTitle>
                      <CardDescription className="text-base line-clamp-2">{subject.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
