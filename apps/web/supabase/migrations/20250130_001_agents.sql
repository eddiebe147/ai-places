-- AIplaces.art Agent Schema
-- Migration: 001_agents
-- Date: 2025-01-30

-- ============================================
-- AGENTS TABLE
-- Stores registered AI agents
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  api_key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'banned', 'revoked')),
  ban_reason TEXT,
  -- X (Twitter) account that claimed this agent
  x_user_id TEXT UNIQUE,
  x_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  last_pixel_at TIMESTAMPTZ,
  total_pixels INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_api_key_hash ON agents(api_key_hash);
CREATE INDEX idx_agents_x_user_id ON agents(x_user_id) WHERE x_user_id IS NOT NULL;

-- ============================================
-- AGENT CLAIMS TABLE
-- Tweet verification for agent ownership
-- ============================================
CREATE TABLE IF NOT EXISTS agent_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  claim_code TEXT NOT NULL UNIQUE,
  x_username TEXT,
  tweet_url TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

CREATE INDEX idx_claims_code ON agent_claims(claim_code);
CREATE INDEX idx_claims_agent ON agent_claims(agent_id);

-- ============================================
-- PIXEL HISTORY TABLE
-- Audit log of all pixel placements
-- ============================================
CREATE TABLE IF NOT EXISTS pixel_history (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id),
  x SMALLINT NOT NULL CHECK (x >= 0 AND x < 500),
  y SMALLINT NOT NULL CHECK (y >= 0 AND y < 500),
  color SMALLINT NOT NULL CHECK (color >= 0 AND color < 16),
  previous_color SMALLINT CHECK (previous_color >= 0 AND previous_color < 16),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pixel_history_agent ON pixel_history(agent_id, placed_at DESC);
CREATE INDEX idx_pixel_history_coords ON pixel_history(x, y, placed_at DESC);
CREATE INDEX idx_pixel_history_time ON pixel_history(placed_at DESC);

-- ============================================
-- ABUSE REPORTS TABLE
-- Track suspicious activity
-- ============================================
CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('rate_limit', 'pattern', 'griefing', 'targeting', 'manual')),
  reason TEXT NOT NULL,
  evidence JSONB,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  action_taken TEXT
);

CREATE INDEX idx_abuse_agent ON abuse_reports(agent_id);
CREATE INDEX idx_abuse_unresolved ON abuse_reports(resolved) WHERE resolved = FALSE;

-- ============================================
-- SECURITY EVENTS TABLE
-- Audit log for security-related events
-- ============================================
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id),
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_agent ON security_events(agent_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Agents: Public read for active agents, service role for write
CREATE POLICY "Public can view active agents" ON agents
  FOR SELECT USING (status = 'active');

CREATE POLICY "Service role full access to agents" ON agents
  FOR ALL USING (auth.role() = 'service_role');

-- Agent claims: Service role only
CREATE POLICY "Service role full access to claims" ON agent_claims
  FOR ALL USING (auth.role() = 'service_role');

-- Pixel history: Public read, service role write
CREATE POLICY "Public can view pixel history" ON pixel_history
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert pixel history" ON pixel_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Abuse reports: Service role only
CREATE POLICY "Service role full access to abuse reports" ON abuse_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Security events: Service role only
CREATE POLICY "Service role full access to security events" ON security_events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment agent pixel count
CREATE OR REPLACE FUNCTION increment_agent_pixels(agent_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents
  SET
    total_pixels = total_pixels + 1,
    last_pixel_at = NOW()
  WHERE id = agent_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_agent_leaderboard(limit_count INT DEFAULT 100)
RETURNS TABLE (
  rank BIGINT,
  agent_id UUID,
  name TEXT,
  description TEXT,
  x_username TEXT,
  total_pixels INT,
  last_pixel_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.total_pixels DESC) as rank,
    a.id as agent_id,
    a.name,
    a.description,
    a.x_username,
    a.total_pixels,
    a.last_pixel_at
  FROM agents a
  WHERE a.status = 'active'
  ORDER BY a.total_pixels DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
