import { z } from 'zod';
import type { ColorName } from '../types/core';

// --- Core Schemas ---

export const ColorNameSchema = z.enum([
  'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'
]);

export const BlockSchema = z.object({
  color: ColorNameSchema,
  isFilled: z.boolean(),
  customAttribute: z.string().optional(),
});

export const TileAnimationSchema = z.object({
  id: z.string(),
  type: z.enum([
    'row-cw', 'row-double', 'row-triple', 'row-quad', 
    'column-ccw', 'column-double', 'column-triple', 'column-quad', 
    'full-board-columns', 'full-board-rows'
  ]),
  startTime: z.number(),
  duration: z.number(),
  beatCount: z.number().optional(),
  finishDuration: z.number().optional(),
  color: z.string().optional(),
});

export const TileDataSchema = z.object({
  position: z.string().regex(/^R\d+C\d+$/),
  backgroundColor: ColorNameSchema.optional(),
  isFilled: z.boolean(),
  color: ColorNameSchema,
  activeAnimations: z.array(TileAnimationSchema).optional(),
});

// Shape is Block[][]
export const ShapeSchema = z.array(z.array(BlockSchema));

// --- Persistence Schemas ---

export const ScorePersistenceDataSchema = z.object({
  score: z.number(),
  lastUpdated: z.number(),
});

export const TilesPersistenceDataSchema = z.object({
  tiles: z.array(TileDataSchema),
  lastUpdated: z.number(),
});

export const ShapesPersistenceDataSchema = z.object({
  nextShapes: z.array(ShapeSchema),
  savedShape: ShapeSchema.nullable(),
  lastUpdated: z.number(),
});

export const MusicPersistenceDataSchema = z.object({
  isMuted: z.boolean(),
  volume: z.number().min(0).max(100),
  isEnabled: z.boolean(),
  lastUpdated: z.number(),
});

export const SoundEffectsPersistenceDataSchema = z.object({
  isMuted: z.boolean(),
  volume: z.number().min(0).max(100),
  isEnabled: z.boolean(),
  lastUpdated: z.number(),
});

export const GameSettingsPersistenceDataSchema = z.object({
  music: MusicPersistenceDataSchema,
  soundEffects: SoundEffectsPersistenceDataSchema,
  debugUnlocked: z.boolean().optional(),
  theme: z.string().optional(),
  lastGameMode: z.string().optional(), // Using string for GameMode to avoid circular deps or complex enum import
  isMapUnlocked: z.boolean().optional(),
  buttonSizeMultiplier: z.number().min(0.5).max(1.5).optional(),
  lastUpdated: z.number(),
});

export const ModifiersPersistenceDataSchema = z.object({
  unlockedModifiers: z.array(z.number()),
  lastUpdated: z.number(),
});

// --- Legacy Schemas ---

const LegacyTileObjectSchema = z.object({
  location: z.object({ row: z.number(), column: z.number() }),
  block: BlockSchema,
  backgroundColor: ColorNameSchema.optional(),
  activeAnimations: z.array(TileAnimationSchema).optional(),
});

const LegacyTileUnionSchema = z.union([TileDataSchema, LegacyTileObjectSchema]);

export const LegacyGamePersistenceDataSchema = z.object({
  score: z.number(),
  tiles: z.array(LegacyTileUnionSchema),
  nextShapes: z.array(ShapeSchema).optional(),
  savedShape: ShapeSchema.nullable().optional(),
});

// --- Stats Schemas ---

export const ColorStatSchema = z.record(ColorNameSchema, z.number());

export const StatValueSchema = z.object({
  total: z.number(),
  colors: ColorStatSchema,
});

// We need to list all keys from GameStats to be strict, or use z.record if we want to be flexible.
// Given the fixed keys in GameStats, it's better to be explicit if possible, but z.record is safer for forward compatibility if new stats are added.
// However, the prompt asks for strict validation.
// Let's use a record for now as the keys are many and might change.
// Actually, let's try to be specific about the keys we know, but allow others? No, strict validation means we want to catch corruption.
// But if we add a new stat in code, old saves might fail validation if we are too strict.
// Zod's .passthrough() or just defining the known ones and using .catch() or similar might be needed.
// For now, let's define the known keys.

const StatCategoryEnum = z.enum([
  'shapesPlaced',
  'linesCleared',
  'rowsCleared',
  'doubleRows',
  'tripleRows',
  'quadrupleRows',
  'doubleRowsWithSingleColumns',
  'tripleRowsWithSingleColumns',
  'tripleRowsWithDoubleColumns',
  'quadrupleRowsWithSingleColumns',
  'columnsCleared',
  'doubleColumns',
  'tripleColumns',
  'quadrupleColumns',
  'doubleColumnsWithSingleRows',
  'tripleColumnsWithDoubleRows',
  'tripleColumnsWithSingleRows',
  'quadrupleColumnsWithSingleRows',
  'singleColumnBySingleRow',
  'doubleColumnByDoubleRow',
  'quadrupleRowByQuadrupleColumn',
]);

export const GameStatsSchema = z.record(StatCategoryEnum, StatValueSchema);

export const StatsPersistenceDataSchema = z.object({
  allTime: GameStatsSchema,
  highScore: GameStatsSchema,
  current: GameStatsSchema,
  lastUpdated: z.number(),
  noTurnStreak: z.object({
    current: z.number(),
    bestInGame: z.number(),
    allTimeBest: z.number(),
  }),
});

// --- Validation Helper ---

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };

export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: new Error(`Validation failed: ${result.error.message}`) };
  }
}
