// Debug utility for Supabase-only mode
// Disable all fallbacks and log everything for precise debugging

export type DebugCategory = 'supabase' | 'auth' | 'game-state' | 'inventory' | 'gacha' | 'battle' | 'campaign' | 'combat' | 'crafting' | 'unit';

interface DebugLog {
  category: DebugCategory;
  message: string;
  data?: any;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
}

class GameDebugger {
  private logs: DebugLog[] = [];
  private enabled: boolean = true;
  private showInConsole: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setShowInConsole(show: boolean) {
    this.showInConsole = show;
  }

  log(category: DebugCategory, message: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.enabled) return;

    const log: DebugLog = {
      category,
      message,
      data,
      timestamp: new Date(),
      level
    };

    this.logs.push(log);

    if (this.showInConsole) {
      const prefix = `[${category.toUpperCase()}]`;
      switch (level) {
        case 'error':
          console.error(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        default:
          console.log(prefix, message, data || '');
      }
    }
  }

  info(category: DebugCategory, message: string, data?: any) {
    this.log(category, message, data, 'info');
  }

  warn(category: DebugCategory, message: string, data?: any) {
    this.log(category, message, data, 'warn');
  }

  error(category: DebugCategory, message: string, data?: any) {
    this.log(category, message, data, 'error');
  }

  getLogs(category?: DebugCategory): DebugLog[] {
    if (category) {
      return this.logs.filter(l => l.category === category);
    }
    return this.logs;
  }

  getErrors(): DebugLog[] {
    return this.logs.filter(l => l.level === 'error');
  }

  clear() {
    this.logs = [];
  }

  // Print summary of all issues
  printSummary() {
    const errors = this.getErrors();
    const warnings = this.logs.filter(l => l.level === 'warn');

    console.group('🔍 Game Debug Summary');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.group('❌ Errors');
      errors.forEach(e => {
        console.error(`[${e.category}] ${e.message}`, e.data);
      });
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group('⚠️ Warnings');
      warnings.forEach(w => {
        console.warn(`[${w.category}] ${w.message}`, w.data);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }
}

export const gameDebugger = new GameDebugger();

// Hook for React components
export function useDebugger() {
  return gameDebugger;
}

// Set debug mode based on environment
if (typeof window !== 'undefined') {
  (window as any).gameDebugger = gameDebugger;
}