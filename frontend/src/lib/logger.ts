/**
 * Logger Utility
 * Conditional logging based on environment
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('Debug info');
 *   logger.error('Error occurred:', error);
 *   logger.warn('Warning message');
 */

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const logger = {
    /**
     * Log general information (only in development)
     */
    log: (...args: any[]) => {
        if (isDev && !isTest) {
            console.log(...args);
        }
    },

    /**
     * Log errors (always logged, even in production)
     */
    error: (...args: any[]) => {
        console.error(...args);

        // TODO: In production, send to error tracking service (Sentry, LogRocket)
        if (!isDev && !isTest) {
            // sendToErrorTrackingService(args);
        }
    },

    /**
     * Log warnings (only in development)
     */
    warn: (...args: any[]) => {
        if (isDev && !isTest) {
            console.warn(...args);
        }
    },

    /**
     * Log debug information (only in development)
     */
    debug: (...args: any[]) => {
        if (isDev && !isTest) {
            console.debug(...args);
        }
    },

    /**
     * Log table data (only in development)
     */
    table: (data: any) => {
        if (isDev && !isTest && console.table) {
            console.table(data);
        }
    },

    /**
     * Create a grouped console log (only in development)
     */
    group: (label: string, callback: () => void) => {
        if (isDev && !isTest) {
            console.group(label);
            callback();
            console.groupEnd();
        }
    },
};

/**
 * Performance logging helper
 */
export class PerformanceLogger {
    private startTime: number;
    private label: string;

    constructor(label: string) {
        this.label = label;
        this.startTime = performance.now();
        logger.log(`⏱️ [${label}] Started`);
    }

    end() {
        const duration = performance.now() - this.startTime;
        logger.log(`⏱️ [${this.label}] Completed in ${duration.toFixed(2)}ms`);
        return duration;
    }
}

/**
 * Usage example:
 * 
 * const perf = new PerformanceLogger('Fetch Portfolios');
 * await fetchPortfolios();
 * perf.end();
 */
