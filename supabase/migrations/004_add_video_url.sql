-- Add video_url column for timelapse videos
ALTER TABLE canvas_archives ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add index for archives with videos
CREATE INDEX IF NOT EXISTS idx_archives_with_video
  ON canvas_archives(id)
  WHERE video_url IS NOT NULL;
