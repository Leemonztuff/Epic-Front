// Build Calculator - Sistema de cálculo de estadísticas finales
// Version: 2.0 - Incluye set bonuses, elementos, y todos los equipos
// Similar a sistemas de RPGs profesionales como Ragnarok/Brave Frontier

import type { UnitStats, GrowthRates } from '@/lib/types/game-types';
import type { JobDefinition } from '../rpg-system/types';

export interface DBUnit {
    id: string;
    name: string;
    level: number;
    base_stats: UnitStats;
    growth_rates: GrowthRates;
    affinity: string;
    trait?: string;
    current_job_id: string;
    unlocked_jobs: string[];
    equipped_items?: Record<string, any>;
}

export interface EquipmentPiece {
    id: string;
    name: string;
    rarity: string;
    element?: string;
    set_id?: string;
    stat_bonuses?: Partial<UnitStats>;
    special_effects?: Record<string, any>;
}

export interface SetBonus {
    setName: string;
    pieceCount: number;
    bonus: Partial<UnitStats>;
}

export interface FinalStatsResult {
    stats: UnitStats;
    equipment: {
        weapon: EquipmentPiece | null;
        armor: EquipmentPiece | null;
        accessory: EquipmentPiece | null;
        boots: EquipmentPiece | null;
        cards: EquipmentPiece[];
        skills: EquipmentPiece[];
    };
    elements: string[];
    activeSetBonus: SetBonus | null;
    totalPower: number;
}

/**
 * Calcula las estadísticas finales de una unidad incluyendo:
 * 1. Stats base + crecimiento por nivel
 * 2. Modificadores de job
 * 3. Bonificaciones de todos los equipos
 * 4. Bonificaciones de set
 * 5. Efectos de elementos
 */
export function calculateFinalStats(
    unit: DBUnit,
    jobDef: JobDefinition,
    equipmentData: {
        weapon: any | null;
        armor: any | null;
        accessory: any | null;
        boots: any | null;
        cards: any[];
        skills: any[];
    },
    setBonus: SetBonus | null = null
): FinalStatsResult {
    const defaultStats: UnitStats = { hp: 100, atk: 10, def: 10, matk: 10, mdef: 10, agi: 10 };

    const base = unit.base_stats || defaultStats;
    const growth = unit.growth_rates || { hp: 0, atk: 0, def: 0, matk: 0, mdef: 0, agi: 0 };
    const jobMods = jobDef?.stat_modifiers || { hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, agi: 1 };

    const calculateStat = (field: keyof UnitStats): number => {
        const baseVal = Number(base[field]) || defaultStats[field];
        const growthVal = Number(growth[field]) || 0;
        const jobMod = Number(jobMods[field]) || 1.0;

        // 1. Level-based Growth: Base + (Growth * (Level - 1))
        const levelBonus = growthVal * (Math.max(1, unit.level) - 1);
        const growthedBase = baseVal + levelBonus;

        // 2. Job Multiplier (Applied to level-scaled base)
        let total = growthedBase * jobMod;

        // 3. Equipment Flat Bonuses (All equipment pieces)
        const equipmentPieces = [
            equipmentData.weapon,
            equipmentData.armor,
            equipmentData.accessory,
            equipmentData.boots,
            ...equipmentData.cards
        ].filter(Boolean);

        let equipmentFlat = 0;
        equipmentPieces.forEach(piece => {
            const stats = piece.stat_bonuses || piece.stats || {};
            equipmentFlat += Number(stats[field]) || 0;
        });
        total += equipmentFlat;

        // 4. Card Multiplier Effects (percentage-based)
        let cardMultiplier = 1.0;
        equipmentData.cards.forEach(card => {
            if (card.effect_target === field || card.effectTarget === field) {
                const value = Number(card.effect_value || card.effectValue || 0);
                if (card.effect_type === 'statBoost' || card.effectType === 'statBoost') {
                    cardMultiplier += value; // e.g. 0.20 = +20%
                }
            }
        });
        total *= cardMultiplier;

        // 5. Set Bonus (flat additions)
        if (setBonus?.bonus) {
            const setBonusVal = Number(setBonus.bonus[field]) || 0;
            total += setBonusVal;
        }

        return Math.floor(Math.max(0, total));
    };

    // Collect elements from equipment (define at this scope level)
    const equipmentPieces = [
        equipmentData.weapon,
        equipmentData.armor,
        equipmentData.accessory,
        equipmentData.boots,
        ...equipmentData.cards
    ].filter(Boolean);

    const stats: UnitStats = {
        hp: calculateStat('hp'),
        atk: calculateStat('atk'),
        def: calculateStat('def'),
        matk: calculateStat('matk'),
        mdef: calculateStat('mdef'),
        agi: calculateStat('agi')
    };

    // Collect elements from equipment
    const elements: string[] = [];
    equipmentPieces.forEach(piece => {
        if (piece.element && piece.element !== 'none' && !elements.includes(piece.element)) {
            elements.push(piece.element);
        }
    });

    // Calculate total power (simple sum for now, could be more complex)
    const totalPower = 
        stats.hp + 
        stats.atk * 2 + 
        stats.def * 2 + 
        stats.matk * 2 + 
        stats.mdef * 2 + 
        stats.agi * 3;

    return {
        stats,
        equipment: {
            weapon: equipmentData.weapon,
            armor: equipmentData.armor,
            accessory: equipmentData.accessory,
            boots: equipmentData.boots,
            cards: equipmentData.cards,
            skills: equipmentData.skills,
        },
        elements,
        activeSetBonus: setBonus,
        totalPower: Math.floor(totalPower)
    };
}

/**
 * Calcula bonuses de elementos para combate
 * Retorna multiplicadores según tipo de elemento vs defensa
 */
export function calculateElementalBonus(
    attackElement: string,
    defenseElements: string[]
): number {
    // Tabla de efectividad elemental (similar a RPGs profesionales)
    const effectiveness: Record<string, Record<string, number>> = {
        fire: { water: 0.5, earth: 1.5, fire: 1.0, thunder: 1.0, light: 1.0, dark: 1.0 },
        water: { fire: 0.5, thunder: 1.5, water: 1.0, earth: 1.0, light: 1.0, dark: 1.0 },
        earth: { thunder: 0.5, fire: 1.5, earth: 1.0, water: 1.0, light: 1.0, dark: 1.0 },
        thunder: { earth: 0.5, water: 1.5, thunder: 1.0, fire: 1.0, light: 1.0, dark: 1.0 },
        light: { dark: 0.5, light: 1.0 },
        dark: { light: 0.5, dark: 1.0 },
    };

    let totalMultiplier = 1.0;
    defenseElements.forEach(defElem => {
        const multiplier = effectiveness[attackElement]?.[defElem] || 1.0;
        totalMultiplier *= multiplier;
    });

    return totalMultiplier;
}

/**
 * Formatea las bonificaciones de set para mostrar en UI
 */
export function formatSetBonusDisplay(setBonus: SetBonus | null): string {
    if (!setBonus) return '';

    const parts = [`Set: ${setBonus.setName} (${setBonus.pieceCount}p)`];
    
    if (setBonus.bonus.hp) parts.push(`+${setBonus.bonus.hp} HP`);
    if (setBonus.bonus.atk) parts.push(`+${setBonus.bonus.atk} ATK`);
    if (setBonus.bonus.def) parts.push(`+${setBonus.bonus.def} DEF`);
    if (setBonus.bonus.matk) parts.push(`+${setBonus.bonus.matk} MATK`);
    if (setBonus.bonus.mdef) parts.push(`+${setBonus.bonus.mdef} MDEF`);
    if (setBonus.bonus.agi) parts.push(`+${setBonus.bonus.agi} AGI`);

    return parts.join(' | ');
}

/**
 * Helper: Get empty equipment object
 */
export function getEmptyEquipment() {
    return {
        weapon: null,
        armor: null,
        accessory: null,
        boots: null,
        cards: [],
        skills: []
    };
}

// Legacy support - mantiene compatibilidad con código existente
export function calculateStatsLegacy(
    unit: DBUnit,
    jobDef: JobDefinition,
    equippedWeapon: any | null = null,
    equippedCards: any[] = []
): UnitStats {
    const result = calculateFinalStats(
        unit,
        jobDef,
        {
            weapon: equippedWeapon,
            armor: null,
            accessory: null,
            boots: null,
            cards: equippedCards,
            skills: []
        },
        null
    );
    return result.stats;
}