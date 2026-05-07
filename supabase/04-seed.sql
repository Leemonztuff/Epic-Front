-- ============================================================================
-- EPIC RPG SEED - Datos iniciales del juego
-- Versión 2.0 - Sistema de equipamiento y progresión v2.0
-- ============================================================================

-- ============================================================================
-- GAME CONFIG
-- ============================================================================
INSERT INTO game_configs (version, is_active, config_data) VALUES 
('v1.0', true, '{"gameName": "Epic RPG", "maxLevel": 99, "maxJobLevel": 50}');

-- ============================================================================
-- EQUIPMENT SETS (Ragnarok/Brave Frontier style)
-- ============================================================================
INSERT INTO equipment_sets (id, version, name, description, piece_count, set_bonus_2pc, set_bonus_3pc, set_bonus_4pc, set_bonus_5pc) VALUES
-- Set Guerrero
('set_warrior', 'v1.0', 'Armadura del Guerrero', 'Set de equipamiento de guerrero veterano', 5,
'{"hp": 50, "atk": 10, "def": 5}'::jsonb,
'{"hp": 100, "atk": 20, "def": 10, "agi": 5}'::jsonb,
'{"hp": 200, "atk": 30, "def": 20, "agi": 10, "crit": 5}'::jsonb,
'{"hp": 300, "atk": 50, "def": 30, "agi": 15, "crit": 10}'::jsonb),

-- Set Mago
('set_mage', 'v1.0', 'Atuendo del Mago', 'Set de equipamiento de magoArcano', 5,
'{"hp": 30, "matk": 15, "mdef": 5}'::jsonb,
'{"hp": 60, "matk": 30, "mdef": 10, "agi": 5}'::jsonb,
'{"hp": 100, "matk": 45, "mdef": 20, "agi": 10, "crit": 3}'::jsonb,
'{"hp": 150, "matk": 60, "mdef": 30, "agi": 15, "crit": 5, "cooldown_reduce": 0.1}'::jsonb),

-- Set Arquero
('set_archer', 'v1.0', 'Equipo del Arquero', 'Set de equipamiento de arquero certero', 5,
'{"hp": 40, "atk": 15, "agi": 10}'::jsonb,
'{"hp": 80, "atk": 25, "agi": 15, "crit": 5}'::jsonb,
'{"hp": 120, "atk": 40, "agi": 25, "crit": 10, "dodge": 5}'::jsonb,
'{"hp": 180, "atk": 60, "agi": 35, "crit": 15, "dodge": 10, "atk_speed": 0.1}'::jsonb),

-- Set Sagrado
('set_holy', 'v1.0', 'Armadura Sagrada', 'Set de equipamiento sagrado', 5,
'{"hp": 60, "def": 10, "mdef": 10}'::jsonb,
'{"hp": 120, "def": 20, "mdef": 20, "agi": 5}'::jsonb,
'{"hp": 200, "def": 30, "mdef": 30, "agi": 10, "heal_bonus": 0.1}'::jsonb,
'{"hp": 300, "def": 40, "mdef": 40, "agi": 15, "heal_bonus": 0.2, "block": 10}'::jsonb),

-- Elemental Fire Set
('set_fire', 'v1.0', ' Ira del Dragón', 'Set de equipamiento de fuego', 4,
'{"atk": 20, "fire_res": 10, "fire_dmg": 0.05}'::jsonb,
'{"atk": 35, "fire_res": 20, "fire_dmg": 0.1, "crit_dmg": 0.1}'::jsonb,
'{"atk": 50, "fire_res": 30, "fire_dmg": 0.15, "crit_dmg": 0.15, "agi": 10}'::jsonb,
NULL),

-- Elemental Ice Set
('set_ice', 'v1.0', 'Frío Eterno', 'Set de equipamiento de hielo', 4,
'{"atk": 15, "mdef": 10, "water_res": 10}'::jsonb,
'{"atk": 30, "mdef": 20, "water_res": 20, "dodge": 5}'::jsonb,
'{"atk": 45, "mdef": 30, "water_res": 30, "dodge": 10, "freeze_chance": 0.1}'::jsonb,
NULL);

-- ============================================================================
-- WEAPONS (Armas con elementos y sets)
-- ============================================================================
INSERT INTO weapons (id, version, name, description, weapon_type, rarity, element, level_required, set_id, stat_bonuses, sell_price) VALUES
-- Espadas (sword)
('weapon_sword_iron', 'v1.0', 'Espada de Hierro', 'Espada básica de hierro', 'sword', 'common', 'none', 1, NULL, '{"atk": 10, "agi": 1}'::jsonb, 50),
('weapon_sword_steel', 'v1.0', 'Espada de Acero', 'Espada de acero refinado', 'sword', 'uncommon', 'none', 5, NULL, '{"atk": 25, "def": 3, "agi": 2}'::jsonb, 200),
('weapon_sword_fire', 'v1.0', 'Espada Flameante', 'Espada imbuida con fuego', 'sword', 'rare', 'fire', 15, 'set_fire', '{"atk": 45, "atk": 5, "fire_dmg": 0.1}'::jsonb, 500),
('weapon_sword_legend', 'v1.0', 'Espada del Guerrero', 'Espada legendaria del guerrero', 'sword', 'legendary', 'none', 30, 'set_warrior', '{"atk": 100, "def": 20, "agi": 10, "crit": 5}'::jsonb, 2000),

-- Hachas (axe)
('weapon_axe_iron', 'v1.0', 'Hacha de Hierro', 'Hacha básica de batalla', 'axe', 'common', 'none', 1, NULL, '{"atk": 15, "def": -2}'::jsonb, 60),
('weapon_axe_battle', 'v1.0', 'Hacha de Guerra', 'Hacha de guerra reforzada', 'axe', 'uncommon', 'none', 8, NULL, '{"atk": 35, "hp": 20}'::jsonb, 300),
('weapon_axe_legend', 'v1.0', 'Hacha del Titan', 'Hacha legendaria de poder destructor', 'axe', 'legendary', 'thunder', 35, 'set_warrior', '{"atk": 120, "hp": 50, "crit": 10}'::jsonb, 2500),

-- Arcos (bow)
('weapon_bow_wood', 'v1.0', 'Arco de Madera', 'Arco básico de caza', 'bow', 'common', 'none', 1, NULL, '{"atk": 12, "agi": 3}'::jsonb, 40),
('weapon_bow_elven', 'v1.0', 'Arco Élfico', 'Arco de los elfos', 'bow', 'rare', 'none', 20, 'set_archer', '{"atk": 60, "agi": 15, "crit": 8}'::jsonb, 800),
('weapon_bow_legend', 'v1.0', 'Arco del Cazador', 'Arco legendario del mejor cazador', 'bow', 'legendary', 'light', 40, 'set_archer', '{"atk": 110, "agi": 25, "crit": 15, "dodge": 10}'::jsonb, 3000),

-- Bastones (staff)
('weapon_staff_wood', 'v1.0', 'Bastón de Madera', 'Bastón básico de mago', 'staff', 'common', 'none', 1, NULL, '{"matk": 12, "mdef": 2}'::jsonb, 40),
('weapon_staff_crystal', 'v1.0', 'Bastón de Cristal', 'Bastón de cristal mágico', 'staff', 'rare', 'water', 18, 'set_mage', '{"matk": 55, "mdef": 15, "hp": 30}'::jsonb, 700),
('weapon_staff_legend', 'v1.0', 'Bastón del Archimago', 'Bastón legendario del archimago', 'staff', 'legendary', 'none', 45, 'set_mage', '{"matk": 120, "mdef": 40, "agi": 10, "cooldown_reduce": 0.15}'::jsonb, 3500);

-- ============================================================================
-- ARMORS (Armaduras con elementos y sets)
-- ============================================================================
INSERT INTO armors (id, version, name, description, armor_type, rarity, element, level_required, set_id, stat_bonuses, sell_price) VALUES
-- Armaduras Cuerpo (body)
('armor_leather', 'v1.0', 'Armadura de Cuero', 'Armadura básica de cuero', 'body', 'common', 'none', 1, NULL, '{"def": 5, "hp": 20}'::jsonb, 30),
('armor_chain', 'v1.0', 'Armadura de Cadena', 'Armadura de cadena protectiva', 'body', 'uncommon', 'none', 8, NULL, '{"def": 15, "hp": 40, "agi": -2}'::jsonb, 150),
('armor_plate', 'v1.0', 'Armadura de Placas', 'Armadura pesada de placas', 'body', 'rare', 'none', 20, 'set_warrior', '{"def": 35, "hp": 80, "atk": 5}'::jsonb, 500),
('armor_dragon', 'v1.0', 'Armadura de Dragón', 'Armadura legendaria de escamas de dragón', 'body', 'legendary', 'fire', 40, 'set_warrior', '{"def": 60, "hp": 150, "atk": 20, "fire_res": 20}'::jsonb, 2500),

-- Robes (robe)
('robe_cloth', 'v1.0', 'Túnica de Tela', 'Túnica básica de mago', 'robe', 'common', 'none', 1, NULL, '{"mdef": 8, "hp": 10}'::jsonb, 25),
('robe_silk', 'v1.0', 'Túnica de Seda', 'Túnica de seda encantada', 'robe', 'uncommon', 'none', 10, NULL, '{"mdef": 20, "hp": 30, "agi": 3}'::jsonb, 200),
('robe_mystic', 'v1.0', 'Túnica Mística', 'Túnica con runas antiguas', 'robe', 'rare', 'water', 22, 'set_mage', '{"mdef": 45, "hp": 60, "matk": 15}'::jsonb, 600),
('robe_arcane', 'v1.0', 'Túnica Arcana', 'Túnica legendaria del archimago', 'robe', 'legendary', 'dark', 45, 'set_mage', '{"mdef": 80, "hp": 100, "matk": 40, "crit": 5}'::jsonb, 3000),

-- Vestimenta Arquero (light)
('vest_leather', 'v1.0', 'Chaleco de Cuero', 'Vestimenta ligera de arquero', 'light', 'common', 'none', 1, NULL, '{"def": 3, "agi": 8, "hp": 15}'::jsonb, 35),
('vest_swift', 'v1.0', 'Armadura Ligera', 'Vestimenta para máxima velocidad', 'light', 'rare', 'thunder', 18, 'set_archer', '{"def": 12, "agi": 20, "hp": 40, "crit": 5}'::jsonb, 550);

-- ============================================================================
-- ACCESSORIES (Accesorios con elementos y sets)
-- ============================================================================
INSERT INTO accessories (id, version, name, description, accessory_type, rarity, element, level_required, set_id, stat_bonuses, sell_price) VALUES
-- Anillos (ring)
('ring_copper', 'v1.0', 'Anillo de Cobre', 'Anillo básico de cobre', 'ring', 'common', 'none', 1, NULL, '{"agi": 3}'::jsonb, 20),
('ring_silver', 'v1.0', 'Anillo de Plata', 'Anillo de plata encantada', 'ring', 'uncommon', 'none', 10, NULL, '{"agi": 8, "crit": 3}'::jsonb, 150),
('ring_power', 'v1.0', 'Anillo de Poder', 'Anillo que amplifica el poder', 'ring', 'rare', 'fire', 25, 'set_warrior', '{"atk": 20, "matk": 20, "agi": 5}'::jsonb, 600),
('ring_fate', 'v1.0', 'Anillo del Destino', 'Anillo legendario del destino', 'ring', 'legendary', 'light', 50, 'set_holy', '{"atk": 30, "matk": 30, "crit": 15, "dodge": 10}'::jsonb, 3000),

-- Collares (necklace)
('necklace_copper', 'v1.0', 'Collar de Cobre', 'Collar básico protector', 'necklace', 'common', 'none', 1, NULL, '{"hp": 20, "def": 2}'::jsonb, 25),
('necklace_protection', 'v1.0', 'Collar de Protección', 'Collar con escudo mágico', 'necklace', 'uncommon', 'none', 12, NULL, '{"hp": 50, "mdef": 10}'::jsonb, 200),
('necklace_vitality', 'v1.0', 'Collar de Vitalidad', 'Collar de energía vital', 'necklace', 'rare', 'water', 28, 'set_holy', '{"hp": 100, "def": 15, "mdef": 15}'::jsonb, 800),
('necklace_divine', 'v1.0', 'Collar Divino', 'Collar legendario bendecido', 'necklace', 'legendary', 'light', 48, 'set_holy', '{"hp": 150, "def": 25, "mdef": 25, "heal_bonus": 0.15}'::jsonb, 3500),

-- Amuletos (amulet)
('amulet_charm', 'v1.0', 'Amuleto Simple', 'Amuleto de buena suerte', 'amulet', 'common', 'none', 1, NULL, '{"dodge": 3}'::jsonb, 30),
('amulet_shadow', 'v1.0', 'Amuleto de Sombra', 'Amuleto del reino oscuro', 'amulet', 'rare', 'dark', 30, 'set_mage', '{"dodge": 15, "crit": 10, "agi": 10}'::jsonb, 700);

-- ============================================================================
-- BOOTS (Botas con elementos y sets)
-- ============================================================================
INSERT INTO boots (id, version, name, description, boot_type, rarity, element, level_required, set_id, stat_bonuses, sell_price) VALUES
-- Botas Ligeras (light)
('boots_leather', 'v1.0', 'Botas de Cuero', 'Botas básicas de cuero', 'light', 'common', 'none', 1, NULL, '{"agi": 5, "hp": 10}'::jsonb, 25),
('boots_swift', 'v1.0', 'Botas de Velocidad', 'Botas que aumentan la velocidad', 'light', 'uncommon', 'thunder', 12, NULL, '{"agi": 15, "dodge": 5}'::jsonb, 200),
('boots_wind', 'v1.0', 'Botas del Viento', 'Botas que causan viento cortante', 'light', 'rare', 'thunder', 25, 'set_archer', '{"agi": 25, "dodge": 10, "atk": 10}'::jsonb, 600),

-- Botas Pesadas (heavy)
('boots_iron', 'v1.0', 'Botas de Hierro', 'Botas básicas pesadas', 'heavy', 'common', 'none', 1, NULL, '{"def": 5, "hp": 15}'::jsonb, 30),
('boots_steel', 'v1.0', 'Botas de Acero', 'Botas de acero protectoras', 'heavy', 'uncommon', 'none', 15, NULL, '{"def": 12, "hp": 40, "agi": -3}'::jsonb, 250),
('boots_titan', 'v1.0', 'Botas del Titan', 'Botas legendarias de poder', 'heavy', 'legendary', 'earth', 42, 'set_warrior', '{"def": 30, "hp": 100, "agi": 5, "block": 10}'::jsonb, 2000),

-- Botas Mágicas (magic)
('boots_magic', 'v1.0', 'Botas Mágicas', 'Botas básicas mágicas', 'magic', 'common', 'none', 1, NULL, '{"mdef": 5, "agi": 3}'::jsonb, 30),
('boots_enchanted', 'v1.0', 'Botas Encantadas', 'Botas con encantamiento', 'magic', 'rare', 'water', 22, 'set_mage', '{"mdef": 20, "agi": 10, "hp": 30}'::jsonb, 550);

-- ============================================================================
-- POTENTIALS (Sistema de progresión v2.0)
-- ============================================================================
INSERT INTO potentials (id, version, name, description, potential_type, requirement_type, requirement_value, stat_bonus, rarity, is_default) VALUES
-- Potentials por nivel de unidad
('pot_hp_10', 'v1.0', 'Vitalidad I', 'Aumenta HP al nivel 10', 'stat_boost', 'level', 10, '{"hp": 50}'::jsonb, 'common', false),
('pot_atk_10', 'v1.0', 'Fuerza I', 'Aumenta ATK al nivel 10', 'stat_boost', 'level', 10, '{"atk": 5}'::jsonb, 'common', false),
('pot_def_10', 'v1.0', 'Defensa I', 'Aumenta DEF al nivel 10', 'stat_boost', 'level', 10, '{"def": 3}'::jsonb, 'common', false),
('pot_hp_25', 'v1.0', 'Vitalidad II', 'Aumenta HP al nivel 25', 'stat_boost', 'level', 25, '{"hp": 100}'::jsonb, 'rare', false),
('pot_atk_25', 'v1.0', 'Fuerza II', 'Aumenta ATK al nivel 25', 'stat_boost', 'level', 25, '{"atk": 15}'::jsonb, 'rare', false),
('pot_def_25', 'v1.0', 'Defensa II', 'Aumenta DEF al nivel 25', 'stat_boost', 'level', 25, '{"def": 10}'::jsonb, 'rare', false),
('pot_hp_50', 'v1.0', 'Vitalidad III', 'Aumenta HP al nivel 50', 'stat_boost', 'level', 50, '{"hp": 250}'::jsonb, 'epic', false),
('pot_atk_50', 'v1.0', 'Fuerza III', 'Aumenta ATK al nivel 50', 'stat_boost', 'level', 50, '{"atk": 30}'::jsonb, 'epic', false),
('pot_full_99', 'v1.0', 'Potencial Supremo', 'Stats máximos al nivel 99', 'stat_boost', 'level', 99, '{"hp": 500, "atk": 50, "def": 30, "agi": 20}'::jsonb, 'legendary', false),

-- Potentials por job level
('pot_job_hp_20', 'v1.0', 'Maestría Vital I', 'Aumenta HP al job level 20', 'stat_boost', 'job_level', 20, '{"hp": 30}'::jsonb, 'common', false),
('pot_job_atk_30', 'v1.0', 'Maestría de Ataque I', 'Aumenta ATK al job level 30', 'stat_boost', 'job_level', 30, '{"atk": 10}'::jsonb, 'rare', false),
('pot_job_full_50', 'v1.0', 'Maestría Total', 'Stats completos al job level 50', 'stat_boost', 'job_level', 50, '{"hp": 100, "atk": 25, "def": 15, "agi": 10}'::jsonb, 'legendary', false),

-- Potentials por transcendence
('pot_trans_1', 'v1.0', 'Despertar I', 'Primer despertar - +10% stats', 'special', 'transcendence', 1, '{"hp": 0, "atk": 0, "def": 0, "agi": 0}'::jsonb, 'epic', false),
('pot_trans_3', 'v1.0', 'Despertar II', 'Segundo despertar - +20% stats', 'special', 'transcendence', 3, '{"hp": 0, "atk": 0, "def": 0, "agi": 0}'::jsonb, 'legendary', false),
('pot_trans_5', 'v1.0', 'Despertar Supremo', 'Despertar máximo - +50% stats', 'special', 'transcendence', 5, '{"hp": 0, "atk": 0, "def": 0, "agi": 0}'::jsonb, 'mythic', false),

-- Potentials por defecto para todas las unidades
('pot_default_hp', 'v1.0', 'Constitución', 'Constitución básica +HP', 'stat_boost', 'level', 1, '{"hp": 10}'::jsonb, 'common', true),
('pot_default_atk', 'v1.0', 'Iniciativa', 'Iniciativa básica +ATK', 'stat_boost', 'level', 1, '{"atk": 2}'::jsonb, 'common', true);

-- ============================================================================
-- JOBS (Actualizados con skill_tree y sistema v2.0)
-- ============================================================================
-- Jobs Base
INSERT INTO jobs (id, version, name, display_name, description, tier, job_type, parent_job_id, is_transcendence, stat_modifiers, bonus_stats_at_max, allowed_weapons, recommended_affinity, max_job_level, skill_points_per_level, skills_unlocked, passive_effects, evolution_requirements, alternative_jobs, transcendence_requirement) VALUES
('novice', 'v1.0', 'Novato', 'Novato', 'Clase inicial de todo guerrero', 1, 'hybrid', NULL, false, 
'{"hp": 1.0, "atk": 1.0, "def": 1.0, "matk": 1.0, "mdef": 1.0, "agi": 1.0}'::jsonb,
'{"hp": 0, "atk": 0, "def": 0, "agi": 0}'::jsonb,
ARRAY['sword', 'axe', 'bow', 'staff', 'dagger'],
'physical',
50, 1,
'["Ataque Básico", "Defensa Básica"]'::jsonb,
ARRAY[]::text[],
'{"minLevel": 10, "materials": [], "currencyCost": 100}'::jsonb,
ARRAY['swordman', 'mage', 'archer', 'priest'],
NULL),

-- Jobs Tier 2
('swordman', 'v1.0', 'Espadachín', 'Espadachín', 'Guerrero especializado en espadas', 2, 'physical', 'novice', false,
'{"hp": 1.2, "atk": 1.2, "def": 1.1, "matk": 0.9, "mdef": 0.9, "agi": 1.0}'::jsonb,
'{"hp": 100, "atk": 15, "def": 10, "agi": 5}'::jsonb,
ARRAY['sword', 'axe'],
'physical',
50, 1,
'["Corte", "Parada", "Furia"]'::jsonb,
ARRAY['pasive_atk_up'],
'{"minLevel": 15, "materials": [{"itemId": "mat_iron", "amount": 10}], "currencyCost": 500}'::jsonb,
ARRAY['knight', 'berserker'],
NULL),

('mage', 'v1.0', 'Mago', 'Mago', 'Usuario de magia arcana', 2, 'magic', 'novice', false,
'{"hp": 0.9, "atk": 0.9, "def": 0.9, "matk": 1.3, "mdef": 1.2, "agi": 1.0}'::jsonb,
'{"hp": 50, "matk": 25, "mdef": 15, "agi": 5}'::jsonb,
ARRAY['staff', 'wand'],
'magic',
50, 1,
'["Bola de Fuego", "Escudo Mágico", "Meditación"]'::jsonb,
ARRAY['passive_matk_up'],
'{"minLevel": 15, "materials": [{"itemId": "mat_crystal", "amount": 10}], "currencyCost": 500}'::jsonb,
ARRAY['wizard', 'warlock'],
NULL),

('archer', 'v1.0', 'Arquero', 'Arquero', 'Experto en combate a distancia', 2, 'ranged', 'novice', false,
'{"hp": 1.0, "atk": 1.2, "def": 0.9, "matk": 0.9, "mdef": 0.9, "agi": 1.3}'::jsonb,
'{"hp": 60, "atk": 20, "agi": 15, "crit": 5}'::jsonb,
ARRAY['bow', 'crossbow'],
'ranged',
50, 1,
'["Disparo Preciso", "Flecha Envolvente", "Tiro Rápido"]'::jsonb,
ARRAY['passive_crit_up'],
'{"minLevel": 15, "materials": [{"itemId": "mat_wood", "amount": 10}], "currencyCost": 500}'::jsonb,
ARRAY['ranger', 'hunter'],
NULL),

('priest', 'v1.0', 'Sacerdote', 'Sacerdote', 'Sanador y protector sagrado', 2, 'support', 'novice', false,
'{"hp": 1.1, "atk": 0.8, "def": 1.1, "matk": 1.1, "mdef": 1.2, "agi": 1.0}'::jsonb,
'{"hp": 80, "mdef": 20, "heal_power": 15}'::jsonb,
ARRAY['staff', 'mace'],
'support',
50, 1,
'["Sanación", "Protección Divina", "Luz Sagrada"]'::jsonb,
ARRAY['passive_heal_up'],
'{"minLevel": 15, "materials": [{"itemId": "mat_herb", "amount": 10}], "currencyCost": 500}'::jsonb,
ARRAY['cleric', 'monk'],
NULL),

-- Jobs Tier 3 (Evoluciones)
('knight', 'v1.0', 'Caballero', 'Caballero', 'Guerrero blindado con espadas', 3, 'physical', 'swordman', false,
'{"hp": 1.4, "atk": 1.3, "def": 1.5, "matk": 0.8, "mdef": 1.0, "agi": 0.9}'::jsonb,
'{"hp": 200, "atk": 25, "def": 30, "agi": 10, "block": 15}'::jsonb,
ARRAY['sword'],
'physical',
50, 2,
'["Escudo Divino", "Carga de Caballería", "Defensa Total"]'::jsonb,
ARRAY['passive_def_up', 'passive_block_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_gold", "amount": 5}], "currencyCost": 2000}'::jsonb,
NULL,
NULL),

('berserker', 'v1.0', 'Berserker', 'Berserker', 'Guerrero furioso de combate', 3, 'physical', 'swordman', false,
'{"hp": 1.3, "atk": 1.6, "def": 0.8, "matk": 0.8, "mdef": 0.8, "agi": 1.2}'::jsonb,
'{"hp": 150, "atk": 40, "def": 10, "agi": 15, "crit": 15}'::jsonb,
ARRAY['axe', 'sword'],
'physical',
50, 2,
'["Furia Salvaje", "Corte Giratorio", "Golpe Demencial"]'::jsonb,
ARRAY['passive_atk_up', 'passive_crit_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_dragon_scale", "amount": 3}], "currencyCost": 2500}'::jsonb,
NULL,
NULL),

('wizard', 'v1.0', 'Mago', 'Mago', 'Maestro del fuego y hielo', 3, 'magic', 'mage', false,
'{"hp": 0.8, "atk": 0.8, "def": 0.8, "matk": 1.6, "mdef": 1.4, "agi": 1.1}'::jsonb,
'{"hp": 80, "matk": 50, "mdef": 30, "agi": 15}'::jsonb,
ARRAY['staff', 'wand'],
'magic',
50, 2,
'["Meteorito", "Tormenta de Hielo", "Portales"]'::jsonb,
ARRAY['passive_matk_up', 'passive_mdef_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_crystal", "amount": 10}], "currencyCost": 2000}'::jsonb,
NULL,
NULL),

('wizard_dark', 'v1.0', 'Brujo', 'Brujo', 'Usuario de magia oscura', 3, 'magic', 'mage', false,
'{"hp": 0.9, "atk": 1.0, "def": 0.9, "matk": 1.5, "mdef": 1.3, "agi": 1.0}'::jsonb,
'{"hp": 70, "matk": 45, "mdef": 25, "crit": 10}'::jsonb,
ARRAY['staff', 'wand'],
'magic',
50, 2,
'["Rayo Negro", "Canalizar Alma", "召唤"]'::jsonb,
ARRAY['passive_matk_up', 'passive_crit_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_void_essence", "amount": 2}], "currencyCost": 3000}'::jsonb,
NULL,
NULL),

('ranger', 'v1.0', 'Cazador', 'Cazador', 'Maestro del arco', 3, 'ranged', 'archer', false,
'{"hp": 1.1, "atk": 1.4, "def": 1.0, "matk": 0.9, "mdef": 0.9, "agi": 1.5}'::jsonb,
'{"hp": 100, "atk": 35, "agi": 25, "crit": 12, "dodge": 10}'::jsonb,
ARRAY['bow'],
'ranged',
50, 2,
'["Lluvia de Flechas", "Trampa de Pinchos", "Disparo Mortal"]'::jsonb,
ARRAY['passive_crit_up', 'passive_dodge_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_wood", "amount": 15}], "currencyCost": 2000}'::jsonb,
NULL,
NULL),

('ranger_beast', 'v1.0', 'Bestia', 'Domador de Bestias', 'Cazador con compañero beast', 3, 'ranged', 'archer', false,
'{"hp": 1.2, "atk": 1.3, "def": 1.1, "matk": 0.9, "mdef": 1.0, "agi": 1.3}'::jsonb,
'{"hp": 120, "atk": 30, "agi": 20, "crit": 8}'::jsonb,
ARRAY['bow', 'dagger'],
'ranged',
50, 2,
'["Llamada de Bestia", "Embestida Salvaje", "Instinto Salvaje"]'::jsonb,
ARRAY['passive_atk_up', 'passive_hp_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_herb", "amount": 10}], "currencyCost": 1800}'::jsonb,
NULL,
NULL),

('cleric', 'v1.0', 'Clérigo', 'Clérigo', 'Sacerdote guerrero sagrado', 3, 'support', 'priest', false,
'{"hp": 1.3, "atk": 0.9, "def": 1.3, "matk": 1.2, "mdef": 1.5, "agi": 0.9}'::jsonb,
'{"hp": 150, "def": 25, "mdef": 35, "heal_power": 20}'::jsonb,
ARRAY['staff', 'mace'],
'support',
50, 2,
'["Santa Explisión", "Resurrección", "Arma Sagrada"]'::jsonb,
ARRAY['passive_heal_up', 'passive_mdef_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_phoenix_feather", "amount": 1}], "currencyCost": 2500}'::jsonb,
NULL,
NULL),

('monk', 'v1.0', 'Monje', 'Monje', 'Arte marcial espiritual', 3, 'support', 'priest', false,
'{"hp": 1.4, "atk": 1.2, "def": 1.2, "matk": 1.0, "mdef": 1.2, "agi": 1.3}'::jsonb,
'{"hp": 180, "atk": 25, "def": 20, "agi": 20, "crit": 10}'::jsonb,
ARRAY['fist', 'staff'],
'physical',
50, 2,
'["Patada Voladora", "Puño de Energia", "Estado de Zen"]'::jsonb,
ARRAY['passive_atk_up', 'passive_agi_up'],
'{"minLevel": 30, "materials": [{"itemId": "mat_gold", "amount": 5}], "currencyCost": 2000}'::jsonb,
NULL,
NULL);

-- ============================================================================
-- MATERIALS (Materiales de evolución)
-- ============================================================================
INSERT INTO materials (id, version, name, rarity, description) VALUES
('mat_iron', 'v1.0', 'Mineral de Hierro', 'common', 'Mineral básico para forjar equipo'),
('mat_crystal', 'v1.0', 'Cristal Mágico', 'common', 'Cristal con energía mágica'),
('mat_wood', 'v1.0', 'Madera Premium', 'common', 'Madera de alta calidad'),
('mat_herb', 'v1.0', 'Hierba Curativa', 'common', 'Hierba con propiedades curativas'),
('mat_gold', 'v1.0', 'Lingote de Oro', 'rare', 'Oro refinado para equipos premium'),
('mat_dragon_scale', 'v1.0', 'Escama de Dragón', 'epic', 'Escama de dragón legendaria'),
('mat_phoenix_feather', 'v1.0', 'Pluma de Fénix', 'legendary', 'Pluma del ave inmortal'),
('mat_void_essence', 'v1.0', 'Esencia del Vacío', 'mythic', 'Esencia del vacío primordial');

-- ============================================================================
-- JOB CORES (Núcleos de job para evolución)
-- ============================================================================
INSERT INTO job_cores (id, version, name, rarity, unlocks_job_id) VALUES
('core_knight', 'v1.0', 'Corona del Caballero', 'rare', 'knight'),
('core_berserker', 'v1.0', 'Colmillo del Berserker', 'rare', 'berserker'),
('core_wizard', 'v1.0', 'Báculo del Mago', 'rare', 'wizard'),
('core_warlock', 'v1.0', 'Grimorio Prohibido', 'rare', 'warlock'),
('core_ranger', 'v1.0', 'Arco del Explorador', 'rare', 'ranger'),
('core_hunter', 'v1.0', 'Trampa Bestial', 'rare', 'hunter'),
('core_cleric', 'v1.0', 'Biblia Sagrada', 'rare', 'cleric'),
('core_monk', 'v1.0', 'Cinturón Monástico', 'rare', 'monk');

-- ============================================================================
-- CARDS (Cartas de buff)
-- ============================================================================
INSERT INTO cards (id, version, name, rarity, effect_type, effect_value, applicable_jobs) VALUES
('card_power_up', 'v1.0', 'Poder Oscuro', 'uncommon', 'statBoost', '{"atk": 0.15}'::jsonb, ARRAY['swordman', 'berserker']),
('card_light_heal', 'v1.0', 'Luz Sanadora', 'uncommon', 'statBoost', '{"hp": 0.1, "mdef": 0.1}'::jsonb, ARRAY['priest', 'cleric']),
('card_fire_burst', 'v1.0', 'Explosión de Fuego', 'rare', 'statBoost', '{"atk": 0.25, "matk": 0.1}'::jsonb, ARRAY['mage', 'wizard']),
('card_ice_shield', 'v1.0', 'Escudo de Hielo', 'rare', 'statBoost', '{"def": 0.15, "mdef": 0.15}'::jsonb, ARRAY['mage', 'warlock']),
('card_swift_arrow', 'v1.0', 'Flecha Veloz', 'rare', 'statBoost', '{"atk": 0.2, "agi": 0.15}'::jsonb, ARRAY['archer', 'ranger']),
('card_divine_blessing', 'v1.0', 'Bendición Divina', 'epic', 'statBoost', '{"hp": 0.2, "atk": 0.15, "def": 0.1, "mdef": 0.1}'::jsonb, ARRAY['priest', 'cleric', 'monk']),
('card_dragon_wrath', 'v1.0', 'Ira del Dragón', 'legendary', 'statBoost', '{"atk": 0.4, "crit": 0.1}'::jsonb, ARRAY['swordman', 'berserker', 'knight']);

-- ============================================================================
-- SKILLS (Habilidades)
-- ============================================================================
INSERT INTO skills (id, version, name, description, cooldown, effect, scaling, rarity) VALUES
('skill_basic_attack', 'v1.0', 'Ataque Básico', 'Ataque estándar', 0, '{"type": "damage", "power": 1.0}'::jsonb, '{"stat": "atk"}'::jsonb, 'common'),
('skill_fireball', 'v1.0', 'Bola de Fuego', 'Proyectil de fuego', 3, '{"type": "damage", "power": 1.5, "element": "fire"}'::jsonb, '{"stat": "matk"}'::jsonb, 'common'),
('skill_heal', 'v1.0', 'Sanación', 'Restaura HP', 4, '{"type": "heal", "power": 1.0}'::jsonb, '{"stat": "mdef"}'::jsonb, 'common'),
('skill_double_strike', 'v1.0', 'Doble Golpe', 'Dos ataques rápidos', 2, '{"type": "damage", "power": 0.8, "hits": 2}'::jsonb, '{"stat": "atk"}'::jsonb, 'uncommon'),
('skill_thunder_strike', 'v1.0', 'Golpe de Trueno', 'Attack with thunder', 3, '{"type": "damage", "power": 2.0, "element": "thunder"}'::jsonb, '{"stat": "atk"}'::jsonb, 'rare'),
('skill_divine_wrath', 'v1.0', 'Ira Divina', 'Ataque sagrado masivo', 5, '{"type": "damage", "power": 3.0, "element": "light"}'::jsonb, '{"stat": "matk"}'::jsonb, 'legendary');

-- ============================================================================
-- SKILL FRAGMENTS (Fragmentos para crafting)
-- ============================================================================
INSERT INTO skill_fragments (id, version, name, description, piece_count, rarity) VALUES
('frag_fireball', 'v1.0', 'Fragmento de Bola de Fuego', 'Fragmento para craftear Bola de Fuego', 5, 'common'),
('frag_heal', 'v1.0', 'Fragmento de Sanación', 'Fragmento para craftear Sanación', 5, 'common'),
('frag_thunder', 'v1.0', 'Fragmento de Trueno', 'Fragmento para Golpe de Trueno', 3, 'rare'),
('frag_divine', 'v1.0', 'Fragmento Divino', 'Fragmento para Ira Divina', 5, 'legendary');

-- ============================================================================
-- INIT PLAYER DATA
-- ============================================================================
-- Add starter items
-- El RPC rpc_add_starter_inventory se encarga de esto

SELECT 'Seed completado exitosamente' as result;