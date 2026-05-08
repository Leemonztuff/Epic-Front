-- ============================================================================
-- SEED MINIMAL - Datos mínimos para que el juego funcione
-- ============================================================================

-- GAME CONFIG
INSERT INTO game_configs (version, is_active, config_data) VALUES 
('v1.0', true, '{"gameName": "Epic RPG", "maxLevel": 99, "maxJobLevel": 50}')
ON CONFLICT (version) DO NOTHING;

-- EQUIPMENT SETS
INSERT INTO equipment_sets (id, version, name, description, piece_count, set_bonus_2pc, set_bonus_3pc, set_bonus_4pc, set_bonus_5pc) VALUES
('set_warrior', 'v1.0', 'Armadura del Guerrero', 'Set de equipamiento', 5,
'{"hp": 50, "atk": 10, "def": 5}'::jsonb,
'{"hp": 100, "atk": 20, "def": 10, "agi": 5}'::jsonb, NULL, NULL),
('set_mage', 'v1.0', 'Atuendo del Mago', 'Set de mago', 5,
'{"hp": 30, "matk": 15, "mdef": 5}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- WEAPONS
INSERT INTO weapons (id, version, name, description, weapon_type, rarity, element, level_required, stat_bonuses, sell_price) VALUES
('weapon_sword', 'v1.0', 'Espada de Hierro', 'Espada básica', 'sword', 'common', 'none', 1, '{"atk": 10, "agi": 1}'::jsonb, 50),
('weapon_staff', 'v1.0', 'Bastón Básico', 'Bastón para principiantes', 'staff', 'common', 'none', 1, '{"matk": 10}'::jsonb, 50),
('weapon_bow', 'v1.0', 'Arco de Madera', 'Arco básico', 'bow', 'common', 'none', 1, '{"atk": 12, "agi": 3}'::jsonb, 40)
ON CONFLICT (id) DO NOTHING;

-- ARMORS
INSERT INTO armors (id, version, name, description, armor_type, rarity, element, level_required, stat_bonuses, sell_price) VALUES
('armor_cloth', 'v1.0', 'Túnica de Tela', 'Túnica básica', 'clothing', 'common', 'none', 1, '{"def": 3, "hp": 10}'::jsonb, 30),
('armor_leather', 'v1.0', 'Armadura de Cuero', 'Cuero reforzado', 'light', 'common', 'none', 3, '{"def": 8, "hp": 25}'::jsonb, 100)
ON CONFLICT (id) DO NOTHING;

-- ACCESSORIES
INSERT INTO accessories (id, version, name, description, accessory_type, rarity, level_required, stat_bonuses, sell_price) VALUES
('accessory_ring_power', 'v1.0', 'Anillo de Fuerza', 'Aumenta poder', 'ring', 'common', 1, '{"atk": 5}'::jsonb, 75),
('accessory_amulet_health', 'v1.0', 'Amuleto de Vida', 'Aumenta HP', 'necklace', 'common', 1, '{"hp": 30}'::jsonb, 100)
ON CONFLICT (id) DO NOTHING;

-- BOOTS
INSERT INTO boots (id, version, name, description, boot_type, rarity, level_required, stat_bonuses, sell_price) VALUES
('boots_leather', 'v1.0', 'Botas de Cuero', 'Botas básicas', 'light', 'common', 1, '{"agi": 3, "hp": 10}'::jsonb, 50)
ON CONFLICT (id) DO NOTHING;

-- MATERIALS (rarity: common, rare, epic, legendary, mythic)
INSERT INTO materials (id, version, name, rarity, description) VALUES
('material_herb', 'v1.0', 'Hierba Medicinal', 'common', 'Hierba para pociones'),
('material_ore', 'v1.0', 'Mineral de Hierro', 'common', 'Minero para forja'),
('material_wood', 'v1.0', 'Madera', 'common', 'Madera para crafting'),
('material_crystal', 'v1.0', 'Cristal Mágico', 'rare', 'Cristal con energía')
ON CONFLICT (id) DO NOTHING;

-- CARDS
INSERT INTO cards (id, version, name, rarity, effect_type, effect_value, applicable_jobs) VALUES
('card_light_heal', 'v1.0', 'Card Curación', 'common', 'heal', '{"hp": 50}'::jsonb, ARRAY['acolyte', 'priest']),
('card_power_up', 'v1.0', 'Card Potenciar', 'rare', 'buff', '{"atk": 0.2}'::jsonb, ARRAY['swordman', 'knight']),
('card_ice_shield', 'v1.0', 'Card Escudo de Hielo', 'epic', 'defense', '{"mdef": 30}'::jsonb, ARRAY['mage'])
ON CONFLICT (id) DO NOTHING;

-- SKILLS
INSERT INTO skills (id, version, name, description, cooldown, effect, rarity) VALUES
('skill_basic_attack', 'v1.0', 'Ataque Básico', 'Ataque estándar', 0, '{"type": "damage", "base": 1.0}'::jsonb, 'common'),
('skill_light_heal', 'v1.0', 'Curación Ligera', 'Restaura vida', 3, '{"type": "heal", "base": 0.5}'::jsonb, 'common'),
('skill_power_up', 'v1.0', 'Potenciar', 'Aumenta ataque', 5, '{"type": "buff", "stat": "atk", "value": 0.2}'::jsonb, 'rare'),
('skill_fire_ball', 'v1.0', 'Bola de Fuego', 'Ataque de fuego', 4, '{"type": "damage", "element": "fire", "base": 1.5}'::jsonb, 'rare')
ON CONFLICT (id) DO NOTHING;

-- JOBS
INSERT INTO jobs (id, version, name, display_name, description, tier, job_type, stat_modifiers, allowed_weapons, evolution_requirements) VALUES
('novice', 'v1.0', 'Novato', 'Novato', 'Clase inicial', 1, 'hybrid', '{"hp": 100, "atk": 10, "def": 5, "agi": 5, "int": 10}'::jsonb, ARRAY['sword', 'staff', 'bow'], '{"next_jobs": ["swordman", "mage", "acolyte"]}'::jsonb),
('swordman', 'v1.0', 'Espadachín', 'Espadachín', 'Guerrero con espada', 2, 'physical', '{"hp": 150, "atk": 20, "def": 10}'::jsonb, ARRAY['sword', 'axe'], '{"next_jobs": ["knight"]}'::jsonb),
('mage', 'v1.0', 'Mago', 'Mago', 'Usuario de magia', 2, 'magic', '{"hp": 80, "matk": 25, "mdef": 8}'::jsonb, ARRAY['staff'], '{"next_jobs": ["wizard"]}'::jsonb),
('acolyte', 'v1.0', 'Acólito', 'Acólito', 'Aprendiz sagrado', 2, 'support', '{"hp": 90, "matk": 15, "mdef": 12}'::jsonb, ARRAY['staff'], '{"next_jobs": ["priest"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- JOB CORES (usa unlocks_job_id, no job_id)
INSERT INTO job_cores (id, version, name, unlocks_job_id, rarity) VALUES
('core_swordman', 'v1.0', 'Núcleo Espadachín', 'swordman', 'common'),
('core_mage', 'v1.0', 'Núcleo Mago', 'mage', 'common')
ON CONFLICT (id) DO NOTHING;

-- Verificar resultado
SELECT 'game_configs' as tbl, COUNT(*) as cnt FROM game_configs
UNION ALL SELECT 'weapons', COUNT(*) FROM weapons
UNION ALL SELECT 'armors', COUNT(*) FROM armors
UNION ALL SELECT 'cards', COUNT(*) FROM cards
UNION ALL SELECT 'skills', COUNT(*) FROM skills
UNION ALL SELECT 'materials', COUNT(*) FROM materials
UNION ALL SELECT 'jobs', COUNT(*) FROM jobs;