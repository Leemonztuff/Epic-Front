-- Admin Config Tables for Live-Ops
-- Run this after 01-schema.sql, 02-functions.sql, 04-seed.sql

-- Login Bonus Schedule (editable via /admin/economy)
CREATE TABLE IF NOT EXISTS login_bonus_config (
  day INTEGER PRIMARY KEY,
  currency INTEGER NOT NULL DEFAULT 100,
  premium_currency INTEGER NOT NULL DEFAULT 0,
  exp INTEGER NOT NULL DEFAULT 50,
  item TEXT,
  is_special BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default login bonus
INSERT INTO login_bonus_config (day, currency, premium_currency, exp, item, is_special) VALUES
  (1, 100, 0, 50, NULL, FALSE),
  (2, 150, 5, 75, NULL, FALSE),
  (3, 200, 10, 100, NULL, FALSE),
  (4, 250, 10, 150, NULL, FALSE),
  (5, 300, 15, 200, NULL, FALSE),
  (6, 350, 20, 250, NULL, FALSE),
  (7, 500, 50, 500, 'rare_chest', TRUE)
ON CONFLICT (day) DO NOTHING;

-- Gacha Items Catalog (editable via /admin/gacha)
CREATE TABLE IF NOT EXISTS gacha_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  rate REAL DEFAULT 0,
  stats JSONB DEFAULT '{}',
  effects JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add admin role to players table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'role'
  ) THEN
    ALTER TABLE players ADD COLUMN role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin', 'moderator'));
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE login_bonus_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_items ENABLE ROW LEVEL SECURITY;

-- RLS: public read for config tables
CREATE POLICY "Public read login_bonus_config"
  ON login_bonus_config FOR SELECT USING (TRUE);

CREATE POLICY "Public read gacha_items"
  ON gacha_items FOR SELECT USING (TRUE);

-- RLS: admin-only write
CREATE POLICY "Admin write login_bonus_config"
  ON login_bonus_config FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );

CREATE POLICY "Admin update login_bonus_config"
  ON login_bonus_config FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );

CREATE POLICY "Admin write gacha_items"
  ON gacha_items FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );

CREATE POLICY "Admin update gacha_items"
  ON gacha_items FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM players WHERE role = 'admin')
  );
