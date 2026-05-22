'use client';

import { useState } from 'react';
import { Search, Loader2, FileText } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { NoteCard } from './NoteCard';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

export function SearchNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const db = useFirestore();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim() || !db) return;

    setIsSearching(true);
    try {
      // Client-side search compatible with static exports (APK)
      const q = query(collection(db, 'notes'));
      const snapshot = await getDocs(q);
      const allNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = allNotes.filter((note: any) => 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.chapter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setResults(filtered.slice(0, 6));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          type="search"
          placeholder="Search by topic, keyword, or chapter..."
          className="pl-14 h-16 rounded-[1.5rem] border-2 focus-visible:ring-primary shadow-lg text-lg bg-white/50 backdrop-blur-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl h-11 px-6 font-bold"
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </form>

      {results && results.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xl font-headline font-bold text-primary">Matching Materials</h3>
            <span className="text-xs font-bold text-muted-foreground uppercase">{results.length} results found</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {results.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
          <Button variant="ghost" className="w-full h-12 rounded-xl font-bold" onClick={() => setResults(null)}>
            Clear Results
          </Button>
        </div>
      )}

      {results && results.length === 0 && !isSearching && (
        <div className="p-12 text-center bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200 animate-in fade-in">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-600">No matching notes found.</p>
          <p className="text-sm text-muted-foreground mt-1">Try using different keywords or broader terms.</p>
        </div>
      )}
    </div>
  );
}
