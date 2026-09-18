'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LogoutButton } from './LogoutButton'
import { useTranslations } from 'next-intl'

export function Sidebar({ role, userName, institutionName }: {
  role: string
  locale: string
  userName: string
  institutionName?: string
}) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Sync sidebar width CSS variable — 0 on mobile (sidebar hidden), actual width on md+
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const update = () => {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        mql.matches ? (isCollapsed ? '80px' : '260px') : '0px'
      )
    }
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [isCollapsed])

  const prefix = role === 'institution_admin' ? '/dashboard' : `/${role.replace('institution_', '')}`

  const GROUPS = role === 'institution_admin' ? [
    { label: t('groups.system'), items: [{ label: t('dashboard'), href: '/dashboard', icon: 'dashboard' }] },
    { label: t('groups.academic'), items: [
      { label: t('classes'), href: '/dashboard/classes', icon: 'school' },
      { label: t('students_admin'), href: '/dashboard/students', icon: 'group' },
      { label: t('teachers_admin'), href: '/dashboard/teachers', icon: 'badge' },
    ]},
    { label: t('groups.operations'), items: [
      { label: t('attendance'), href: '/dashboard/attendance', icon: 'event_note' },
      { label: t('homework'), href: '/dashboard/homework', icon: 'assignment' },
      { label: t('grades'), href: '/dashboard/grades', icon: 'grading' },
      { label: t('schedule'), href: '/dashboard/schedule', icon: 'schedule' },
    ]},
    { label: t('groups.finance'), items: [{ label: t('payments'), href: '/dashboard/payments', icon: 'payments' }] },
    { label: t('groups.communication'), items: [
      { label: t('messages'), href: '/dashboard/messages', icon: 'mail' },
      { label: t('announcements'), href: '/dashboard/announcements', icon: 'campaign' },
      { label: t('documents'), href: '/dashboard/documents', icon: 'folder_open' },
    ]},
  ] : role === 'student' ? [
    { label: t('groups.system'), items: [{ label: t('dashboard'), href: prefix, icon: 'dashboard' }] },
    { label: t('groups.academic'), items: [{ label: t('classes'), href: `${prefix}/classes`, icon: 'school' }] },
    { label: t('groups.operations'), items: [
      { label: t('attendance'), href: `${prefix}/attendance`, icon: 'event_note' },
      { label: t('homework'), href: `${prefix}/homework`, icon: 'assignment' },
      { label: t('grades'), href: `${prefix}/grades`, icon: 'grading' },
    ]},
    { label: t('groups.finance'), items: [{ label: t('payments'), href: `${prefix}/payments`, icon: 'payments' }] },
  ] : [
    { label: t('groups.system'), items: [{ label: t('dashboard'), href: prefix, icon: 'dashboard' }] },
    { label: t('groups.academic'), items: [{ label: t('classes'), href: `${prefix}/classes`, icon: 'school' }] },
    { label: t('groups.operations'), items: [
      { label: t('attendance'), href: `${prefix}/attendance`, icon: 'event_note' },
      { label: t('homework'), href: `${prefix}/homework`, icon: 'assignment' },
      { label: t('schedule'), href: `${prefix}/schedule`, icon: 'schedule' },
    ]},
  ]

  const SidebarContent = (
    <>
      <div className={`mb-10 ${isCollapsed ? 'px-0 flex flex-col items-center' : 'ps-2'}`}>
        <Link href={prefix} className="flex items-center gap-4 group transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 bg-on-surface text-white rounded-2xl flex items-center justify-center shadow-lg shadow-on-surface/10 group-hover:bg-primary transition-colors shrink-0">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          </div>
          {!isCollapsed && (
            <div className="anim-in slide-in-from-start-2 fade-in">
               <h3 className="text-lg font-black text-on-surface mb-2 leading-tight uppercase tracking-tighter italic border-s-4 border-primary ps-4">Tadriss</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-outline opacity-70 truncate max-w-[140px]">
                {institutionName || 'Tadriss Platform'}
              </p>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <div className="mt-8 anim-in fade-in duration-500">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-surface-container-high rounded-lg border border-outline-variant/10 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${role === 'institution_admin' ? 'bg-primary' : role === 'teacher' ? 'bg-secondary' : 'bg-info-soft'} animate-pulse`}></div>
              <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">
                {tc(`roles.${role}`)}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-10 overflow-y-auto no-scrollbar scroll-smooth pe-1">
        {GROUPS.map(group => (
          <div key={group.label} className="space-y-3">
            {!isCollapsed && <p className="px-4 text-[10px] font-black text-outline uppercase tracking-[0.25em] mb-4 opacity-50 anim-in fade-in">{group.label}</p>}
            <div className="space-y-1.5 text-center">
              {group.items.map(item => {
                const active = pathname === item.href || (item.href !== prefix && pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all group/item ${
                      active
                        ? 'bg-on-surface text-white shadow-xl shadow-on-surface/10 active-glow'
                        : 'text-outline hover:text-on-surface hover:bg-surface-container-high'
                    } ${isCollapsed ? 'justify-center px-0 w-12 mx-auto' : 'scale-[1.02]'}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] transition-transform group-hover/item:scale-110 ${active ? 'text-white' : 'text-outline'}`}
                      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >{item.icon}</span>
                    {!isCollapsed && <span className="flex-1 truncate anim-in slide-in-from-start-2">{item.label}</span>}
                    {active && !isCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></div>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`pt-6 mt-8 border-t border-outline-variant/10 space-y-6 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center gap-5 p-[18px] rounded-3xl bg-surface-container-high/40 border border-outline-variant/10 group hover:bg-surface-container-high transition-colors shadow-sm overflow-hidden ${isCollapsed ? 'w-12 h-12 p-0 justify-center rounded-2xl' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-on-surface text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md group-hover:scale-105 transition-transform">
            {userName?.[0]?.toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1 anim-in slide-in-from-start-2">
              <p className="text-[13px] font-black text-on-surface truncate uppercase italic tracking-tighter leading-none mb-2">{userName}</p>
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                 <p className="text-[9px] font-black text-outline uppercase tracking-wider opacity-70">
                   {tc(`roles_full.${role}`)}
                 </p>
              </div>
            </div>
          )}
        </div>

        <div className={`p-2 rounded-2xl bg-surface-container-high/60 border border-outline-variant/10 shadow-inner ${isCollapsed ? 'flex flex-col gap-2 items-center' : 'grid grid-cols-2 gap-2'}`}>
           <div className={`h-10 ${isCollapsed ? 'w-10' : 'col-span-2'}`}>
              <LanguageSwitcher compact={isCollapsed} />
           </div>
           <div className={`flex items-center justify-center bg-surface-container-low rounded-xl border border-outline-variant/5 h-10 overflow-hidden ${isCollapsed ? 'w-10' : ''}`}>
              <ThemeToggle />
           </div>
           {role === 'institution_admin' && (
             <Link
               href="/dashboard/settings"
               className={`flex items-center bg-surface-container-low rounded-xl border border-outline-variant/5 h-10 hover:bg-on-surface hover:text-white transition-all group/set ${isCollapsed ? 'w-10 justify-center' : 'px-3 gap-3'}`}
               title={t('settings')}
             >
               <span className="material-symbols-outlined text-[20px] group-hover/set:rotate-90 transition-transform">settings</span>
               {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{t('settings')}</span>}
             </Link>
           )}
           <div className={`flex items-center bg-surface-container-low rounded-xl border border-outline-variant/5 h-10 hover:bg-error/10 transition-all ${isCollapsed ? 'w-10 justify-center' : 'min-w-[140px]'}`}>
              <LogoutButton showLabel={!isCollapsed} />
           </div>
        </div>
      </div>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -end-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-on-surface text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-50 hidden md:flex border-4 border-background"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </>
  )

  const MOBILE_TABS = role === 'institution_admin' ? [
    { label: t('dashboard'), href: '/dashboard', icon: 'dashboard' },
    { label: t('classes'), href: '/dashboard/classes', icon: 'school' },
    { label: t('students_admin'), href: '/dashboard/students', icon: 'group' },
    { label: t('teachers_admin'), href: '/dashboard/teachers', icon: 'badge' },
    { label: tc('more'), icon: 'menu', action: () => setIsMobileOpen(true) },
  ] : [
    { label: t('dashboard'), href: prefix, icon: 'dashboard' },
    { label: t('classes'), href: `${prefix}/classes`, icon: 'school' },
    { label: t('attendance'), href: `${prefix}/attendance`, icon: 'event_note' },
    { label: t('homework'), href: `${prefix}/homework`, icon: 'assignment' },
    { label: tc('more'), icon: 'menu', action: () => setIsMobileOpen(true) },
  ]

  return (
    <>
      <aside 
        className={`h-screen fixed start-0 top-0 border-e border-outline-variant/10 bg-surface-container-low flex flex-col p-6 z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.02)] transition-all duration-300 hidden md:flex`}
        style={{ width: isCollapsed ? '80px' : '260px' }}
      >
        {SidebarContent}
      </aside>

      <div className="md:hidden fixed top-0 start-0 end-0 h-16 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between px-6 z-50">
        <Link href={prefix} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-on-surface text-white rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          </div>
          <span className="text-lg font-black italic uppercase tracking-tighter text-on-surface">Tadriss</span>
        </Link>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 start-0 end-0 h-20 bg-surface-container-low border-t border-outline-variant/10 px-4 pb-4 pt-2 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {MOBILE_TABS.map((tab) => {
          const active = tab.href ? (pathname === tab.href || (tab.href !== prefix && pathname.startsWith(tab.href + '/'))) : false
          const className = `flex flex-col items-center justify-center gap-1.5 flex-1 h-14 rounded-2xl transition-all ${
            active ? 'text-primary' : 'text-outline'
          }`
          const inner = (
            <>
              <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${active ? 'bg-primary/10 text-primary' : ''}`}>
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {tab.icon}
                </span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
            </>
          )

          return tab.href ? (
            <Link key={tab.label} href={tab.href} className={className}>
              {inner}
            </Link>
          ) : (
            <button key={tab.label} onClick={tab.action} className={className}>
              {inner}
            </button>
          )
        })}
      </nav>

      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />
      <aside 
        className={`fixed start-0 top-0 bottom-0 w-72 bg-surface-container-low z-[60] shadow-2xl transition-transform duration-300 md:hidden p-6 flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 end-6 w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        {SidebarContent}
      </aside>
    </>
  )
}
