import { Ban, DatabaseZap, FileLock2, Layers3, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const IMMUTABLE_COLUMNS = [
    { column: 'region_id', why: 'Jurisdiction cannot be moved after write' },
    { column: 'external_case_id', why: 'Upstream identity is permanent and unique' },
    { column: 'source_system', why: 'Provenance survives every downstream edit' },
    { column: 'actor_type', why: 'Who acted can never be rewritten' },
];

const CREATE_MATRIX: Array<{ role: string; verdict: 'ALLOWED' | 'EXCEPTION' | 'DENIED' }> = [
    { role: 'SYSTEM', verdict: 'ALLOWED' },
    { role: 'FEDEX_ADMIN', verdict: 'EXCEPTION' },
    { role: 'SUPER_ADMIN', verdict: 'DENIED' },
    { role: 'FEDEX_MANAGER', verdict: 'DENIED' },
    { role: 'DCA_ADMIN', verdict: 'DENIED' },
    { role: 'DCA_AGENT', verdict: 'DENIED' },
];

const VERDICT_STYLES: Record<string, string> = {
    ALLOWED:
        'bg-success/10 text-success-700 ring-success/20 dark:text-success',
    EXCEPTION:
        'bg-accent/10 text-accent-700 ring-accent/20 dark:bg-accent/15 dark:text-accent-300 dark:ring-accent/25',
    DENIED:
        'bg-gray-100 text-gray-500 ring-gray-200 dark:bg-white/5 dark:text-gray-500 dark:ring-white/10',
};

export function GovernanceModel() {
    return (
        <section id="governance" className="relative scroll-mt-20 border-t border-gray-200/80 py-24 sm:py-32 dark:border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="The governance model"
                    title="Controls the database enforces — not the documentation."
                    description="Most platforms describe their guardrails in a policy document. The Control Tower encodes them in Postgres: intake is machine-led, governance columns are immutable at the row level, and every mutation writes an actor-identified audit record."
                />

                <div className="mt-14 grid gap-5 lg:grid-cols-5">
                    {/* SYSTEM-only intake */}
                    <Reveal className="lg:col-span-3">
                        <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-soft transition-shadow hover:shadow-elevated dark:border-white/10 dark:bg-white/[0.02]">
                            <div
                                aria-hidden
                                className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20"
                            />
                            <div className="relative">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300">
                                    <Ban className="h-5 w-5" />
                                </span>
                                <h3 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                    Creating a case is not a privilege of rank.
                                </h3>
                                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                                    Cases enter through an authenticated upstream service token, with
                                    schema validation, idempotency and region resolution all running
                                    before a row exists. Exactly one human role — FEDEX_ADMIN — may
                                    open a case by exception, and only with written justification
                                    recorded against it. Seniority buys nothing here: SUPER_ADMIN,
                                    every manager and every collection agent are refused outright.
                                </p>

                                <div className="mt-7 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                                        <span className="font-mono text-[11px] text-gray-500 dark:text-gray-500">
                                            permission · cases.create
                                        </span>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600">
                                            backend-enforced
                                        </span>
                                    </div>
                                    <ul className="divide-y divide-gray-100 dark:divide-white/5">
                                        {CREATE_MATRIX.map((row) => (
                                            <li
                                                key={row.role}
                                                className="flex items-center justify-between px-4 py-2.5"
                                            >
                                                <span className="font-mono text-[12px] text-gray-700 dark:text-gray-300">
                                                    {row.role}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                                        VERDICT_STYLES[row.verdict]
                                                    )}
                                                >
                                                    {row.verdict === 'EXCEPTION'
                                                        ? 'BY EXCEPTION'
                                                        : row.verdict}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Immutability + isolation */}
                    <div className="flex flex-col gap-5 lg:col-span-2">
                        <Reveal delay={80}>
                            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-600 dark:bg-accent/15 dark:text-accent-300">
                                    <FileLock2 className="h-5 w-5" />
                                </span>
                                <h3 className="mt-5 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                                    Four columns nothing can rewrite
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    Database triggers reject any update to the fields that define
                                    jurisdiction, identity and provenance.
                                </p>
                                <ul className="mt-5 space-y-2.5">
                                    {IMMUTABLE_COLUMNS.map((item) => (
                                        <li key={item.column} className="flex items-start gap-2.5">
                                            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600 dark:text-accent-300" />
                                            <div>
                                                <code className="font-mono text-[12px] font-medium text-gray-900 dark:text-white">
                                                    {item.column}
                                                </code>
                                                <p className="text-[12px] leading-snug text-gray-500 dark:text-gray-500">
                                                    {item.why}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>

                        <Reveal delay={160}>
                            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-soft dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-info/10 text-info-600 dark:bg-info/15 dark:text-info">
                                    <Layers3 className="h-5 w-5" />
                                </span>
                                <h3 className="mt-5 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                                    Region × Role × Org isolation
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    Row-level security policies scope every query to the caller&apos;s
                                    region, agency and role. An agent sees assigned cases; a DCA admin
                                    sees their agency; nobody sees across a boundary they do not own.
                                </p>
                                <div className="mt-5 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-white/[0.03]">
                                    <DatabaseZap className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-600" />
                                    <span className="font-mono text-[11px] text-gray-600 dark:text-gray-400">
                                        enforced in Postgres, not in the client
                                    </span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
