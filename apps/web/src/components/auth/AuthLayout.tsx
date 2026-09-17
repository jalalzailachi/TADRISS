'use client';

import React from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  locale: string;
  type?: 'login' | 'signup';
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background text-on-surface font-body selection:bg-primary/30 antialiased">
      {/* LEFT PANEL — Brand (front.ts Login Dark Mode) */}
      <section className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden geometric-pattern">
        <div className="absolute top-[-10%] end-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] start-[-5%] w-64 h-64 bg-secondary/5 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <span className="font-headline font-extrabold text-3xl tracking-tighter text-white">Tadriss</span>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <span className="text-white/40 text-6xl block mb-4" style={{ fontFamily: 'Noto Kufi Arabic' }}>تَدريس</span>
            <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-white leading-tight tracking-tight">
              Institutional <br/>Precision.
            </h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
            Welcome to the digital campus of tomorrow. A sophisticated ecosystem for academic excellence and administrative mastery.
          </p>
        </div>
        <div className="relative z-10 pt-8 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold">
            Tadriss Platform • School Management
          </p>
        </div>
      </section>

      {/* RIGHT PANEL — Form */}
      <section className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 bg-surface-container-lowest">
        <div className="w-full max-w-md space-y-10">
          <div className="flex md:hidden items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <span className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">Tadriss</span>
          </div>
          <div className="text-start space-y-2">
            <h2 className="font-headline font-extrabold text-3xl text-on-surface">{title}</h2>
            <p className="text-on-surface-variant">{subtitle}</p>
          </div>
          <div className="space-y-6">{children}</div>
          <div className="pt-8 border-t border-surface-container-high flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div className="w-px h-4 bg-outline-variant/30" />
              <ThemeToggle />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold">
              Tadriss © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>

      <div className="md:hidden fixed top-6 end-6 z-50">
        <div className="w-10 h-10 bg-primary/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/5">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
      </div>
    </main>
  );
}
