'use client';

import {
    Check,
    Gavel,
    Headphones,
    ShieldAlert,
    ShieldCheck,
    Slash,
    UserCog,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const PERSONAS = [
    {
        id: 'governance',
        icon: ShieldCheck,
        role: 'SUPER_ADMIN',
        name: 'Governance',
        scope: 'Platform-wide · non-operational',
        summary:
            'The highest authority on the platform, and deliberately the least operational. It shapes the rules everyone else works inside — and cannot touch a single case.',
        can: [
            'Onboard, update and retire agencies',
            'Author SLA templates and region policy',
            'Manage every user, role and assignment',
            'Full audit log and security settings',
        ],
        cannot: [
            'Create, update or close a case',
            'Assign or reassign work',
            'Act operationally in any workbench',
        ],
        tiles: [
            { label: 'Agencies', value: '128' },
            { label: 'Regions', value: '14' },
            { label: 'Case writes', value: '0' },
        ],
    },
    {
        id: 'admin',
        icon: UserCog,
        role: 'FEDEX_ADMIN',
        name: 'Administrator',
        scope: 'Assigned regions · operational',
        summary:
            'Runs the operation day to day. The only human role that can open a case at all — and only by exception, with a justification that stays on the record.',
        can: [
            'Create a case by exception, with justification',
            'Update case records and outcomes',
            'Provision and manage users',
            'Read the full platform audit log',
        ],
        cannot: [
            'Onboard or retire agencies',
            'Create or edit SLA policy',
            'Assign or reassign cases',
            'Alter governance columns',
        ],
        tiles: [
            { label: 'Active users', value: '2,410' },
            { label: 'Open breaches', value: '12' },
            { label: 'Exceptions (30d)', value: '3' },
        ],
    },
    {
        id: 'manager',
        icon: Gavel,
        role: 'FEDEX_MANAGER',
        name: 'Regional manager',
        scope: 'Single assigned region',
        summary:
            'Owns throughput for one region: queue health, workload balance and escalation before a clock runs out. Oversight without governance authority.',
        can: [
            'Monitor queue depth and SLA health',
            'Update and escalate cases in region',
            'Bulk-update and export case data',
            'Review agency and agent performance',
        ],
        cannot: [
            'Create cases',
            'Reassign work — that is DCA_MANAGER',
            'Reach across regions',
            'Read the platform audit log',
        ],
        tiles: [
            { label: 'Queue depth', value: '1,284' },
            { label: 'On track', value: '96.4%' },
            { label: 'Agents', value: '34' },
        ],
    },
    {
        id: 'agent',
        icon: Headphones,
        role: 'DCA_AGENT',
        name: 'Agent',
        scope: 'Assigned cases only',
        summary:
            'A focused worklist. No search across the estate, no visibility into another agent’s book — just the cases the system routed here.',
        can: [
            'Work assigned cases end to end',
            'Log contact attempts and outcomes',
            'Advance lifecycle states',
            'View SLA targets on their cases',
        ],
        cannot: [
            'See other agents’ cases',
            'Reassign their own work',
            'Create cases',
            'Export case data',
        ],
        tiles: [
            { label: 'Assigned', value: '47' },
            { label: 'Due today', value: '9' },
            { label: 'Resolved (30d)', value: '118' },
        ],
    },
    {
        id: 'auditor',
        icon: ShieldAlert,
        role: 'FEDEX_AUDITOR',
        name: 'Auditor',
        scope: 'Read-only · compliance-wide',
        summary:
            'Evidence without exposure. Full trace of who did what, when — and no ability to change any of it.',
        can: [
            'Read the immutable audit log',
            'Review every case, agency and user record',
            'Trace actor identity per action',
            'Verify SLA and escalation history',
        ],
        cannot: [
            'Mutate any record',
            'Export reports — read access only',
            'Assign or reassign work',
            'Create cases',
        ],
        tiles: [
            { label: 'Audit events', value: '4.2M' },
            { label: 'Retention', value: '7 yrs' },
            { label: 'Gaps', value: '0' },
        ],
    },
] as const;

export function Workbenches() {
    const [active, setActive] = useState(0);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        const last = PERSONAS.length - 1;
        let next: number | null = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = last;
        if (next !== null) {
            e.preventDefault();
            setActive(next);
            tabRefs.current[next]?.focus();
        }
    };

    const persona = PERSONAS[active];

    return (
        <div className="mt-14 grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Tabs */}
            <div
                role="tablist"
                aria-orientation="vertical"
                aria-label="Role-based workbenches"
                onKeyDown={onKeyDown}
                className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            >
                {PERSONAS.map((p, i) => {
                    const Icon = p.icon;
                    const selected = i === active;
                    return (
                        <button
                            key={p.id}
                            ref={(el) => {
                                tabRefs.current[i] = el;
                            }}
                            role="tab"
                            id={`wb-tab-${p.id}`}
                            aria-selected={selected}
                            aria-controls={`wb-panel-${p.id}`}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => setActive(i)}
                            className={cn(
                                'flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 lg:w-full',
                                selected
                                    ? 'border-primary/30 bg-primary/5 shadow-sm dark:border-primary/40 dark:bg-primary/10'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.05]'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                    selected
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-500'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                                <span
                                    className={cn(
                                        'block text-sm font-semibold',
                                        selected
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-700 dark:text-gray-300'
                                    )}
                                >
                                    {p.name}
                                </span>
                                <span className="block truncate font-mono text-[10px] text-gray-400 dark:text-gray-600">
                                    {p.role}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Panel */}
            <div
                role="tabpanel"
                id={`wb-panel-${persona.id}`}
                aria-labelledby={`wb-tab-${persona.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/[0.02]"
            >
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {persona.name} workbench
                    </h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[10px] font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                        {persona.scope}
                    </span>
                </div>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                    {persona.summary}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                    {persona.tiles.map((tile) => (
                        <div
                            key={tile.label}
                            className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                        >
                            <p className="font-mono text-xl font-semibold text-gray-900 dark:text-white">
                                {tile.value}
                            </p>
                            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-500">
                                {tile.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-success-700 dark:text-success">
                            Permitted
                        </p>
                        <ul className="space-y-2.5">
                            {persona.can.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-600">
                            Blocked by design
                        </p>
                        <ul className="space-y-2.5">
                            {persona.cannot.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-500">
                                    <Slash className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-700" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
