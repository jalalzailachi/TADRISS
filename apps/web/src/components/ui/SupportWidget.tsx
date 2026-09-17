'use client'

import { useState } from 'react'
import { Modal } from './Modal'

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 end-8 w-14 h-14 bg-on-surface text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group"
        title="Help & Support"
      >
        <span className="material-symbols-outlined text-[24px]">help</span>
        {/* Tooltip */}
        <span className="absolute end-full me-4 px-3 py-1 bg-on-surface text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Assistance Strategy
        </span>
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Mission Support Center">
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="https://docs.tadriss.com" target="_blank" className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:border-primary transition-all group">
              <span className="material-symbols-outlined text-primary mb-4 block text-3xl">auto_stories</span>
              <h4 className="text-sm font-black text-on-surface uppercase tracking-tight mb-1">Knowledge Base</h4>
              <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">System manual & workflow optimization</p>
            </a>
            <a href="mailto:support@tadriss.com" className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:border-accent transition-all group">
              <span className="material-symbols-outlined text-accent mb-4 block text-3xl">contact_support</span>
              <h4 className="text-sm font-black text-on-surface uppercase tracking-tight mb-1">Direct Response</h4>
              <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">Strategic assistance from our team</p>
            </a>
          </div>

          <div className="p-6 bg-on-surface rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-white text-lg font-black uppercase tracking-tighter mb-2 italic">Institutional Onboarding</h4>
               <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Current Phase: Active Optimization</p>
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/80">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol 1: Faculty Initialization</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="material-symbols-outlined">circle</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol 2: Student Ledger Setup</span>
                  </div>
               </div>
            </div>
            <div className="absolute top-0 end-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full"></div>
          </div>

          <div className="flex justify-center pt-4">
            <button onClick={() => setIsOpen(false)} className="px-8 py-3 text-[10px] font-black text-outline uppercase tracking-widest hover:text-on-surface transition-colors italic">
              Close Communication
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
