'use client';

import { DemoPageMessage } from '@/components/demo/DemoModeComponents';

/**
 * Client wrapper for demo messages on server component pages
 */
export function CasesDemoMessage() {
    return (
        <DemoPageMessage
            step={3}
            message="Every case here is governed and traceable. Note the Source column showing SYSTEM vs Manual origin."
        />
    );
}

export function CaseDetailDemoMessage() {
    return (
        <DemoPageMessage
            step={4}
            message="This case is controlled by SYSTEM rules. See the Automation Summary for governance details."
        />
    );
}

export function CaseLifecycleDemoMessage() {
    return (
        <DemoPageMessage
            step={5}
            message="This is the full system story end-to-end. Every step from upstream origin to outcome."
        />
    );
}
