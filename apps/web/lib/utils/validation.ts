/**
 * Form Validation Utilities
 * P2-9 FIX: Client-side form validation with Zod-like API
 */

export type ValidationRule<T = string> = {
    validate: (value: T) => boolean;
    message: string;
};

export type ValidationSchema<T> = {
    [K in keyof T]?: ValidationRule<T[K]>[];
};

export type ValidationErrors<T> = {
    [K in keyof T]?: string;
};

/**
 * Common validation rules
 */
export const rules = {
    required: (message = 'This field is required'): ValidationRule => ({
        validate: (value: string) => value.trim().length > 0,
        message,
    }),

    email: (message = 'Invalid email address'): ValidationRule => ({
        validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message,
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
        validate: (value: string) => value.length >= min,
        message: message ?? `Must be at least ${min} characters`,
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
        validate: (value: string) => value.length <= max,
        message: message ?? `Must be at most ${max} characters`,
    }),

    pattern: (regex: RegExp, message: string): ValidationRule => ({
        validate: (value: string) => regex.test(value),
        message,
    }),

    numeric: (message = 'Must be a number'): ValidationRule => ({
        validate: (value: string) => /^\d+$/.test(value),
        message,
    }),

    phone: (message = 'Invalid phone number'): ValidationRule => ({
        validate: (value: string) => /^[\d\s\-+()]{10,}$/.test(value),
        message,
    }),

    url: (message = 'Invalid URL'): ValidationRule => ({
        validate: (value: string) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        message,
    }),

    matches: (field: string, message?: string): ValidationRule => ({
        validate: () => true, // Handled specially in validate function
        message: message ?? `Must match ${field}`,
    }),

    password: (message = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character'): ValidationRule => ({
        validate: (value: string) => {
            if (value.length < 12) return false;
            if (!/[A-Z]/.test(value)) return false;
            if (!/[a-z]/.test(value)) return false;
            if (!/[0-9]/.test(value)) return false;
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false;
            return true;
        },
        message,
    }),
};

/**
 * Validate a form data object against a schema
 */
export function validate<T extends Record<string, unknown>>(
    data: T,
    schema: ValidationSchema<T>
): { isValid: boolean; errors: ValidationErrors<T> } {
    const errors: ValidationErrors<T> = {};

    for (const [field, fieldRules] of Object.entries(schema)) {
        if (!fieldRules) continue;

        const value = data[field];

        for (const rule of fieldRules as ValidationRule[]) {
            // Handle special case of matches rule
            if (rule.message.startsWith('Must match')) {
                const matchField = rule.message.replace('Must match ', '');
                if (value !== data[matchField]) {
                    errors[field as keyof T] = rule.message;
                    break;
                }
                continue;
            }

            if (!rule.validate(value as string)) {
                errors[field as keyof T] = rule.message;
                break; // Stop at first error for this field
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * React hook for form validation
 */
export function useFormValidation<T extends Record<string, unknown>>(
    schema: ValidationSchema<T>
) {
    const validateForm = (data: T) => validate(data, schema);

    const validateField = (field: keyof T, value: T[keyof T], allData?: T) => {
        const fieldRules = schema[field];
        if (!fieldRules) return null;

        for (const rule of fieldRules) {
            // Handle matches rule
            if (rule.message.startsWith('Must match') && allData) {
                const matchField = rule.message.replace('Must match ', '') as keyof T;
                if (value !== allData[matchField]) {
                    return rule.message;
                }
                continue;
            }

            if (!rule.validate(value as string)) {
                return rule.message;
            }
        }

        return null;
    };

    return { validateForm, validateField };
}

export default { validate, rules, useFormValidation };
