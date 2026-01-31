-- Migration 005: Fix Missing Tables
-- This migration ensures all x-place specific tables exist
-- All statements are idempotent (safe to run multiple times)

-- 1. Create canvas_archives table
CREATE TABLE IF NOT EXISTS canvas_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  total_pixels_placed BIGINT DEFAULT 0,
  unique_contributors INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_number, year)
);

-- Add video_url column if it doesn't exist (from migration 004)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'canvas_archives' 
    AND column_name = 'video_url'
  ) THEN
    ALTER TABLE canvas_archives ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- Index for canvas_archives
CREATE INDEX IF NOT EXISTS idx_archives_week ON canvas_archives(year DESC, week_number DESC);

-- Enable RLS on canvas_archives
ALTER TABLE canvas_archives ENABLE ROW LEVEL SECURITY;

-- Create policy for canvas_archives (idempotent using DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'canvas_archives' 
    AND policyname = 'Archives are publicly viewable'
  ) THEN
    CREATE POLICY "Archives are publicly viewable"
      ON canvas_archives FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 2. Create comments table (references canvas_archives)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id UUID REFERENCES canvas_archives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('human', 'agent')),
  is_current_week BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_archive ON comments(archive_id);
CREATE INDEX IF NOT EXISTS idx_comments_type ON comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_comments_current_week ON comments(is_current_week) WHERE is_current_week = TRUE;

-- Comments policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comments are publicly viewable') THEN
    CREATE POLICY "Comments are publicly viewable" ON comments FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Premium users can post human comments') THEN
    CREATE POLICY "Premium users can post human comments" ON comments FOR INSERT TO authenticated 
      WITH CHECK (comment_type = 'human' AND user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete own comments') THEN
    CREATE POLICY "Users can delete own comments" ON comments FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update own comments') THEN
    CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- 3. Create weekly_leaderboard_snapshots table
CREATE TABLE IF NOT EXISTS weekly_leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id UUID NOT NULL REFERENCES canvas_archives(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  pixels_placed BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weekly_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_leaderboard_archive ON weekly_leaderboard_snapshots(archive_id);

-- Policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_leaderboard_snapshots' AND policyname = 'Leaderboard snapshots are publicly viewable') THEN
    CREATE POLICY "Leaderboard snapshots are publicly viewable" ON weekly_leaderboard_snapshots FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- 4. Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_verification_tokens ON email_verification_tokens(token) WHERE used_at IS NULL;

-- Policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_verification_tokens' AND policyname = 'Users can view own verification tokens') THEN
    CREATE POLICY "Users can view own verification tokens" ON email_verification_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- 5. Create agent_reputation table
CREATE TABLE IF NOT EXISTS agent_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  weeks_active INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id)
);

-- Enable RLS
ALTER TABLE agent_reputation ENABLE ROW LEVEL SECURITY;

-- Policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_reputation' AND policyname = 'Agent reputation is publicly viewable') THEN
    CREATE POLICY "Agent reputation is publicly viewable" ON agent_reputation FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- 6. Create social_posts table (from migration 003)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id UUID NOT NULL REFERENCES canvas_archives(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'bluesky', 'instagram', 'threads')),
  post_id TEXT,
  post_url TEXT,
  content TEXT NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for social_posts
CREATE INDEX IF NOT EXISTS idx_social_posts_archive ON social_posts(archive_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Policies for social_posts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_posts' AND policyname = 'Social posts are publicly viewable') THEN
    CREATE POLICY "Social posts are publicly viewable" ON social_posts FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_posts' AND policyname = 'Service role can manage social posts') THEN
    CREATE POLICY "Service role can manage social posts" ON social_posts FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
    CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_social_posts_updated_at') THEN
    CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_reputation_updated_at') THEN
    CREATE TRIGGER update_agent_reputation_updated_at BEFORE UPDATE ON agent_reputation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
