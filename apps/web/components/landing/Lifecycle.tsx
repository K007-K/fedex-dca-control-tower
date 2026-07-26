import { cn } from '@/lib/utils';

import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

/** Primary recovery path, mirroring CASE_STATUS_TRANSITIONS in lib/case/CaseStateMachine.ts */
const PRIMARY_PATH = [
    {
        state: 'PENDING_ALLOCATION',
        actor: 'SYSTEM',
        note: 'Row created from an authenticated upstream service call.',
        tone: 'system',
    },
    {
        state: 'ALLOCATED',
        actor: 'SYSTEM',
        note: 'Assigned to an agency, awaiting first contact.',
        tone: 'system',
    },
    {
        state: 'IN_PROGRESS',
        actor: 'DCA_AGENT',
        note: 'Active collection under way.',
        tone: 'human',
    },
    {
        state: 'CUSTOMER_CONTACTED',
        actor: 'DCA_AGENT',
        note: 'Initial contact made with the customer.',
        tone: 'human',
    },
    {
        state: 'PAYMENT_PROMISED',
        actor: 'DCA_AGENT',
        note: 'Customer has committed to a payment.',
        tone: 'human',
    },
    {
        state: 'FULL_RECOVERY',
        actor: 'DCA_AGENT',
        note: 'Balance recovered in full.',
        tone: 'human',
    },
    {
        state: 'CLOSED',
        actor: 'TERMINAL',
        note: 'No transitions permitted out of this state.',
        tone: 'terminal',
    },
];

/** Exception states — reachable from the path above, each with its own exits. */
const BRANCHES = [
    {
        state: 'DISPUTED',
        from: 'IN_PROGRESS · CUSTOMER_CONTACTED',
        exits: 'IN_PROGRESS · LEGAL_ACTION · WRITTEN_OFF · CLOSED',
        tone: 'alert',
    },
    {
        state: 'ESCALATED',
        from: 'Any active state, or an SLA breach',
        exits: 'IN_PROGRESS · LEGAL_ACTION · WRITTEN_OFF',
        tone: 'alert',
    },
    {
        state: 'PARTIAL_RECOVERY',
        from: 'PAYMENT_PROMISED',
        exits: 'FULL_RECOVERY · PAYMENT_PROMISED · WRITTEN_OFF · CLOSED',
        tone: 'human',
    },
    {
        state: 'LEGAL_ACTION',
        from: 'DISPUTED · ESCALATED',
        exits: 'FULL_RECOVERY · PARTIAL_RECOVERY · WRITTEN_OFF · CLOSED',
        tone: 'alert',
    },
    {
        state: 'WRITTEN_OFF',
        from: 'Any unrecoverable outcome',
        exits: 'CLOSED',
        tone: 'terminal',
    },
];

const TONE: Record<string, { dot: string; chip: string }> = {
    system: {
        dot: 'bg-primary',
        chip: 'bg-primary/10 text-primary-700 ring-primary/20 dark:bg-primary/20 dark:text-primary-300 dark:ring-primary/30',
    },
    human: {
        dot: 'bg-info',
        chip: 'bg-info/10 text-info-700 ring-info/20 dark:bg-info/15 dark:text-info dark:ring-info/25',
    },
    alert: {
        dot: 'bg-accent',
        chip: 'bg-accent/10 text-accent-700 ring-accent/20 dark:bg-accent/15 dark:text-accent-300 dark:ring-accent/25',
    },
    terminal: {
        dot: 'bg-gray-400 dark:bg-gray-600',
        chip: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10',
    },
};

export function Lifecycle() {
    return (
        <section
            id="lifecycle"
            className="relative scroll-mt-20 border-t border-gray-200/80 py-24 sm:py-32 dark:border-white/10"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Case lifecycle"
                    title="Twelve states. One state machine. No shortcuts around it."
                    description="Every case moves through the same governed states, and each transition is validated server-side against both the current state and the caller’s role. Machine transitions and human transitions stay distinguishable forever."
                />

                <Reveal className="mt-14">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-500">
                        Primary recovery path
                    </p>
                    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
                        <div className="flex min-w-[900px] gap-3 lg:min-w-0">
                            {PRIMARY_PATH.map((s, i) => {
                                const tone = TONE[s.tone];
                                return (
                                    <div key={s.state} className="relative flex-1">
                                        {i < PRIMARY_PATH.length - 1 && (
                                            <span
                                                aria-hidden
                                                className="absolute right-[-12px] top-[26px] z-10 h-px w-3 bg-gray-300 dark:bg-white/15"
                                            />
                                        )}
                                        <div className="h-full rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('h-2 w-2 rounded-full', tone.dot)} />
                                                <span className="font-mono text-[10px] text-gray-500 dark:text-gray-500">
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <p className="mt-3 break-words font-mono text-[11px] font-semibold leading-tight text-gray-900 dark:text-white">
                                                {s.state}
                                            </p>
                                            <span
                                                className={cn(
                                                    'mt-2 inline-block rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ring-1 ring-inset',
                                                    tone.chip
                                                )}
                                            >
                                                {s.actor}
                                            </span>
                                            <p className="mt-2.5 text-[12px] leading-snug text-gray-500 dark:text-gray-500">
                                                {s.note}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={80} className="mt-10">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-500">
                        Exception states
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {BRANCHES.map((b) => {
                            const tone = TONE[b.tone];
                            return (
                                <div
                                    key={b.state}
                                    className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={cn('h-2 w-2 rounded-full', tone.dot)} />
                                        <p className="font-mono text-[11px] font-semibold text-gray-900 dark:text-white">
                                            {b.state}
                                        </p>
                                    </div>
                                    <dl className="mt-3 space-y-1.5">
                                        <div className="flex gap-2">
                                            <dt className="w-10 shrink-0 font-mono text-[10px] uppercase text-gray-400 dark:text-gray-600">
                                                from
                                            </dt>
                                            <dd className="font-mono text-[10px] leading-relaxed text-gray-600 dark:text-gray-400">
                                                {b.from}
                                            </dd>
                                        </div>
                                        <div className="flex gap-2">
                                            <dt className="w-10 shrink-0 font-mono text-[10px] uppercase text-gray-400 dark:text-gray-600">
                                                exits
                                            </dt>
                                            <dd className="font-mono text-[10px] leading-relaxed text-gray-600 dark:text-gray-400">
                                                {b.exits}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            );
                        })}
                    </div>
                </Reveal>

                <Reveal delay={140} className="mt-6">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-3.5 dark:border-white/10 dark:bg-white/[0.02]">
                        {[
                            { label: 'SYSTEM transition', dot: 'bg-primary' },
                            { label: 'Human transition', dot: 'bg-info' },
                            { label: 'Exception / escalation', dot: 'bg-accent' },
                            { label: 'Terminal', dot: 'bg-gray-400 dark:bg-gray-600' },
                        ].map((legend) => (
                            <span
                                key={legend.label}
                                className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400"
                            >
                                <span className={cn('h-2 w-2 rounded-full', legend.dot)} />
                                {legend.label}
                            </span>
                        ))}
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
                            An invalid transition is rejected before it reaches the row.
                        </span>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
