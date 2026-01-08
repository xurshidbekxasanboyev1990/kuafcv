/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly error messages
 */

import { logger } from './logger';

export interface AppError {
    message: string;
    code?: string;
    details?: unknown;
    userMessage?: string;
}

/**
 * Error codes
 */
export const ERROR_CODES = {
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMIT: 'RATE_LIMIT',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UNKNOWN: 'UNKNOWN',
} as const;

/**
 * User-friendly error messages in Uzbek
 */
const ERROR_MESSAGES: Record<string, string> = {
    [ERROR_CODES.AUTH_EXPIRED]: 'Tizimga qaytadan kiring',
    [ERROR_CODES.NETWORK_ERROR]: 'Internet aloqasi yo\'q. Qaytadan urinib ko\'ring.',
    [ERROR_CODES.VALIDATION_ERROR]: 'Ma\'lumotlar noto\'g\'ri kiritilgan',
    [ERROR_CODES.SERVER_ERROR]: 'Server xatoligi. Keyinroq qayta urinib ko\'ring.',
    [ERROR_CODES.NOT_FOUND]: 'Ma\'lumot topilmadi',
    [ERROR_CODES.FORBIDDEN]: 'Bu amalni bajarish uchun ruxsat yo\'q',
    [ERROR_CODES.RATE_LIMIT]: 'Juda ko\'p so\'rov. Bir oz kuting.',
    [ERROR_CODES.FILE_TOO_LARGE]: 'Fayl hajmi juda katta',
    [ERROR_CODES.INVALID_FILE_TYPE]: 'Fayl turi noto\'g\'ri',
    [ERROR_CODES.UNKNOWN]: 'Noma\'lum xatolik yuz berdi',
};

/**
 * Handle API errors and convert to AppError
 */
export function handleApiError(error: unknown): AppError {
    logger.error('API Error:', error);

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            message: 'Network request failed',
            code: ERROR_CODES.NETWORK_ERROR,
            userMessage: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        };
    }

    // Standard Error objects
    if (error instanceof Error) {
        // Auth expired
        if (error.message === 'Avtorizatsiya muddati tugagan') {
            return {
                message: error.message,
                code: ERROR_CODES.AUTH_EXPIRED,
                userMessage: ERROR_MESSAGES[ERROR_CODES.AUTH_EXPIRED],
            };
        }

        // Network errors
        if (error.message.toLowerCase().includes('network')) {
            return {
                message: error.message,
                code: ERROR_CODES.NETWORK_ERROR,
                userMessage: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
            };
        }

        // Return error with original message
        return {
            message: error.message,
            code: ERROR_CODES.UNKNOWN,
            userMessage: error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
        };
    }

    // Unknown error types
    return {
        message: 'Unknown error occurred',
        code: ERROR_CODES.UNKNOWN,
        userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
        details: error,
    };
}

/**
 * Handle validation errors
 */
export function handleValidationError(field: string, message: string): AppError {
    return {
        message: `Validation failed for ${field}: ${message}`,
        code: ERROR_CODES.VALIDATION_ERROR,
        userMessage: message,
        details: { field },
    };
}

/**
 * Handle file upload errors
 */
export function handleFileUploadError(error: unknown): AppError {
    if (error instanceof Error) {
        if (error.message.includes('size') || error.message.includes('hajmi')) {
            return {
                message: error.message,
                code: ERROR_CODES.FILE_TOO_LARGE,
                userMessage: error.message,
            };
        }

        if (error.message.includes('type') || error.message.includes('turi')) {
            return {
                message: error.message,
                code: ERROR_CODES.INVALID_FILE_TYPE,
                userMessage: error.message,
            };
        }
    }

    return handleApiError(error);
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: AppError): string {
    return error.userMessage || error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
    const recoverableCodes = [
        ERROR_CODES.NETWORK_ERROR,
        ERROR_CODES.RATE_LIMIT,
    ];

    return error.code ? recoverableCodes.includes(error.code as any) : false;
}

/**
 * Retry helper for recoverable errors
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        delayMs?: number;
        backoff?: boolean;
    } = {}
): Promise<T> {
    const { maxRetries = 3, delayMs = 1000, backoff = true } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const appError = handleApiError(error);

            // Don't retry if not recoverable
            if (!isRecoverableError(appError)) {
                throw error;
            }

            // Don't retry on last attempt
            if (attempt === maxRetries - 1) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
            logger.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Error boundary helper
 */
export function reportError(error: Error, errorInfo?: React.ErrorInfo): void {
    logger.error('Error Boundary caught error:', error);
    logger.error('Error Info:', errorInfo);

    // TODO: Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
        // Send to Sentry, LogRocket, or other service
        // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
}
