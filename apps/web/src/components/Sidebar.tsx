'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ALL_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard', roles: ['institution_admin', 'teacher', 'student'] },
  { href: '/teachers', label: 'Teachers', icon: 'person_pin', roles: ['institution_admin'] },
  { href: '/students', label: 'Students', icon: 'school', roles: ['institution_admin'] },
  { href: '/classes', label: 'Classes', icon: 'class', roles: ['institution_admin', 'teacher', 'student'] },
  { href: '/attendance', label: 'Attendance', icon: 'event_available', roles: ['institution_admin', 'teacher', 'student'] },
  { href: '/homework', label: 'Homework', icon: 'menu_book', roles: ['institution_admin', 'teacher', 'student'] },
  { href: '/payments', label: 'Payments', icon: 'account_balance_wallet', roles: ['institution_admin', 'student'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setRole(profile.role);
      }
    }
    getRole();
  }, [supabase]);

  const navLinks = ALL_LINKS.filter(link => !role || link.roles.includes(role));

  return (
    <aside className="w-64 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>school</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-slate-100 leading-tight">Tadriss</h1>
          <p className="text-xs text-slate-500 font-medium">Management System</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                isActive 
                  ? 'bg-primary/10 text-primary border-r-4 border-primary' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'text-primary' : ''}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{link.icon}</span>
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{link.label}</span>
            </Link>
          );
        })}
        
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
              pathname?.startsWith('/settings')
                ? 'bg-primary/10 text-primary border-r-4 border-primary' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-xs font-bold text-primary mb-1">Academic Year 2023/24</p>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
