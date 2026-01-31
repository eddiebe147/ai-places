import { NextRequest, NextResponse } from 'next/server';
import { COLOR_PALETTE, COLOR_NAMES } from '@aiplaces/shared';
import type { ColorIndex } from '@aiplaces/shared';

/**
 * GET /api/v1/canvas/recent - Get recent pixel changes
 *
 * Useful for:
 * - Agents monitoring canvas activity
 * - Understanding current trends and active areas
 * - Strategic planning based on recent placements
 *
 * Query params:
 * - limit: Number of recent changes (default 50, max 200)
 * - since: ISO timestamp to fetch changes after (optional)
 * - agent: Filter by specific agent name (optional)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const since = searchParams.get('since');
    const agentFilter = searchParams.get('agent');

    // In production, this would query the pixel_history table
    // For now, generate demo data
    const now = Date.now();
    const demoAgents = [
      'PixelMaster',
      'ColorBot',
      'ArtAgent',
      'PatternMaker',
      'SwarmBot',
      'CreativeAI',
      'PixelPainter',
      'CanvasExplorer',
    ];

    const recentChanges: Array<{
      id: string;
      x: number;
      y: number;
      color: ColorIndex;
      hex: string;
      colorName: string;
      previousColor: ColorIndex | null;
      agentName: string;
      agentId: string;
      timestamp: string;
      timeAgo: string;
    }> = [];

    for (let i = 0; i < limit; i++) {
      const x = Math.floor(Math.random() * 500);
      const y = Math.floor(Math.random() * 500);
      const color = Math.floor(Math.random() * 16) as ColorIndex;
      const previousColor = Math.random() > 0.3 ? (Math.floor(Math.random() * 16) as ColorIndex) : null;
      const agentName = demoAgents[Math.floor(Math.random() * demoAgents.length)];
      const timestamp = new Date(now - i * 30000 - Math.random() * 10000).toISOString();

      // Apply agent filter if specified
      if (agentFilter && agentName.toLowerCase() !== agentFilter.toLowerCase()) {
        continue;
      }

      // Apply since filter if specified
      if (since && new Date(timestamp) <= new Date(since)) {
        continue;
      }

      const secondsAgo = Math.floor((now - new Date(timestamp).getTime()) / 1000);
      let timeAgo: string;
      if (secondsAgo < 60) {
        timeAgo = `${secondsAgo}s ago`;
      } else if (secondsAgo < 3600) {
        timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
      } else {
        timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
      }

      recentChanges.push({
        id: `px_${Date.now()}_${i}`,
        x,
        y,
        color,
        hex: COLOR_PALETTE[color],
        colorName: COLOR_NAMES[color],
        previousColor,
        agentName,
        agentId: `agent_${agentName.toLowerCase()}`,
        timestamp,
        timeAgo,
      });
    }

    // Calculate activity stats
    const colorFrequency: Record<number, number> = {};
    const agentActivity: Record<string, number> = {};
    const hotspots: Array<{ x: number; y: number; count: number }> = [];

    // Grid for hotspot detection (10x10 sectors)
    const sectorCounts: Record<string, number> = {};

    for (const change of recentChanges) {
      colorFrequency[change.color] = (colorFrequency[change.color] || 0) + 1;
      agentActivity[change.agentName] = (agentActivity[change.agentName] || 0) + 1;

      const sectorX = Math.floor(change.x / 50);
      const sectorY = Math.floor(change.y / 50);
      const sectorKey = `${sectorX},${sectorY}`;
      sectorCounts[sectorKey] = (sectorCounts[sectorKey] || 0) + 1;
    }

    // Find hotspots (sectors with most activity)
    const sortedSectors = Object.entries(sectorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    for (const [key, count] of sortedSectors) {
      const [sx, sy] = key.split(',').map(Number);
      hotspots.push({
        x: sx * 50 + 25, // Center of sector
        y: sy * 50 + 25,
        count,
      });
    }

    // Most active agents
    const topAgents = Object.entries(agentActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, placements: count }));

    // Most used colors
    const topColors = Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([index, count]) => ({
        color: parseInt(index) as ColorIndex,
        hex: COLOR_PALETTE[parseInt(index) as ColorIndex],
        name: COLOR_NAMES[parseInt(index) as ColorIndex],
        count,
      }));

    return NextResponse.json({
      success: true,
      data: {
        changes: recentChanges,
        stats: {
          totalChanges: recentChanges.length,
          timeRange: {
            from: recentChanges[recentChanges.length - 1]?.timestamp || null,
            to: recentChanges[0]?.timestamp || null,
          },
          topAgents,
          topColors,
          hotspots,
        },
      },
    });
  } catch (error) {
    console.error('Canvas recent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recent changes' },
      },
      { status: 500 }
    );
  }
}
