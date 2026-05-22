const {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
    hasErrorProperty,
} = require('../../../src/utils/errorHandler');

describe('utils/errorHandler', () => {
    it('should extract message from Error', () => {
        const error = new Error('boom');
        expect(getErrorMessage(error)).toBe('boom');
    });

    it('should extract message from string', () => {
        expect(getErrorMessage('oops')).toBe('oops');
    });

    it('should extract message from object', () => {
        expect(getErrorMessage({ message: 'bad' })).toBe('bad');
    });

    it('should return fallback message for unknown', () => {
        expect(getErrorMessage(123)).toBe('An unknown error occurred');
    });

    it('should extract name from Error', () => {
        const error = new TypeError('bad');
        expect(getErrorName(error)).toBe('TypeError');
    });

    it('should extract name from object', () => {
        expect(getErrorName({ name: 'CustomError' })).toBe('CustomError');
    });

    it('should return undefined name for unknown', () => {
        expect(getErrorName('x')).toBeUndefined();
    });

    it('should extract numeric error code', () => {
        expect(getErrorCode({ code: 11000 })).toBe(11000);
    });

    it('should return undefined for non-numeric error code', () => {
        expect(getErrorCode({ code: 'x' })).toBeUndefined();
    });

    it('should read arbitrary error property', () => {
        expect(getErrorProperty({ foo: 'bar' }, 'foo')).toBe('bar');
    });

    it('should detect error property presence', () => {
        expect(hasErrorProperty({ foo: 1 }, 'foo')).toBe(true);
        expect(hasErrorProperty('x', 'foo')).toBe(false);
    });
});
