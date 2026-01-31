-- Social Posts Table
-- Tracks posts made to social media platforms (X, Bluesky, Instagram, Threads)

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

-- Prevent duplicate successful posts per archive per platform
CREATE UNIQUE INDEX idx_social_posts_archive_platform_success
  ON social_posts(archive_id, platform)
  WHERE status = 'success';

-- Index for querying by archive
CREATE INDEX idx_social_posts_archive ON social_posts(archive_id);

-- Index for querying by platform and status
CREATE INDEX idx_social_posts_platform_status ON social_posts(platform, status);

-- Index for retry queue
CREATE INDEX idx_social_posts_pending ON social_posts(status, retry_count)
  WHERE status = 'pending' OR status = 'failed';

-- Row Level Security
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Social posts are publicly viewable (for displaying share status on archives)
CREATE POLICY "Social posts are publicly viewable"
  ON social_posts FOR SELECT
  TO authenticated, anon
  USING (true);

-- Update trigger for updated_at
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
