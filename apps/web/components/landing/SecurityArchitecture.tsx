import { CheckCircle2 } from 'lucide-react';

import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const CONTROLS = [
    {
        title: 'MFA on privileged roles',
        body: 'Multi-factor authentication is enforced for administrators, not offered as a setting they can decline.',
    },
    {
        title: 'Authorisation checked server-side',
        body: 'Thirty-six permissions are evaluated in the API layer, and sensitive routes re-check the role on top. A hidden button is a courtesy; the denial happens on the server.',
    },
    {
        title: 'Row-level security everywhere',
        body: 'Postgres policies scope reads and writes to the caller’s region, agency and role — even for direct queries.',
    },
    {
        title: 'Idempotent ingestion',
        body: 'A unique index on the upstream identifier means a replayed message can never become a second case.',
    },
    {
        title: 'Append-only audit log',
        body: 'Audit rows carry actor type and identity, and the creation timestamp is protected from modification.',
    },
    {
        title: 'Governance suite in CI',
        body: 'A suite of 109 security-focused tests covers RBAC, authentication, region isolation and the ingestion boundary on every change.',
    },
];

const STACK = [
    { layer: 'Interface', value: 'Next.js 14 · App Router · TypeScript' },
    { layer: 'Design system', value: 'Tailwind CSS · Radix primitives' },
    { layer: 'State & data', value: 'React Query · Zustand · realtime subscriptions' },
    { layer: 'Authorisation', value: 'Custom RBAC · 11 roles · 36 permissions' },
    { layer: 'Data', value: 'Supabase PostgreSQL · RLS · immutability triggers' },
    { layer: 'Identity', value: 'Supabase Auth · MFA for privileged roles' },
    { layer: 'Intelligence', value: 'Dedicated ML service · advisory scoring only' },
];

export function SecurityArchitecture() {
    return (
        <section
            id="security"
            className="relative scroll-mt-20 border-t border-gray-200/80 bg-gray-50/50 py-24 sm:py-32 dark:border-white/10 dark:bg-white/[0.015]"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Security & compliance"
                    title="Built to be audited, not just to pass an audit."
                    description="The controls below are properties of the system rather than operating procedures. They hold whether or not anyone is watching the dashboard."
                />

                <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {CONTROLS.map((control, i) => (
                            <Reveal key={control.title} delay={(i % 2) * 70}>
                                <div className="h-full rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                                    <div className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                        <h3 className="text-[15px] font-semibold leading-snug text-gray-900 dark:text-white">
                                            {control.title}
                                        </h3>
                                    </div>
                                    <p className="mt-2 pl-[26px] text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                                        {control.body}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={120}>
                        <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Architecture
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                                    Every layer inherits the same boundaries
                                </p>
                            </div>
                            <ul className="divide-y divide-gray-100 dark:divide-white/5">
                                {STACK.map((row) => (
                                    <li key={row.layer} className="px-6 py-3.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600">
                                            {row.layer}
                                        </p>
                                        <p className="mt-1 text-[13px] text-gray-800 dark:text-gray-300">
                                            {row.value}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
