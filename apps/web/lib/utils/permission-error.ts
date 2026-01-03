/**
 * Permission Error Handler
 * Translates backend 403 errors into user-friendly messages
 */

// Map of backend permission codes to user-friendly explanations
const PERMISSION_ERROR_MAP: Record<string, { title: string; message: string; isSystemControlled?: boolean }> = {
    'cases.assign': {
        title: 'Case Assignment Restricted',
        message: 'You are not permitted to assign cases. This action is reserved for SYSTEM automation.',
        isSystemControlled: true,
    },
    'cases.create': {
        title: 'Case Creation Restricted',
        message: 'You do not have permission to create cases. Contact your administrator for access.',
    },
    'cases.update': {
        title: 'Case Update Restricted',
        message: 'You do not have permission to update this case. Use the workflow system for status changes.',
    },
    'cases.delete': {
        title: 'Case Deletion Restricted',
        message: 'Cases cannot be deleted to preserve audit integrity. Contact SUPER_ADMIN for archival options.',
    },
    'dcas.assign': {
        title: 'DCA Assignment Restricted',
        message: 'DCA allocation is handled automatically by SYSTEM. Manual assignment is not permitted.',
        isSystemControlled: true,
    },
    'sla.update': {
        title: 'SLA Modification Restricted',
        message: 'SLA enforcement is system-controlled and cannot be modified by users.',
        isSystemControlled: true,
    },
    'sla.exempt': {
        title: 'SLA Exemption Restricted',
        message: 'Only FEDEX_ADMIN can exempt cases from SLA requirements.',
    },
    'users.create': {
        title: 'User Creation Restricted',
        message: 'You do not have permission to create new users.',
    },
    'users.delete': {
        title: 'User Deletion Restricted',
        message: 'You do not have permission to delete users.',
    },
    'admin.settings': {
        title: 'Settings Access Restricted',
        message: 'System settings can only be modified by FEDEX_ADMIN.',
    },
    'admin.security': {
        title: 'Security Settings Restricted',
        message: 'Security configuration requires FEDEX_ADMIN privileges.',
    },
    'governance.required': {
        title: 'Governance Role Required',
        message: 'This action requires governance-level access. Contact SUPER_ADMIN.',
    },
};

export interface ParsedPermissionError {
    title: string;
    message: string;
    isSystemControlled: boolean;
    rawCode?: string;
}

/**
 * Parse a backend permission error into a user-friendly format
 */
export function parsePermissionError(error: string | { message?: string; code?: string }): ParsedPermissionError {
    let errorStr = '';
    let code = '';

    if (typeof error === 'string') {
        errorStr = error;
        // Try to extract permission code from error string
        const match = error.match(/Permission denied:\s*(\S+)/i) || error.match(/(\w+\.\w+)/);
        code = match?.[1] || '';
    } else {
        errorStr = error.message || '';
        code = error.code || '';
    }

    // Look up in map
    const mapped = PERMISSION_ERROR_MAP[code];
    if (mapped) {
        return {
            title: mapped.title,
            message: mapped.message,
            isSystemControlled: mapped.isSystemControlled || false,
            rawCode: code,
        };
    }

    // Default fallback for unknown errors
    return {
        title: 'Permission Denied',
        message: errorStr || 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.',
        isSystemControlled: false,
        rawCode: code || undefined,
    };
}

/**
 * Check if an HTTP response is a 403 Forbidden
 */
export function isForbiddenResponse(response: Response): boolean {
    return response.status === 403;
}

/**
 * Handle a 403 response and return parsed error
 */
export async function handleForbiddenResponse(response: Response): Promise<ParsedPermissionError> {
    try {
        const data = await response.json();
        return parsePermissionError(data);
    } catch {
        return parsePermissionError('Permission denied');
    }
}

/**
 * Display format for permission errors
 */
export function formatPermissionError(error: ParsedPermissionError): string {
    let result = error.message;
    if (error.isSystemControlled) {
        result += '\n\nThis action is managed by the SYSTEM and cannot be overridden.';
    }
    return result;
}
