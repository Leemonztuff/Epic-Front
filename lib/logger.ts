import { config } from '@/lib/config/app-config';

// Niveles de logging
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Tipos de eventos para logging estructurado
export type LogEvent =
  | 'user_action'
  | 'api_call'
  | 'error'
  | 'performance'
  | 'asset_load'
  | 'game_event'
  | 'auth_event';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: LogEvent;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

// Logger principal
class Logger {
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levelMap: Record<string, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    const configLevel = levelMap[config.monitoring.logLevel] ?? 1;
    return level >= configLevel;
  }

  private createEntry(
    level: LogLevel,
    event: LogEvent,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      data,
      sessionId: this.sessionId,
      error,
    };
  }

  private log(entry: LogEntry): void {
    // Agregar al buffer
    this.buffer.push(entry);

    // Mantener buffer en tamaño máximo
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Log en consola según el nivel
    const logMethod = this.getConsoleMethod(entry.level);
    const logData = {
      ...entry,
      level: LogLevel[entry.level],
    };

    if (entry.error) {
      logMethod(`[${entry.event}] ${entry.message}`, entry.error, entry.data);
    } else {
      logMethod(`[${entry.event}] ${entry.message}`, entry.data);
    }

    // En producción, enviar a servicio de monitoreo
    if (config.isProduction() && config.monitoring.enableErrorReporting) {
      this.sendToMonitoring(entry);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      // Integración con servicios de monitoreo (Sentry, LogRocket, etc.)
      // Solo enviar errores y warnings en producción
      if (entry.level >= LogLevel.WARN) {
        // Google Analytics (si está disponible)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'exception', {
            description: entry.message,
            fatal: entry.level === LogLevel.ERROR,
          });
        }

        // Aquí se puede agregar Sentry:
        // if (entry.error && typeof window !== 'undefined' && (window as any).Sentry) {
        //   (window as any).Sentry.captureException(entry.error, {
        //     tags: { event: entry.event },
        //     extra: entry.data,
        //   });
        // }
      }
    } catch (error) {
      // Evitar loops infinitos de logging
      console.error('Failed to send log to monitoring:', error);
    }
  }

  // Métodos públicos de logging
  debug(event: LogEvent, message: string, data?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(this.createEntry(LogLevel.DEBUG, event, message, data));
    }
  }

  info(event: LogEvent, message: string, data?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(this.createEntry(LogLevel.INFO, event, message, data));
    }
  }

  warn(event: LogEvent, message: string, data?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(this.createEntry(LogLevel.WARN, event, message, data));
    }
  }

  error(event: LogEvent, message: string, error?: Error, data?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(this.createEntry(LogLevel.ERROR, event, message, data, error));
    }
  }

  // Logging específico para acciones de usuario
  userAction(action: string, data?: Record<string, any>): void {
    this.info('user_action', `User performed: ${action}`, data);
  }

  // Logging para llamadas API
  apiCall(endpoint: string, method: string, duration?: number, error?: Error): void {
    const data = { endpoint, method, duration };
    if (error) {
      this.error('api_call', `API call failed: ${endpoint}`, error, data);
    } else {
      this.debug('api_call', `API call: ${endpoint}`, data);
    }
  }

  // Logging para eventos de juego
  gameEvent(eventType: string, data?: Record<string, any>): void {
    this.info('game_event', `Game event: ${eventType}`, data);
  }

  // Logging para carga de assets
  assetLoad(assetId: string, success: boolean, duration?: number): void {
    const data = { assetId, duration };
    if (success) {
      this.debug('asset_load', `Asset loaded: ${assetId}`, data);
    } else {
      this.warn('asset_load', `Asset failed to load: ${assetId}`, data);
    }
  }

  // Logging para autenticación
  authEvent(eventType: 'login' | 'logout' | 'signup' | 'error', data?: Record<string, any>): void {
    this.info('auth_event', `Auth event: ${eventType}`, data);
  }

  // Obtener logs recientes (útil para debugging)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.buffer.slice(-count);
  }

  // Limpiar buffer
  clearLogs(): void {
    this.buffer = [];
  }

  // Exportar logs (para debugging)
  exportLogs(): LogEntry[] {
    return [...this.buffer];
  }
}

// Instancia global del logger
export const logger = new Logger();

// Funciones de conveniencia para logging común
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  userAction: logger.userAction.bind(logger),
  apiCall: logger.apiCall.bind(logger),
  gameEvent: logger.gameEvent.bind(logger),
  assetLoad: logger.assetLoad.bind(logger),
  authEvent: logger.authEvent.bind(logger),
};