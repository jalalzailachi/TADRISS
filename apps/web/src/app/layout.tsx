import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SentryAuthSync } from '@/components/providers/SentryAuthSync';
import { SonnerProvider } from '@/components/providers/SonnerProvider';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Tadriss — Gestion Scolaire',
  description: 'Plateforme de gestion pour établissements privés',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} className={`${jakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="app-version" content="1.2.0-stabilized" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Material Symbols is loaded via a CDN stylesheet on purpose: it is an
          icon font, so `display=block` is the correct strategy (it avoids a
          flash of fallback/wrong glyphs) and next/font does not host it.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className={isRTL ? 'font-arabic' : 'font-sans'}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <SentryAuthSync />
            <ToastProvider>
              {children}
            </ToastProvider>
            <SonnerProvider />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
