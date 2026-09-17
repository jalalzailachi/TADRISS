import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('landing')
  return {
    title: `Tadriss — ${t('hero.headline')}`,
    description: t('hero.subtext'),
  }
}

export default async function LandingPage() {
  const t = await getTranslations('landing')

  const features = [
    { icon: 'admin_panel_settings', title: t('features.items.0.title'), desc: t('features.items.0.desc') },
    { icon: 'groups',               title: t('features.items.1.title'), desc: t('features.items.1.desc') },
    { icon: 'schedule',             title: t('features.items.2.title'), desc: t('features.items.2.desc') },
    { icon: 'payments',             title: t('features.items.3.title'), desc: t('features.items.3.desc') },
    { icon: 'translate',            title: t('features.items.4.title'), desc: t('features.items.4.desc') },
    { icon: 'shield_lock',          title: t('features.items.5.title'), desc: t('features.items.5.desc') },
  ]

  const stats = [
    { value: t('stats.0.value'), label: t('stats.0.label') },
    { value: t('stats.1.value'), label: t('stats.1.label') },
    { value: t('stats.2.value'), label: t('stats.2.label') },
    { value: t('stats.3.value'), label: t('stats.3.label') },
  ]

  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface overflow-hidden">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-15%] start-[-10%] w-[55%] h-[55%] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary), transparent 88%) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] end-[-10%] w-[55%] h-[55%] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-tertiary), transparent 90%) 0%, transparent 70%)' }} />
        <div className="pattern-bg absolute inset-0 opacity-60" />
      </div>

      {/* ── Navigation ── */}
      <header className="relative z-10 sticky top-0 glass-nav border-b border-outline-variant/20">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-3 group" id="nav-logo">
            <div className="w-9 h-9 rounded-xl luxury-gradient flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic text-on-surface">Tadriss</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              id="nav-login"
              className="hidden sm:inline-flex items-center h-10 px-5 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200"
            >
              {t('nav.login')}
            </Link>
            <Link
              href="/signup"
              id="nav-get-started"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('nav.getStarted')}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex-1">

        {/* ── Hero Section ── */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-5xl mx-auto w-full" aria-label="Hero">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary-fixed/60 border border-tertiary/20 mb-8 anim-in">
            <span className="flex h-2 w-2 rounded-full bg-tertiary animate-pulse shrink-0" />
            <span className="text-xs font-black tracking-widest text-on-tertiary-fixed-variant uppercase">
              {t('badge')}
            </span>
          </div>

          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 anim-in"
            style={{ animationDelay: '80ms' }}>
            <span className="text-on-surface">{t('hero.headline').split(' for ')[0]}</span>
            {t('hero.headline').includes(' for ') && (
              <>
                {' '}
                <span className="relative">
                  <span className="relative z-10 text-transparent bg-clip-text luxury-gradient">
                    for {t('hero.headline').split(' for ').slice(1).join(' for ')}
                  </span>
                </span>
              </>
            )}
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-10 font-light leading-relaxed anim-in"
            style={{ animationDelay: '160ms' }}>
            {t('hero.subtext')}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center anim-in" style={{ animationDelay: '240ms' }}>
            <Link
              href="/signup"
              id="hero-cta-primary"
              className="group flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base luxury-gradient text-white transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 hover:-translate-y-1 active:translate-y-0"
            >
              {t('cta.primary')}
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <a
              href="#features"
              id="hero-cta-secondary"
              className="group flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all duration-300 hover:-translate-y-1 active:translate-y-0 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">play_circle</span>
              {t('cta.secondary')}
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 w-full max-w-3xl stagger-in">
            {stats.map((stat) => (
              <div key={stat.label} className="card-premium p-5 rounded-2xl text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="font-headline text-3xl font-black text-primary mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="px-6 py-24 bg-surface-container-low/50 border-y border-outline-variant/10" aria-label="Features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/40 border border-primary/10 mb-4">
                <span className="material-symbols-outlined text-primary text-[16px]">auto_awesome</span>
                <span className="text-[11px] font-black text-on-primary-fixed-variant uppercase tracking-widest">{t('features.badge')}</span>
              </div>
              <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-4">{t('features.title')}</h2>
              <p className="text-on-surface-variant text-lg max-w-xl mx-auto">{t('features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in">
              {features.map((f) => (
                <div
                  key={f.icon}
                  className="card-premium p-7 rounded-2xl group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-on-surface/8 cursor-default"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-primary text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{f.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="px-6 py-24" aria-label="Call to action">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl luxury-gradient p-12 text-center shadow-2xl shadow-primary/30">
              {/* Decorative circles */}
              <div className="absolute top-[-30%] end-[-10%] w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute bottom-[-30%] start-[-10%] w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

              <div className="relative z-10">
                <span className="material-symbols-outlined text-white/60 text-[48px] mb-4 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                <h2 className="font-headline text-4xl font-extrabold text-white mb-4">{t('ctaBanner.headline')}</h2>
                <p className="text-white/75 text-lg mb-8 max-w-md mx-auto">{t('ctaBanner.subtext')}</p>
                <Link
                  href="/signup"
                  id="cta-banner-button"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base bg-white text-primary hover:bg-surface-container-lowest transition-all duration-200 shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t('ctaBanner.button')}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-outline-variant/20 bg-surface-container-low/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg luxury-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
            <span className="text-sm font-black italic uppercase tracking-tighter text-on-surface">Tadriss</span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            {t('footer.rights', { year })}
          </p>
          <p className="text-xs text-on-surface-variant/60 font-medium">
            {t('footer.tagline')}
          </p>
        </div>
      </footer>

    </div>
  )
}
