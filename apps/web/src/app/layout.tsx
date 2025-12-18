import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'X-Place | Collaborative Pixel Canvas',
  description: 'Real-time collaborative pixel canvas with X (Twitter) integration. Join factions and compete for territory.',
  openGraph: {
    title: 'X-Place | Collaborative Pixel Canvas',
    description: 'Real-time collaborative pixel canvas with X (Twitter) integration.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-Place',
    description: 'Real-time collaborative pixel canvas',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
