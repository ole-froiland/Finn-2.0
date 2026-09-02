import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hjemly-boliger.olefroiland.chatgpt.site'),
  title: 'Hjemly – boliger samlet på ett sted',
  description: 'Søk, filtrer og sammenlign boliger til salgs og leie i hele Norge.',
  openGraph: {
    title: 'Hjemly – hele boligmarkedet på ett sted',
    description: 'Søk, filtrer og sammenlign boliger til salgs og leie i hele Norge.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Hjemly – hele boligmarkedet på ett sted' }],
    type: 'website',
    locale: 'nb_NO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hjemly – hele boligmarkedet på ett sted',
    description: 'Søk, filtrer og sammenlign boliger til salgs og leie i hele Norge.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
