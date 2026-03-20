'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Loading...');
  const [userRole, setUserRole] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  
  const supabase = createClient();
  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUserAndBroadcasts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role, institution_id')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setUserName(`${profile.first_name} ${profile.last_name}`);
          setUserRole(profile.role);
          
          // Load broadcasts
          const { data: bData } = await supabase
            .from('broadcasts')
            .select(`
              id, title, message, created_at,
              sender:profiles!broadcasts_sender_id_fkey(first_name, last_name)
            `)
            .eq('institution_id', profile.institution_id)
            .order('created_at', { ascending: false })
            .limit(10);
            
          setBroadcasts(bData || []);
        }
      }
    }
    loadUserAndBroadcasts();
  }, [supabase]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('broadcasts').insert({
        institution_id: user.app_metadata?.institution_id,
        sender_id: user.id,
        title: broadcastForm.title,
        message: broadcastForm.message,
        role_target: 'all'
      });
      
      if (error) throw error;
      toast.success('Broadcast sent successfully');
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '' });
      
      // Refresh broadcasts
      const { data: bData } = await supabase
        .from('broadcasts')
        .select('id, title, message, created_at, sender:profiles!broadcasts_sender_id_fkey(first_name, last_name)')
        .eq('institution_id', user.app_metadata?.institution_id)
        .order('created_at', { ascending: false })
        .limit(10);
      setBroadcasts(bData || []);
    } catch (err: any) {
      toast.error(err.message || 'Error sending broadcast');
    }
    setSending(false);
  }

  // Show red dot if there are recent broadcasts (last 24 hours)
  const hasRecentBroadcasts = broadcasts.some(b => 
    new Date(b.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  );

  return (
    <header className="h-16 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-400 cursor-pointer lg:hidden" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu</span>
        <h2 className="text-lg font-bold text-primary dark:text-slate-100">Tadriss International Institution</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full cursor-pointer">
          <span className="text-xs font-bold text-primary">FR</span>
          <div className="w-px h-3 bg-slate-300"></div>
          <span className="text-xs font-medium text-slate-500">AR</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex items-center justify-center p-2 rounded-full transition-colors ${showNotifications ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>notifications</span>
              {hasRecentBroadcasts && (
                <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  {(userRole === 'institution_admin' || userRole === 'teacher') && (
                    <button 
                      onClick={() => { setShowNotifications(false); setShowBroadcastModal(true); }}
                      className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">campaign</span>
                      Broadcast
                    </button>
                  )}
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {broadcasts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No recent notifications
                    </div>
                  ) : (
                    broadcasts.map((b) => (
                      <div key={b.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0 block">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm truncate pr-2">{b.title}</h4>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{b.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">From: {b.sender?.first_name} {b.sender?.last_name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{userName}</p>
              <p className="text-xs text-slate-500 capitalize">{userRole.replace('_', ' ')}</p>
            </div>
            <div className="size-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-primary/10">
              <img className="w-full h-full object-cover" alt="Profile" src="https://ui-avatars.com/api/?name=User&background=random" />
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 transition-colors" title="Logout">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>logout</span>
            </button>
          </div>
        </div>
      </div>

      <Modal open={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} title="Send Broadcast">
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input required value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} placeholder="e.g. Campus closed tomorrow"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea required value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} placeholder="Type your announcement here..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" rows={4} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowBroadcastModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={sending} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50">
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
