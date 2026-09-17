'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function SonnerProvider() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        className: 'font-body',
      }}
    />
  );
}
