'use client';

import {
    CheckCircle2,
    Fingerprint,
    Globe2,
    Lock,
    ShieldCheck,
    Timer,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

const STAGES = [
    {
        icon: Lock,
        label: 'SYSTEM ingestion',
        detail: 'X-Service-Auth verified',
        meta: 'actor_type=SYSTEM',
    },
    {
        icon: Fingerprint,
        label: 'Idempotency check',
        detail: 'external_case_id unique',
        meta: 'UNIQUE index',
    },
    {
        icon: Globe2,
        label: 'Region resolution',
        detail: 'Boundary locked at write',
        meta: 'region_id IMMUTABLE',
    },
    {
        icon: Users,
        label: 'DCA + agent allocation',
        detail: 'Capacity · specialization',
        meta: 'no human override',
    },
    {
        icon: Timer,
        label: 'SLA bind',
        detail: 'Breach monitor armed',
        meta: 'auto-escalation',
    },
] as const;

const AUDIT_EVENTS = [
    { actor: 'SYSTEM', action: 'case.created', target: 'FX-4471902', tone: 'system' },
    { actor: 'SYSTEM', action: 'case.allocated', target: 'DCA · Northwind', tone: 'system' },
    { actor: 'DCA_AGENT', action: 'case.contact_logged', target: 'FX-4471902', tone: 'human' },
    { actor: 'SYSTEM', action: 'sla.bound', target: '72h · P2', tone: 'system' },
    { actor: 'FEDEX_MANAGER', action: 'case.reassigned', target: 'FX-4471815', tone: 'human' },
    { actor: 'SYSTEM', action: 'sla.breach_detected', target: 'FX-4471640', tone: 'alert' },
    { actor: 'FEDEX_AUDITOR', action: 'audit.exported', target: 'EMEA · Q3', tone: 'human' },
    { actor: 'SYSTEM', action: 'case.escalated', target: 'FX-4471640', tone: 'alert' },
] as const;

const TONE_STYLES: Record<string, string> = {
    system: 'bg-primary/10 text-primary-600 ring-primary/20 dark:bg-primary/20 dark:text-primary-300 dark:ring-primary/30',
    human: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10',
    alert: 'bg-accent/10 text-accent-600 ring-accent/20 dark:bg-accent/20 dark:text-accent-300 dark:ring-accent/30',
};

export function ControlTowerConsole() {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = window.setInterval(() => setTick((t) => t + 1), 1900);
        return () => window.clearInterval(id);
    }, []);

    const activeStage = tick % STAGES.length;
    const feed = Array.from({ length: 5 }, (_, i) => {
        const event = AUDIT_EVENTS[(tick + AUDIT_EVENTS.length - i) % AUDIT_EVENTS.length];
        return { ...event, key: `${tick - i}` };
    });

    return (
        <div className="relative">
            {/* Ambient glow */}
            <div
                aria-hidden
                className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(77,20,140,0.22),transparent_70%)] blur-2xl dark:bg-[radial-gradient(60%_60%_at_50%_40%,rgba(122,45,185,0.35),transparent_70%)]"
            />

            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0c]/90">
                {/* Title bar */}
                <div className="flex items-center justify-between border-b border-gray-200/80 bg-gray-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5" aria-hidden>
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
                        </div>
                        <span className="font-mono text-[11px] tracking-tight text-gray-500 dark:text-gray-500">
                            control-tower / ingestion-pipeline
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 ring-1 ring-inset ring-success/20">
                        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-success motion-reduce:animate-none" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-success-700 dark:text-success">
                            Live
                        </span>
                    </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Pipeline */}
                    <div className="border-b border-gray-200/80 p-5 lg:border-b-0 lg:border-r dark:border-white/10">
                        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-600">
                            Enforced intake path
                        </p>
                        <ol className="relative space-y-1">
                            {STAGES.map((stage, i) => {
                                const Icon = stage.icon;
                                const isActive = i === activeStage;
                                const isDone = i < activeStage;
                                return (
                                    <li key={stage.label} className="relative flex gap-3 pb-1">
                                        {i < STAGES.length - 1 && (
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'absolute left-[15px] top-8 h-[calc(100%-14px)] w-px transition-colors duration-500',
                                                    isDone
                                                        ? 'bg-primary/40'
                                                        : 'bg-gray-200 dark:bg-white/10'
                                                )}
                                            />
                                        )}
                                        <span
                                            className={cn(
                                                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-500',
                                                isActive
                                                    ? 'border-primary/40 bg-primary text-white shadow-[0_0_0_4px_rgba(77,20,140,0.12)]'
                                                    : isDone
                                                      ? 'border-primary/25 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300'
                                                      : 'border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-600'
                                            )}
                                        >
                                            {isDone ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                <Icon className="h-4 w-4" />
                                            )}
                                        </span>
                                        <div className="min-w-0 pt-0.5">
                                            <p
                                                className={cn(
                                                    'text-[13px] font-medium transition-colors duration-500',
                                                    isActive || isDone
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-gray-500 dark:text-gray-500'
                                                )}
                                            >
                                                {stage.label}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-500">
                                                {stage.detail}
                                            </p>
                                            <span className="mt-1 inline-block rounded font-mono text-[10px] text-primary-600 dark:text-primary-300">
                                                {stage.meta}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    {/* Audit stream */}
                    <div className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-600">
                                Audit trail
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-600">
                                <ShieldCheck className="h-3 w-3" />
                                append-only
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {feed.map((event, i) => (
                                <li
                                    key={event.key}
                                    style={{ opacity: 1 - i * 0.17 }}
                                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2 transition-all duration-500 dark:border-white/[0.06] dark:bg-white/[0.02]"
                                >
                                    <span
                                        className={cn(
                                            'shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ring-1 ring-inset',
                                            TONE_STYLES[event.tone]
                                        )}
                                    >
                                        {event.actor}
                                    </span>
                                    <span className="truncate font-mono text-[11px] text-gray-700 dark:text-gray-300">
                                        {event.action}
                                    </span>
                                    <span className="ml-auto shrink-0 truncate font-mono text-[10px] text-gray-400 dark:text-gray-600">
                                        {event.target}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Metric strip */}
                <div className="grid grid-cols-3 border-t border-gray-200/80 divide-x divide-gray-200/80 dark:divide-white/10 dark:border-white/10">
                    {[
                        { label: 'SLA on track', value: '96.4%', tone: 'text-success' },
                        { label: 'Breaches open', value: '12', tone: 'text-accent' },
                        { label: 'Queue depth', value: '1,284', tone: 'text-gray-900 dark:text-white' },
                    ].map((m) => (
                        <div key={m.label} className="px-4 py-3">
                            <p className={cn('text-lg font-semibold tabular-nums', m.tone)}>
                                {m.value}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
                                {m.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-600">
                Illustrative view of the ingestion pipeline. Sample data.
            </p>
        </div>
    );
}
