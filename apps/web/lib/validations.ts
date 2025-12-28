import { z } from 'zod';

/**
 * Case validation schemas
 */
export const caseCreateSchema = z.object({
    case_number: z.string().min(1, 'Case number is required'),
    customer_name: z.string().min(1, 'Customer name is required'),
    customer_email: z.string().email('Invalid email address').optional().or(z.literal('')),
    customer_phone: z.string().optional(),
    customer_segment: z.string().optional(),
    customer_industry: z.string().optional(),
    original_amount: z.number().positive('Amount must be positive').or(z.string().transform(Number)),
    outstanding_amount: z.number().positive().optional().or(z.string().transform(Number)),
    currency: z.string().default('USD'),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    status: z.string().default('PENDING_ALLOCATION'),
    notes: z.string().optional(),
});

export const caseUpdateSchema = caseCreateSchema.partial();

/**
 * DCA validation schemas
 */
export const dcaCreateSchema = z.object({
    name: z.string().min(1, 'DCA name is required'),
    code: z.string().min(1, 'DCA code is required').max(10, 'Code must be 10 characters or less'),
    legal_name: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'TERMINATED']).default('PENDING_APPROVAL'),
    primary_contact_name: z.string().optional(),
    primary_contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
    primary_contact_phone: z.string().optional(),
    registration_number: z.string().optional(),
    commission_rate: z.number().min(0).max(100).optional().or(z.string().transform(Number)),
    capacity_limit: z.number().positive('Capacity must be positive').or(z.string().transform(Number)),
    min_case_value: z.number().min(0).optional().or(z.string().transform(Number)),
    max_case_value: z.number().min(0).optional().or(z.string().transform(Number)),
    contract_start_date: z.string().optional(),
    contract_end_date: z.string().optional(),
});

export const dcaUpdateSchema = dcaCreateSchema.partial();

/**
 * SLA Template validation schemas
 */
export const slaTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    response_time_hours: z.number().positive('Must be positive').or(z.string().transform(Number)),
    resolution_time_hours: z.number().positive('Must be positive').or(z.string().transform(Number)),
    escalation_threshold_hours: z.number().positive().optional().or(z.string().transform(Number)),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    is_active: z.boolean().default(true),
    case_value_min: z.number().min(0).optional().or(z.string().transform(Number)),
    case_value_max: z.number().min(0).optional().or(z.string().transform(Number)),
});

/**
 * Escalation validation schema
 */
export const escalationSchema = z.object({
    case_id: z.string().uuid('Invalid case ID'),
    level: z.enum(['L1', 'L2', 'L3']).default('L1'),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().optional(),
});

/**
 * User validation schemas
 */
export const userCreateSchema = z.object({
    email: z.string().email('Invalid email address'),
    full_name: z.string().min(1, 'Full name is required'),
    role: z.enum(['ADMIN', 'OPERATIONS_MANAGER', 'ACCOUNT_MANAGER', 'DCA_AGENT', 'VIEWER']),
    dca_id: z.string().uuid().optional().nullable(),
});

export const userUpdateSchema = userCreateSchema.partial();

/**
 * Helper to validate and parse form data
 */
export function validateFormData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });

    return { success: false, errors };
}
