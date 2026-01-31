-- Weekly Objectives System
-- Rotating challenges that give users goals each week

-- Objective definitions (static list)
CREATE TABLE IF NOT EXISTS objective_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  scoring_type TEXT NOT NULL CHECK (scoring_type IN ('pixels', 'territory', 'collaboration', 'votes')),
  target_value INTEGER, -- optional target to "complete" the objective
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default objectives
INSERT INTO objective_definitions (id, name, description, icon, scoring_type, target_value) VALUES
  ('territory_king', 'Territory King', 'Hold the largest connected area of your color', 'crown', 'territory', NULL),
  ('collaboration_star', 'Team Player', 'Work with 5+ different users on shared patterns', 'users', 'collaboration', 5),
  ('speed_demon', 'Speed Demon', 'Place the most pixels in the first 24 hours', 'zap', 'pixels', NULL),
  ('artistic_merit', 'Artistic Merit', 'Create patterns that receive the most community votes', 'star', 'votes', NULL),
  ('persistence', 'Persistence', 'Place at least 100 pixels this week', 'check', 'pixels', 100),
  ('defender', 'Color Defender', 'Maintain territory against overwrites', 'shield', 'territory', NULL)
ON CONFLICT (id) DO NOTHING;

-- Active objectives for each week (1-3 active per week)
CREATE TABLE IF NOT EXISTS weekly_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  objective_id TEXT NOT NULL REFERENCES objective_definitions(id),
  is_primary BOOLEAN DEFAULT FALSE, -- primary objective highlighted in UI
  bonus_multiplier NUMERIC(3,2) DEFAULT 1.0, -- reputation bonus for this objective
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_number, year, objective_id)
);

-- User progress on objectives
CREATE TABLE IF NOT EXISTS objective_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  objective_id TEXT NOT NULL REFERENCES objective_definitions(id),
  current_value INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Either user or agent, not both
  CONSTRAINT valid_participant CHECK (
    (user_id IS NOT NULL AND agent_id IS NULL) OR
    (agent_id IS NOT NULL AND user_id IS NULL)
  ),
  -- Unique per participant per objective per week
  UNIQUE(user_id, week_number, year, objective_id),
  UNIQUE(agent_id, week_number, year, objective_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_objectives_week ON weekly_objectives(year DESC, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_objective_progress_user ON objective_progress(user_id, week_number, year);
CREATE INDEX IF NOT EXISTS idx_objective_progress_agent ON objective_progress(agent_id, week_number, year);

-- RLS
ALTER TABLE objective_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_progress ENABLE ROW LEVEL SECURITY;

-- Public read for definitions and weekly objectives
CREATE POLICY "Objective definitions are public" ON objective_definitions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Weekly objectives are public" ON weekly_objectives FOR SELECT TO authenticated, anon USING (true);

-- Users can view their own progress
CREATE POLICY "Users can view own progress" ON objective_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR agent_id IS NOT NULL);

-- Function to get or create weekly objectives
CREATE OR REPLACE FUNCTION get_or_create_weekly_objectives(p_week INTEGER, p_year INTEGER)
RETURNS SETOF weekly_objectives AS $$
DECLARE
  objectives_count INTEGER;
BEGIN
  -- Check if objectives exist for this week
  SELECT COUNT(*) INTO objectives_count
  FROM weekly_objectives
  WHERE week_number = p_week AND year = p_year;

  -- If not, create random objectives
  IF objectives_count = 0 THEN
    -- Pick 2-3 random objectives
    INSERT INTO weekly_objectives (week_number, year, objective_id, is_primary, bonus_multiplier)
    SELECT
      p_week,
      p_year,
      id,
      (ROW_NUMBER() OVER (ORDER BY RANDOM()) = 1), -- first one is primary
      1.0 + (RANDOM() * 0.5)::NUMERIC(3,2) -- 1.0 to 1.5 bonus
    FROM objective_definitions
    ORDER BY RANDOM()
    LIMIT 2 + (RANDOM() > 0.5)::INT; -- 2 or 3 objectives
  END IF;

  -- Return all objectives for this week
  RETURN QUERY
  SELECT * FROM weekly_objectives
  WHERE week_number = p_week AND year = p_year
  ORDER BY is_primary DESC, bonus_multiplier DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
