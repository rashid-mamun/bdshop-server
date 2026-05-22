/**
 * Utility functions for safe error handling
 */

/**
 * Extract error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as Record<string, unknown>).message);
    }
    return 'An unknown error occurred';
};

/**
 * Extract error name from unknown error type
 */
export const getErrorName = (error: unknown): string | undefined => {
    if (error instanceof Error) {
        return error.name;
    }
    if (typeof error === 'object' && error !== null && 'name' in error) {
        return String((error as Record<string, unknown>).name);
    }
    return undefined;
};

/**
 * Check if error has specific property
 */
export const hasErrorProperty = (error: unknown, property: string): boolean => {
    return typeof error === 'object' && error !== null && property in error;
};

/**
 * Get error code (for MongoDB or other libraries)
 */
export const getErrorCode = (error: unknown): number | undefined => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as Record<string, unknown>).code;
        return typeof code === 'number' ? code : undefined;
    }
    return undefined;
};

/**
 * Get error property safely
 */
export const getErrorProperty = (error: unknown, property: string): unknown => {
    if (typeof error === 'object' && error !== null) {
        return (error as Record<string, unknown>)[property];
    }
    return undefined;
};
