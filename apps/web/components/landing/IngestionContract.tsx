import { AlertTriangle, KeyRound, Repeat2 } from 'lucide-react';

import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const REQUEST_LINES: Array<{ text: string; tone?: 'method' | 'key' | 'value' | 'muted' }> = [
    { text: 'POST /api/v1/cases/system-create', tone: 'method' },
    { text: 'X-Service-Auth: Bearer ••••••••••••', tone: 'muted' },
    { text: 'Content-Type: application/json', tone: 'muted' },
    { text: '' },
    { text: '{' },
    { text: '  "case_type": "INVOICE",' },
    { text: '  "source_system": "ERP_BILLING",' },
    { text: '  "source_reference_id": "FX-4471902",' },
    { text: '  "region": "EMEA",' },
    { text: '  "currency": "EUR",' },
    { text: '  "principal_amount": 17250.00,' },
    { text: '  "tax_amount": 1170.00,' },
    { text: '  "total_due": 18420.00,' },
    { text: '  "customer_id": "ACC-88213",' },
    { text: '  "customer_name": "Northwind Logistics BV"' },
    { text: '}' },
];

const RESPONSE_LINES = [
    '201 Created',
    '{',
    '  "success": true,',
    '  "data": {',
    '    "case_id": "8f2c…",',
    '    "case_number": "CASE-2026-004471902",',
    '    "sla_id": "b1e7…",',
    '    "ai_score": { "risk_level": "MEDIUM", "priority_score": 68 }',
    '  }',
    '}',
];

const GUARANTEES = [
    {
        icon: KeyRound,
        title: 'A human token cannot call this',
        body: 'Requests without a valid service credential are rejected, and an impersonation attempt is written to the security log before the 403 is returned. The exception endpoint refuses SYSTEM actors just as firmly.',
    },
    {
        icon: Repeat2,
        title: 'Replays cannot duplicate',
        body: 'The upstream reference becomes a unique key on the row. Retry the same message as often as your queue needs to — the repeat is refused as a duplicate rather than becoming a second case.',
    },
    {
        icon: AlertTriangle,
        title: 'Validation happens before the row',
        body: 'Schema, currency, amounts and region resolve before anything is persisted, so a malformed message never becomes a partially-governed case.',
    },
];

function CodePane({
    title,
    lines,
    accent,
}: {
    title: string;
    lines: Array<string | { text: string; tone?: string }>;
    accent: 'primary' | 'success';
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0a0a0c]">
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                <span
                    className={
                        accent === 'primary'
                            ? 'h-1.5 w-1.5 rounded-full bg-primary'
                            : 'h-1.5 w-1.5 rounded-full bg-success'
                    }
                />
                <span className="font-mono text-[11px] text-gray-500 dark:text-gray-500">{title}</span>
            </div>
            <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[11.5px] leading-relaxed">
                <code className="text-gray-700 dark:text-gray-300">
                    {lines.map((line, i) => {
                        const text = typeof line === 'string' ? line : line.text;
                        const tone = typeof line === 'string' ? undefined : line.tone;
                        return (
                            <span
                                key={i}
                                className={
                                    tone === 'method'
                                        ? 'block font-semibold text-primary-600 dark:text-primary-300'
                                        : tone === 'muted'
                                          ? 'block text-gray-400 dark:text-gray-600'
                                          : 'block'
                                }
                            >
                                {text || ' '}
                            </span>
                        );
                    })}
                </code>
            </pre>
        </div>
    );
}

export function IngestionContract() {
    return (
        <section className="relative border-t border-gray-200/80 bg-gray-50/50 py-24 sm:py-32 dark:border-white/10 dark:bg-white/[0.015]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Ingestion contract"
                    title="Two doors in. The second one keeps a receipt."
                    description="Upstream billing systems, RPA bots and legacy platforms all enter through the same authenticated endpoint. The only alternative is a FEDEX_ADMIN exception that demands a written justification and writes its own audit record — there is no third path and no silent bypass."
                />

                <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                    <Reveal className="space-y-4">
                        <CodePane title="request" lines={REQUEST_LINES} accent="primary" />
                        <CodePane title="response" lines={RESPONSE_LINES} accent="success" />
                    </Reveal>

                    <div className="space-y-4">
                        {GUARANTEES.map((g, i) => {
                            const Icon = g.icon;
                            return (
                                <Reveal key={g.title} delay={80 + i * 80}>
                                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <h3 className="mt-4 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                            {g.title}
                                        </h3>
                                        <p className="mt-2 text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">
                                            {g.body}
                                        </p>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
