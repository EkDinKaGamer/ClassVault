'use client';

import Link from 'next/link';
import { LayoutDashboard, BookOpen, Crown, Bell, User, Settings, LogOut, ShieldAlert, Sparkles, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useRole, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { ClassVaultLogo } from './ClassVaultLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

export function ClassVaultHeader() {
  const { role, setRole } = useRole();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = role === 'admin';
  const isPremium = role === 'premium-student';

  const announcementsQuery = useMemo(() => 
    db ? query(collection(db, 'announcements'), orderBy('createdAt', 'desc')) : null
  , [db]);

  const { data: announcements } = useCollection(announcementsQuery);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cv_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (announcements) {
      const lastRead = localStorage.getItem('cv_last_read_announcement') || '0';
      const count = announcements.filter(ann => (ann.createdAt?.seconds || 0) > parseInt(lastRead)).length;
      setUnreadCount(count);
    }
  }, [announcements]);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('cv_theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const navItems = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Updates', href: '/announcements', icon: Bell, badge: unreadCount > 0 },
    { label: 'Elite', href: '/premium', icon: Crown, color: 'text-amber-600' },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <ClassVaultLogo className="scale-90 sm:scale-100" />
        </Link>

        {/* Desktop/Tablet Navigation Tab Bar */}
        <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[1.25rem] border shadow-sm">
          {navItems.map((item) => {
            const ActiveIcon = item.icon;
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative group",
                  active 
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-700/50"
                )}
              >
                <ActiveIcon className={cn("h-4 w-4", item.color && !active ? item.color : "")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white dark:border-slate-800 text-[8px] items-center justify-center text-white font-bold">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-10 w-10 shrink-0">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {role ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-primary/10 p-0">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className={cn("font-bold text-xs sm:text-sm", isAdmin ? "bg-blue-100 text-blue-600" : isPremium ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary")}>
                      {isAdmin ? 'A' : isPremium ? 'P' : 'S'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 rounded-2xl mt-2" align="end">
                <DropdownMenuLabel className="p-3">
                  <p className="text-sm font-bold">{isAdmin ? 'Administrator' : isPremium ? 'Elite Student' : 'Student Member'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')} className="rounded-xl h-11 cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl h-11 cursor-pointer text-blue-600 font-bold">
                    <ShieldAlert className="mr-2 h-4 w-4" /> Admin Controls
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {setRole(null); router.push('/');}} className="text-destructive rounded-xl h-11 font-bold cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button className="rounded-full px-4 sm:px-8 h-10 sm:h-11 font-bold text-xs sm:text-sm" onClick={() => router.push('/')}>
              Get Started
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (Optional alternative) or Mobile Top Tab Bar */}
      <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const ActiveIcon = item.icon;
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all relative",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <ActiveIcon className={cn("h-5 w-5", item.color && !active ? item.color : "")} />
                <span className="text-[10px] font-bold">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-0 right-2 h-3 w-3 rounded-full bg-rose-500 border border-white dark:border-slate-800"></span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
