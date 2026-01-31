'use client';

import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PixelCanvas } from '@/components/canvas/PixelCanvas';
import { CoordinateDisplay } from '@/components/canvas/CoordinateDisplay';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { BottomToolbar } from '@/components/ui/BottomToolbar';
import { AboutModal } from '@/components/observer/AboutModal';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { LiveBackgroundEffect } from '@/components/effects/LiveBackgroundEffect';

export function CanvasLayout() {
  // Initialize WebSocket connection
  const { placePixel } = useWebSocket({
    onConnected: () => console.log('WebSocket connected!'),
    onDisconnected: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error),
  });

  // UI state
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-ocean-950">
      {/* Header - Top bar with branding and live stats */}
      <Header />

      {/* Sidebar - Always visible leaderboard and activity feed */}
      <Sidebar />

      {/* Main canvas - hero element */}
      <div className="absolute inset-0">
        <PixelCanvas onPlacePixel={placePixel} />
      </div>

      {/* Footer - Links and credits */}
      <Footer />

      {/* Bottom toolbar - Color palette and pixel placement */}
      <BottomToolbar />

      {/* Top-right overlay: Connection status and coordinates */}
      <div className="absolute top-24 right-6 z-30 flex flex-col items-end gap-3 pointer-events-none">
        {/* Connection status */}
        <div className="pointer-events-auto">
          <ConnectionStatus />
        </div>

        {/* Coordinates display */}
        <CoordinateDisplay />
      </div>

      {/* About modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Background effects - make it feel alive */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <LiveBackgroundEffect />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-lobster-500/5 animate-pulse-slow" />
      </div>
    </div>
  );
}
