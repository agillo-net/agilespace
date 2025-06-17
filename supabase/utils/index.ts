export const handleErrorMessage = (error: unknown): string | unknown => {
    if (error instanceof Error) {
        return error.message;
    } else if (typeof error === 'string') {
        return error;
    } else if (error && typeof error === 'object' && 'message' in error) {
        return error.message;
    } else {
        return 'An unknown error occurred';
    }
}
