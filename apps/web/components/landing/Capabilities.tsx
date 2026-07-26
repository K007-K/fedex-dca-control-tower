import {
    Activity,
    BarChart3,
    Brain,
    ScrollText,
    Split,
    Timer,
} from 'lucide-react';

import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const CAPABILITIES = [
    {
        icon: Split,
        title: 'Deterministic allocation',
        body: 'Cases route to an agency and an agent by capacity, specialisation and performance history — the same inputs always produce the same decision, and every decision is logged.',
    },
    {
        icon: Timer,
        title: 'SLA automation',
        body: 'Targets bind at intake. Breach detection runs continuously and escalates on its own, so a missed clock is an event in the system rather than a discovery in a meeting.',
    },
    {
        icon: Brain,
        title: 'Advisory risk scoring',
        body: 'A dedicated ML service predicts recovery difficulty and suggests priority. Scores inform the queue; they never silently reassign work or override a governed rule.',
    },
    {
        icon: ScrollText,
        title: 'Immutable audit trail',
        body: 'Every mutation writes actor type, actor identity, action, resource and timestamp to an append-only log — the evidence an auditor asks for, already assembled.',
    },
    {
        icon: Activity,
        title: 'Real-time operations',
        body: 'Case status, assignment changes and breach alerts propagate live through Supabase subscriptions, so every workbench shows the same truth at the same moment.',
    },
    {
        icon: BarChart3,
        title: 'Analytics & reporting',
        body: 'Recovery trends, cohort analysis and agency scorecards, with exportable reports scoped to whatever region and role the requester is permitted to see.',
    },
];

export function Capabilities() {
    return (
        <section
            id="platform"
            className="relative scroll-mt-20 border-t border-gray-200/80 bg-gray-50/50 py-24 sm:py-32 dark:border-white/10 dark:bg-white/[0.015]"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Platform"
                    title="Operational capability, built on top of the guarantees."
                    description="Automation is only safe when the boundaries underneath it hold. Each capability runs inside the same permission, region and audit model."
                />

                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {CAPABILITIES.map((cap, i) => {
                        const Icon = cap.icon;
                        return (
                            <Reveal key={cap.title} delay={(i % 3) * 80}>
                                <article className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-elevated dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-primary/40">
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    />
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white dark:bg-primary/20 dark:text-primary-300 dark:group-hover:bg-primary">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {cap.title}
                                    </h3>
                                    <p className="mt-2.5 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                                        {cap.body}
                                    </p>
                                </article>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
