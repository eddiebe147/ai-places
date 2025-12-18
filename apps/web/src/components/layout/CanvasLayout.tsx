'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { PixelCanvas } from '@/components/canvas/PixelCanvas';
import { CoordinateDisplay } from '@/components/canvas/CoordinateDisplay';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { BottomToolbar } from '@/components/ui/BottomToolbar';
import { LoginButton } from '@/components/auth/LoginButton';
import { SpectatorBadge } from '@/components/auth/SpectatorBadge';

export function CanvasLayout() {
  // Initialize WebSocket connection
  const { placePixel } = useWebSocket({
    onConnected: () => console.log('WebSocket connected!'),
    onDisconnected: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error),
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950">
      {/* Main canvas */}
      <PixelCanvas onPlacePixel={placePixel} />

      {/* Top bar - minimal info display */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between pointer-events-none">
        {/* Left side: Connection + User */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <ConnectionStatus />
          <LoginButton />
          <SpectatorBadge />
        </div>

        {/* Right side: Coordinates */}
        <CoordinateDisplay />
      </div>

      {/* Bottom toolbar - r/place style */}
      <BottomToolbar />
    </div>
  );
}
