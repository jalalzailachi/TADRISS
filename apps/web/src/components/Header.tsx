'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  created_at: string;
  sender: { first_name: string; last_name: string } | null;
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? "à l'instant" : 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export function Header() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const [userName, setUserName] = useState('');
  const [initials, setInitials] = useState('U');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, broadcastsRes, readsRes] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name, role, institution_id').eq('id', user.id).single(),
        supabase.from('broadcasts').select('id, title, message, created_at, sender:profiles!broadcasts_sender_id_fkey(first_name, last_name)').order('created_at', { ascending: false }).limit(8),
        supabase.from('broadcast_reads').select('broadcast_id').eq('user_id', user.id),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setUserName(`${p.first_name} ${p.last_name}`);
        setInitials(`${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || 'U');
      }
      if (broadcastsRes.data) setBroadcasts(broadcastsRes.data as unknown as Broadcast[]);
      if (readsRes.data) setReadIds(new Set(readsRes.data.map(r => r.broadcast_id)));
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifs]);

  const unreadCount = broadcasts.filter(b => !readIds.has(b.id)).length;

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const unread = broadcasts.filter(b => !readIds.has(b.id));
    if (unread.length === 0) return;
    const rows = unread.map(b => ({ broadcast_id: b.id, user_id: user.id }));
    await supabase.from('broadcast_reads').upsert(rows, { onConflict: 'broadcast_id,user_id' });
    setReadIds(new Set(broadcasts.map(b => b.id)));
  }, [broadcasts, readIds, supabase]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full px-6 md:px-12 h-20 border-b border-outline-variant/10 glass-nav">
      {/* Left: Search */}
      <div className="flex items-center gap-8">
        <div
          className="hidden sm:flex items-center gap-4 px-5 h-12 rounded-2xl border border-outline-variant/20 bg-surface-container-low shadow-inner group focus-within:ring-4 focus-within:ring-primary/5 transition-all"
          style={{ width: '320px' }}
        >
          <span className="material-symbols-outlined text-[22px] text-outline group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder={t('search') || 'Search...'}
            className="bg-transparent border-none text-[13px] font-bold text-on-surface focus:ring-0 p-0 w-full outline-none placeholder:text-outline/40 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
          />
        </div>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container-high border border-outline-variant/10">
          <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{tc('online')}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/10 text-outline hover:text-primary hover:bg-surface-container-high transition-all shadow-sm group relative"
          >
            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 bg-error text-on-error text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-error/30">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute end-0 top-14 w-80 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 rounded-2xl shadow-xl shadow-on-surface/5 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                <span className="text-xs font-black text-on-surface uppercase tracking-widest">{tc('notifications')}</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:underline">
                    {tc('markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {broadcasts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <span className="material-symbols-outlined text-3xl text-outline/30 mb-2">notifications_off</span>
                    <p className="text-xs font-bold text-outline">{tc('noNotifications')}</p>
                  </div>
                ) : (
                  broadcasts.map(b => {
                    const isUnread = !readIds.has(b.id);
                    return (
                      <div key={b.id} className={`px-4 py-3 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors ${isUnread ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isUnread ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline'}`}>
                            <span className="material-symbols-outlined text-[18px]">campaign</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-on-surface leading-tight truncate">{b.title}</p>
                            <p className="text-[10px] text-outline mt-0.5 line-clamp-2">{b.message}</p>
                            <p className="text-[9px] text-outline/60 mt-1">{timeAgo(b.created_at, locale)}</p>
                          </div>
                          {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px mx-2 bg-outline-variant/20" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="h-8 w-px mx-2 bg-outline-variant/20" />

        <div className="flex items-center gap-4 ps-2">
          <div className={`hidden md:flex flex-col ${locale === 'ar' ? 'items-start' : 'items-end'}`}>
            <span className="text-[11px] font-black text-on-surface uppercase tracking-tighter leading-none">{userName}</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-1 opacity-70">{tc('online')}</span>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xs font-black shrink-0 border-2 border-surface-container-low shadow-xl shadow-on-surface/10 cursor-pointer overflow-hidden transition-transform hover:scale-110 active:scale-95 bg-on-surface"
            title={userName}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
