'use client';

import { BookOpen, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClassVaultLogo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative group">
        <div className="bg-primary p-2.5 rounded-[1.25rem] shadow-lg group-hover:scale-110 transition-transform duration-300">
          <BookOpen className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-white shadow-md">
          <ShieldCheck className="h-3 w-3 text-white" />
        </div>
      </div>
      {!iconOnly && (
        <div className="flex flex-col">
          <span className="font-headline font-bold text-2xl tracking-tight text-foreground leading-none">ClassVault</span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5 opacity-80">Elite Learning</span>
        </div>
      )}
    </div>
  );
}
