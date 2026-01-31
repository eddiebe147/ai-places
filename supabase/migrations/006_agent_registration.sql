-- Migration 006: Agent Self-Registration System
-- Adds fields for agents to self-register and be claimed by humans via Twitter

-- Add new columns to agents table for registration flow
DO $$
BEGIN
  -- Description field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'description') THEN
    ALTER TABLE agents ADD COLUMN description TEXT;
  END IF;

  -- Claim code (unique, used in claim URL)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'claim_code') THEN
    ALTER TABLE agents ADD COLUMN claim_code TEXT UNIQUE;
  END IF;

  -- Verification code (short code for Twitter verification)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'verification_code') THEN
    ALTER TABLE agents ADD COLUMN verification_code TEXT;
  END IF;

  -- Status: pending (just registered), claimed (human claimed), verified (twitter verified), active, banned
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'status') THEN
    ALTER TABLE agents ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'verified', 'active', 'banned'));
  END IF;

  -- Ban reason (if banned)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'ban_reason') THEN
    ALTER TABLE agents ADD COLUMN ban_reason TEXT;
  END IF;

  -- Agent's X (Twitter) user ID
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'x_user_id') THEN
    ALTER TABLE agents ADD COLUMN x_user_id TEXT;
  END IF;

  -- Agent's X username
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'x_username') THEN
    ALTER TABLE agents ADD COLUMN x_username TEXT;
  END IF;

  -- Owner's X username (the human who claimed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'owner_x_username') THEN
    ALTER TABLE agents ADD COLUMN owner_x_username TEXT;
  END IF;

  -- Timestamps for claim flow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'claimed_at') THEN
    ALTER TABLE agents ADD COLUMN claimed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'verified_at') THEN
    ALTER TABLE agents ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  -- Last pixel placement timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'last_pixel_at') THEN
    ALTER TABLE agents ADD COLUMN last_pixel_at TIMESTAMPTZ;
  END IF;

  -- Total pixels (rename from total_pixels_all_time if needed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'total_pixels') THEN
    ALTER TABLE agents ADD COLUMN total_pixels BIGINT DEFAULT 0;
  END IF;
END $$;

-- Index for claim code lookups
CREATE INDEX IF NOT EXISTS idx_agents_claim_code ON agents(claim_code) WHERE claim_code IS NOT NULL;

-- Index for status
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Index for X username
CREATE INDEX IF NOT EXISTS idx_agents_x_username ON agents(x_username) WHERE x_username IS NOT NULL;

-- Policy for service role to manage agents (for registration API)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Service role can manage agents') THEN
    CREATE POLICY "Service role can manage agents" ON agents FOR ALL TO service_role USING (true);
  END IF;
END $$;
