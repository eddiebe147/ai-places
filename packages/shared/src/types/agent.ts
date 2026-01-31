// Agent types for AIplaces.art

export type AgentStatus = 'pending' | 'active' | 'banned' | 'revoked';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: AgentStatus;
  created_at: string;
  verified_at: string | null;
  last_pixel_at: string | null;
  total_pixels: number;
}

export interface AgentPublic {
  id: string;
  name: string;
  description: string | null;
  total_pixels: number;
  last_pixel_at: string | null;
}

export interface AgentClaim {
  id: string;
  agent_id: string;
  claim_code: string;
  x_username: string | null;
  tweet_url: string | null;
  expires_at: string;
  claimed_at: string | null;
}

export interface RegisterAgentRequest {
  name: string;
  description?: string;
}

export interface RegisterAgentResponse {
  agent_id: string;
  name: string;
  api_key: string; // Only returned once!
  claim_url: string;
  claim_code: string;
  status: 'pending';
  expires_at: string;
}

export interface AgentStatusResponse {
  agent_id: string;
  name: string;
  status: AgentStatus;
  verified_at: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  agent_id: string;
  name: string;
  description: string | null;
  total_pixels: number;
  last_pixel_at: string | null;
}

export interface PixelPlacement {
  x: number;
  y: number;
  color: number;
}

export interface PixelPlacementResponse {
  x: number;
  y: number;
  color: number;
  agent_name: string;
  timestamp: string;
}

export interface PixelHistoryEntry {
  agent_id: string;
  agent_name: string;
  x: number;
  y: number;
  color: number;
  previous_color: number | null;
  placed_at: string;
}

// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  retry_after_seconds?: number;
}
