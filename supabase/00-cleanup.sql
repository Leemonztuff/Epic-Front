-- =====================================================
-- EPIC FRONT - CLEANUP SCRIPT v2.0
-- Full database reset for fresh install
-- =====================================================
-- WARNING: This will delete ALL data, tables, and functions
-- Execute this FIRST before running any other SQL files
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: DROP ALL TABLES (in reverse dependency order)
-- =====================================================

-- Player progression systems
DROP TABLE IF EXISTS player_daily_rewards CASCADE;
DROP TABLE IF EXISTS gacha_state CASCADE;
DROP TABLE IF EXISTS campaign_progress CASCADE;
DROP TABLE IF EXISTS recruitment_queue CASCADE;
DROP TABLE IF EXISTS party CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;

-- Player data
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Skill systems
DROP TABLE IF EXISTS player_learned_skills CASCADE;
DROP TABLE IF EXISTS player_skill_fragments CASCADE;
DROP TABLE IF EXISTS job_skill_modules CASCADE;
DROP TABLE IF EXISTS skill_module_effects CASCADE;
DROP TABLE IF EXISTS skill_module_tags CASCADE;
DROP TABLE IF EXISTS skill_modules CASCADE;

-- Effects/triggers system
DROP TABLE IF EXISTS effects CASCADE;
DROP TABLE IF EXISTS triggers CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Equipment v2.0
DROP TABLE IF EXISTS boots CASCADE;
DROP TABLE IF EXISTS accessories CASCADE;
DROP TABLE IF EXISTS armors CASCADE;
DROP TABLE IF EXISTS equipment_sets CASCADE;

-- Progression v2.0
DROP TABLE IF EXISTS job_skill_trees CASCADE;
DROP TABLE IF EXISTS potentials CASCADE;

-- Static content
DROP TABLE IF EXISTS job_cores CASCADE;
DROP TABLE IF EXISTS weapons CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS skill_fragments CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS game_configs CASCADE;

-- =====================================================
-- SECTION 2: DROP ALL FUNCTIONS (RPCs)
-- =====================================================

-- Core player functions
DROP FUNCTION IF EXISTS rpc_initialize_player(TEXT, JSONB[]) CASCADE;
DROP FUNCTION IF EXISTS rpc_add_starter_inventory() CASCADE;
DROP FUNCTION IF EXISTS rpc_add_currency(BIGINT, INTEGER) CASCADE;

-- Gacha system
DROP FUNCTION IF EXISTS rpc_pull_gacha(INTEGER, TEXT) CASCADE;

-- Unit system
DROP FUNCTION IF EXISTS rpc_evolve_unit(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS rpc_train_unit(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_award_unit_exp(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_learn_skill(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS rpc_equip_skill(UUID, UUID) CASCADE;

-- Energy system
DROP FUNCTION IF EXISTS rpc_regen_energy() CASCADE;
DROP FUNCTION IF EXISTS rpc_deduct_energy(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_refill_energy_with_gems(INTEGER) CASCADE;

-- Campaign system
DROP FUNCTION IF EXISTS rpc_complete_stage(TEXT, INTEGER, INTEGER, JSONB) CASCADE;

-- Daily rewards
DROP FUNCTION IF EXISTS rpc_claim_daily_reward(INTEGER, INTEGER, INTEGER) CASCADE;

-- Progression v2.0
DROP FUNCTION IF EXISTS rpc_add_player_exp(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_add_unit_exp(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_invest_skill_point(UUID, TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_transcend_unit(UUID) CASCADE;
DROP FUNCTION IF EXISTS rpc_unlock_potential(UUID, TEXT) CASCADE;

-- Skill crafting
DROP FUNCTION IF EXISTS rpc_craft_skill(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS rpc_add_skill_fragment(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS rpc_get_player_fragments(UUID) CASCADE;
DROP FUNCTION IF EXISTS rpc_get_player_learned_skills(UUID) CASCADE;

-- =====================================================
-- SECTION 3: VERIFICATION (optional)
-- =====================================================

COMMIT;

-- Verify cleanup - should return 0 tables
SELECT
    'Tables remaining:' AS check,
    COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verify no functions remain
SELECT
    'Functions remaining:' AS check,
    COUNT(*) AS count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;

SELECT '✅ Database reset complete - ready for fresh install!' AS status;