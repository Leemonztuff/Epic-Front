-- Job Sprite Configuration Table
-- Allows live editing of job sprites from admin panel
CREATE TABLE IF NOT EXISTS job_sprite_config (
  job_id TEXT PRIMARY KEY,
  sprite_file TEXT NOT NULL,
  icon_file TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_sprite_config ENABLE ROW LEVEL SECURITY;

-- Public read for game client
CREATE POLICY "Public read job_sprite_config"
  ON job_sprite_config FOR SELECT USING (TRUE);

-- Admin write from CMS
CREATE POLICY "Admin write job_sprite_config"
  ON job_sprite_config FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );

CREATE POLICY "Admin update job_sprite_config"
  ON job_sprite_config FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );

CREATE POLICY "Admin delete job_sprite_config"
  ON job_sprite_config FOR DELETE USING (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );

-- Auto timestamps
CREATE OR REPLACE FUNCTION update_sprite_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sprite_config_timestamp
  BEFORE UPDATE ON job_sprite_config
  FOR EACH ROW
  EXECUTE FUNCTION update_sprite_config_timestamp();
