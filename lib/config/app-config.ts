import { z } from 'zod';

// Schema para configuración de la aplicación
const AppConfigSchema = z.object({
  // API Configuration
  api: z.object({
    supabase: z.object({
      url: z.string().url(),
      anonKey: z.string().min(1),
    }),
    gemini: z.object({
      apiKey: z.string().min(1),
    }).optional(),
  }),

  // Feature Flags
  features: z.object({
    gacha: z.boolean().default(true),
    dailyRewards: z.boolean().default(true),
    campaigns: z.boolean().default(true),
    training: z.boolean().default(true),
    debug: z.boolean().default(false),
  }),

  // Game Configuration
  game: z.object({
    maxPartySize: z.number().int().min(1).max(10).default(5),
    maxTavernSlots: z.number().int().min(1).max(10).default(3),
    energyRegenInterval: z.number().int().min(1).default(240), // seconds
    energyRegenAmount: z.number().int().min(1).default(1),
    maxEnergy: z.number().int().min(1).default(20),
  }),

  // UI Configuration
  ui: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('dark'),
    animations: z.boolean().default(true),
    reducedMotion: z.boolean().default(false),
    assetQuality: z.enum(['low', 'medium', 'high']).default('medium'),
  }),

  // Performance Configuration
  performance: z.object({
    enableQueryCaching: z.boolean().default(true),
    maxConcurrentRequests: z.number().int().min(1).max(10).default(3),
    enableAssetPreloading: z.boolean().default(true),
    preloadCriticalAssets: z.boolean().default(true),
    enableVirtualization: z.boolean().default(true),
    virtualizationThreshold: z.number().int().min(10).default(50),
  }),

  // Analytics & Monitoring
  monitoring: z.object({
    enableAnalytics: z.boolean().default(false),
    enableErrorReporting: z.boolean().default(true),
    enablePerformanceMonitoring: z.boolean().default(true),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
    reportErrorsToConsole: z.boolean().default(true),
    enableWebVitalsTracking: z.boolean().default(true),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

// Configuración por defecto
const defaultConfig: AppConfig = {
  api: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    gemini: process.env.GEMINI_API_KEY ? {
      apiKey: process.env.GEMINI_API_KEY,
    } : undefined,
  },

  features: {
    gacha: true,
    dailyRewards: true,
    campaigns: true,
    training: true,
    debug: process.env.NODE_ENV === 'development',
  },

  game: {
    maxPartySize: 5,
    maxTavernSlots: 3,
    energyRegenInterval: 240, // 4 minutes
    energyRegenAmount: 1,
    maxEnergy: 20,
  },

  ui: {
    theme: 'dark',
    animations: true,
    reducedMotion: false,
    assetQuality: 'medium',
  },

  performance: {
    enableQueryCaching: true,
    maxConcurrentRequests: 3,
    enableAssetPreloading: true,
    preloadCriticalAssets: true,
    enableVirtualization: true,
    virtualizationThreshold: 50,
  },

  monitoring: {
    enableAnalytics: false,
    enableErrorReporting: true,
    enablePerformanceMonitoring: false,
    reportErrorsToConsole: true,
    enableWebVitalsTracking: false,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
};

// Configuración de runtime (puede ser modificada)
let runtimeConfig = { ...defaultConfig };

// Función para validar y mezclar configuración
function validateConfig(config: Partial<AppConfig>): AppConfig {
  try {
    return AppConfigSchema.parse({ ...defaultConfig, ...config });
  } catch (error) {
    console.error('Invalid configuration:', error);
    // Retornar configuración por defecto si hay errores
    return defaultConfig;
  }
}

// Función para inicializar configuración
export function initializeConfig(customConfig?: Partial<AppConfig>): void {
  runtimeConfig = validateConfig(customConfig || {});
}

// Función para obtener configuración
export function getConfig(): Readonly<AppConfig> {
  return { ...runtimeConfig };
}

// Función para actualizar configuración en runtime
export function updateConfig(updates: Partial<AppConfig>): void {
  runtimeConfig = validateConfig({ ...runtimeConfig, ...updates });
}

// Getters específicos para facilitar el acceso
export const config = {
  get api() { return getConfig().api; },
  get features() { return getConfig().features; },
  get game() { return getConfig().game; },
  get ui() { return getConfig().ui; },
  get performance() { return getConfig().performance; },
  get monitoring() { return getConfig().monitoring; },

  // Métodos de utilidad
  isFeatureEnabled: (feature: keyof AppConfig['features']) => getConfig().features[feature],
  shouldUseAnimations: () => getConfig().ui.animations && !getConfig().ui.reducedMotion,
  getAssetQuality: () => getConfig().ui.assetQuality,
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
};

// Función para validar configuración de entorno
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured. Please set it in .env.local');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Please set it in .env.local');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Inicializar configuración al importar
initializeConfig();