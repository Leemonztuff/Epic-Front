import { z } from 'zod';

// Esquemas de validación para tipos críticos
export const RaritySchema = z.enum(['common', 'rare', 'epic', 'legendary', 'mythic']);
export type Rarity = z.infer<typeof RaritySchema>;

export const ElementSchema = z.enum(['physical', 'magic', 'ranged', 'support']);
export type Element = z.infer<typeof ElementSchema>;

export const ItemTypeSchema = z.enum(['weapon', 'card', 'material', 'job_core']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

// Schema para UnitData
export const UnitDataSchema = z.object({
  id: z.string().uuid(),
  player_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  level: z.number().int().min(1).max(100),
  exp: z.number().int().min(0),
  base_stats: z.object({
    hp: z.number().min(0),
    atk: z.number().min(0),
    def: z.number().min(0),
    matk: z.number().min(0),
    mdef: z.number().min(0),
    agi: z.number().min(0),
  }),
  current_job_id: z.string(),
  affinity: ElementSchema,
  sprite_id: z.string().optional(),
});

// Schema para validación de API
export const GachaPullSchema = z.object({
  amount: z.number().int().min(1).max(10),
  currencyType: z.enum(['soft', 'premium']),
});

export const PlayerProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(30),
  currency: z.number().int().min(0),
  premium_currency: z.number().int().min(0),
  energy: z.number().int().min(0),
  max_energy: z.number().int().min(1),
  level: z.number().int().min(1),
  exp: z.number().int().min(0),
});

// Type guards para validación runtime
export const isValidRarity = (value: unknown): value is Rarity => {
  return RaritySchema.safeParse(value).success;
};

export const isValidUnitData = (value: unknown): value is z.infer<typeof UnitDataSchema> => {
  return UnitDataSchema.safeParse(value).success;
};

export const isValidPlayerProfile = (value: unknown): value is z.infer<typeof PlayerProfileSchema> => {
  return PlayerProfileSchema.safeParse(value).success;
};