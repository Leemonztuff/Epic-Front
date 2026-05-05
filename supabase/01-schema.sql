-- Epic RPG Database Schema - TABLES ONLY
-- This file contains table definitions, constraints, and indexes
-- Run this FIRST

-- =====================================================
-- SECTION 1: METADATA & CONFIG
-- =====================================================

CREATE TABLE IF NOT EXISTS game_configs (
    version TEXT PRIMARY KEY,
    is_active BOOLEAN DEFAULT false,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 2: STATIC DATA (Content)
-- =====================================================

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    version TEXT REFERENCES game_configs(version),
    name TEXT NOT NULL,
    tier INTEGER NOT NULL,
    parent_job_id TEXT REFERENCES jobs(id),
    stat_modifiers JSONB NOT NULL,
    allowed_weapons TEXT[] NOT NULL,
    skills_unlocked JSONB NOT NULL,
    passive_effects TEXT[] NOT NULL,
    evolution_requirements JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    version TEXT REFERENCES game_configs(version),
    name TEXT NOT NULL,
    description TEXT,
    cooldown INTEGER DEFAULT 0,
    effect JSONB,
    scaling JSONB,
    rarity TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    version TEXT REFERENCES game_configs(version),
    name TEXT NOT NULL,
    rarity TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    effect_value JSONB,
    applicable_jobs TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS weapons (
    id TEXT PRIMARY KEY,
    version TEXT REFERENCES game_configs(version),
    name TEXT NOT NULL,
    weapon_type TEXT NOT NULL,
    rarity TEXT NOT NULL,
    stat_bonuses JSONB,
    special_effects JSONB
);

CREATE TABLE IF NOT EXISTS job_cores (
    id TEXT PRIMARY KEY,
    version TEXT REFERENCES game_configs(version),
    name TEXT NOT NULL,
    rarity TEXT NOT NULL,
    unlocks_job_id TEXT REFERENCES jobs(id)
);

-- =====================================================
-- SECTION 2B: NEW SKILL SYSTEM (Modular/Combo)
-- =====================================================

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    value NUMERIC,
    duration INTEGER,
    extra JSONB
);

CREATE TABLE IF NOT EXISTS skill_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT REFERENCES game_configs(version),
    name TEXT NOT NULL,
    description TEXT,
    base_power INTEGER NOT NULL,
    cooldown INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_module_tags (
    skill_id UUID REFERENCES skill_modules(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, tag_id)
);

CREATE TABLE IF NOT EXISTS skill_module_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skill_modules(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES triggers(id) ON DELETE CASCADE,
    effect_id UUID REFERENCES effects(id) ON DELETE CASCADE,
    condition JSONB DEFAULT '{}',
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_skill_modules (
    job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
    skill_module_id UUID REFERENCES skill_modules(id) ON DELETE CASCADE,
    slot_index INTEGER DEFAULT 0,
    PRIMARY KEY (job_id, skill_module_id)
);

-- =====================================================
-- SECTION 3: PLAYER DATA TABLES
-- =====================================================

-- Players table - may already exist in DB
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    currency BIGINT DEFAULT 1000,
    premium_currency BIGINT DEFAULT 100,
    energy INTEGER DEFAULT 30,
    max_energy INTEGER DEFAULT 30,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    last_energy_regen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    party_size_limit INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SECTION 4: PLAYER SKILL DATA (Crafting) - must be after players table
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_fragments (
    id TEXT PRIMARY KEY,
    skill_module_id UUID REFERENCES skill_modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    piece_count INTEGER NOT NULL DEFAULT 1,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    version TEXT REFERENCES game_configs(version),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_skill_fragments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    fragment_id TEXT REFERENCES skill_fragments(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE(player_id, fragment_id)
);

CREATE TABLE IF NOT EXISTS player_learned_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    skill_module_id UUID REFERENCES skill_modules(id) ON DELETE CASCADE,
    learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, skill_module_id)
);

-- Gacha pity system
CREATE TABLE IF NOT EXISTS gacha_state (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    pulls_since_epic INTEGER DEFAULT 0,
    pulls_since_legendary INTEGER DEFAULT 0,
    last_pull_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    base_stats JSONB NOT NULL,
    growth_rates JSONB NOT NULL,
    affinity TEXT NOT NULL,
    trait TEXT,
    current_job_id TEXT NOT NULL,
    unlocked_jobs TEXT[] DEFAULT ARRAY['novice'],
    equipped_weapon_instance_id UUID,
    equipped_card_instance_ids UUID[] DEFAULT ARRAY[]::UUID[],
    equipped_skill_instance_ids UUID[] DEFAULT ARRAY[]::UUID[],
    sprite_id TEXT,
    icon_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_player_item UNIQUE (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS party (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    PRIMARY KEY (player_id, slot_index)
);

CREATE TABLE IF NOT EXISTS recruitment_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    unit_data JSONB NOT NULL,
    available_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_progress (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL,
    stars INTEGER DEFAULT 0,
    best_turns INTEGER,
    enemy_data JSONB DEFAULT NULL,
    cleared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clear_count INTEGER DEFAULT 0,
    PRIMARY KEY (player_id, stage_id)
);

CREATE TABLE IF NOT EXISTS player_daily_rewards (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    streak INTEGER DEFAULT 0,
    last_claim_date DATE DEFAULT NULL
);

-- =====================================================
-- SECTION 4: CHECK CONSTRAINTS
-- =====================================================

ALTER TABLE players ADD CONSTRAINT chk_players_energy CHECK (energy >= 0);
ALTER TABLE players ADD CONSTRAINT chk_players_currency CHECK (currency >= 0);
ALTER TABLE players ADD CONSTRAINT chk_players_level CHECK (level >= 1);
ALTER TABLE players ADD CONSTRAINT chk_players_max_energy CHECK (max_energy >= 1);

ALTER TABLE units ADD CONSTRAINT chk_units_level CHECK (level >= 1);
ALTER TABLE units ADD CONSTRAINT chk_units_exp CHECK (exp >= 0);

ALTER TABLE inventory ADD CONSTRAINT chk_inventory_quantity CHECK (quantity > 0);

-- Make constraints idempotent (ignore if already exists)
-- ALTER TABLE party ADD CONSTRAINT chk_party_slot CHECK (slot_index >= 0 AND slot_index <= 2);
-- ALTER TABLE recruitment_queue ADD CONSTRAINT chk_recruitment_slot CHECK (slot_index >= 0 AND slot_index <= 2);

-- =====================================================
-- SECTION 5: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_units_player_level ON units(player_id, level);
CREATE INDEX IF NOT EXISTS idx_inventory_player_type ON inventory(player_id, item_type);
CREATE INDEX IF NOT EXISTS idx_party_player ON party(player_id);
CREATE INDEX IF NOT EXISTS idx_gacha_state_player ON gacha_state(player_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_player_stage ON campaign_progress(player_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_player_daily_rewards_player ON player_daily_rewards(player_id);

-- =====================================================
-- SECTION 6: ENABLE RLS
-- =====================================================

ALTER TABLE game_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cores ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE party ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_daily_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 7: RLS POLICIES - PLAYER DATA
-- =====================================================

-- Players
CREATE POLICY "Allow authenticated players read own data" ON players
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow authenticated players create own data" ON players
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated players update own data" ON players
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated players delete own account" ON players
    FOR DELETE TO authenticated USING (auth.uid() = id);

-- Units
CREATE POLICY "Allow authenticated players read own units" ON units
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players insert own units" ON units
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update own units" ON units
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own units" ON units
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Inventory
CREATE POLICY "Allow authenticated players read own inventory" ON inventory
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players insert inventory" ON inventory
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update inventory" ON inventory
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own items" ON inventory
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Party
CREATE POLICY "Allow authenticated players read own party" ON party
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players insert party" ON party
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update party" ON party
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own party" ON party
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Recruitment Queue
CREATE POLICY "Allow authenticated players read own recruitment_queue" ON recruitment_queue
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players insert recruitment_queue" ON recruitment_queue
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update recruitment_queue" ON recruitment_queue
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own recruitment" ON recruitment_queue
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Gacha State
CREATE POLICY "Allow authenticated players read own gacha_state" ON gacha_state
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players insert gacha_state" ON gacha_state
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update gacha_state" ON gacha_state
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own gacha" ON gacha_state
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Campaign Progress
CREATE POLICY "Allow authenticated players read own campaign_progress" ON campaign_progress
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players insert campaign_progress" ON campaign_progress
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update campaign_progress" ON campaign_progress
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own campaign" ON campaign_progress
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Daily Rewards
CREATE POLICY "Allow authenticated players read own daily_rewards" ON player_daily_rewards
    FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players update own daily_rewards" ON player_daily_rewards
    FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Allow authenticated players delete own daily_rewards" ON player_daily_rewards
    FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- =====================================================
-- SECTION 8: RLS POLICIES - STATIC CONTENT
-- =====================================================

CREATE POLICY "Allow authenticated read game_configs" ON game_configs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read skills" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read cards" ON cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read weapons" ON weapons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read jobs" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read job_cores" ON job_cores FOR SELECT TO authenticated USING (true);

-- =====================================================
-- SECTION 9: GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON party TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recruitment_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON gacha_state TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON player_daily_rewards TO authenticated;
GRANT SELECT ON game_configs TO authenticated;
GRANT SELECT ON jobs TO authenticated;
GRANT SELECT ON skills TO authenticated;
GRANT SELECT ON cards TO authenticated;
GRANT SELECT ON weapons TO authenticated;
GRANT SELECT ON job_cores TO authenticated;

-- New Skill System
GRANT SELECT ON tags TO authenticated;
GRANT SELECT ON triggers TO authenticated;
GRANT SELECT ON effects TO authenticated;
GRANT SELECT ON skill_modules TO authenticated;
GRANT SELECT ON skill_module_tags TO authenticated;
GRANT SELECT ON skill_module_effects TO authenticated;
GRANT SELECT ON job_skill_modules TO authenticated;

-- RLS for new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_module_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_module_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skill_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read tags" ON tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read triggers" ON triggers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read effects" ON effects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read skill_modules" ON skill_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read skill_module_tags" ON skill_module_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read skill_module_effects" ON skill_module_effects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read job_skill_modules" ON job_skill_modules FOR SELECT TO authenticated USING (true);

-- Skill Fragments & Crafting System
GRANT SELECT ON skill_fragments TO authenticated;
GRANT SELECT ON player_skill_fragments TO authenticated;
GRANT SELECT ON player_learned_skills TO authenticated;

ALTER TABLE skill_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skill_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_learned_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read skill_fragments" ON skill_fragments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read player_skill_fragments" ON player_skill_fragments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read player_learned_skills" ON player_learned_skills FOR SELECT TO authenticated USING (true);