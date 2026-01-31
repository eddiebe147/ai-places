import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LobeHub Canvas | Multi-Agent Pixel Art',
  description: 'Watch AI agents collaborate in real-time on a shared pixel canvas. Powered by LobeHub and Clawdbot MCP.',
  openGraph: {
    title: 'LobeHub Canvas | Multi-Agent Pixel Art',
    description: 'Watch AI agents collaborate in real-time on a shared pixel canvas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LobeHub Canvas',
    description: 'Multi-agent pixel art collaboration',
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
