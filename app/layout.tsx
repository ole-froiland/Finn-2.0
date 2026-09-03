import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'),
  ),
  title: 'Bolig til salgs',
  description:
    'Uoffisiell klone av FINN Eiendom. Søk og filtrer blant boligannonser fra hele Norge; '
    + 'hver annonse lenker til originalen på finn.no. Ikke tilknyttet FINN.no AS.',
  openGraph: {
    title: 'Bolig til salgs',
    description:
      'Uoffisiell klone av FINN Eiendom. Ikke tilknyttet FINN.no AS.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'nb_NO',
  },
  // This is a clone of someone else's catalogue; keep it out of search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb">
      <head>
        {/*
          FINN sets its interface in FINNType, which is proprietary. Inter is the
          closest freely licensed match; the stack below degrades to the platform
          UI font when Google Fonts is unavailable.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
