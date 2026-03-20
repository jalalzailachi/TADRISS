import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tadriss — Gestion Scolaire',
  description: 'Plateforme de gestion pour établissements privés',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display antialiased">
        {children}
      </body>
    </html>
  );
}
