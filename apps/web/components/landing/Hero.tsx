import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { ControlTowerConsole } from './ControlTowerConsole';
import { Reveal } from './Reveal';

const TRUST_ITEMS = [
    '11-role RBAC',
    'Postgres row-level security',
    '12 immutability triggers',
    'MFA enforced for admins',
    '109 governance tests',
];

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
            {/* Layered background */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-50/70 via-white to-white dark:from-primary-900/20 dark:via-black dark:to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
                <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 opacity-60 blur-[120px] dark:bg-primary-500/25" />
                <div className="absolute right-[12%] top-40 h-[280px] w-[280px] rounded-full bg-accent/20 opacity-50 blur-[110px] dark:bg-accent/15" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <Reveal>
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-primary-700 shadow-sm backdrop-blur dark:border-primary/30 dark:bg-white/5 dark:text-primary-300">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Governance-first · machine-led case intake
                        </span>
                    </Reveal>

                    <Reveal delay={80}>
                        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-gray-900 sm:text-6xl lg:text-[68px] dark:text-white">
                            Debt recovery operations,{' '}
                            <span className="bg-gradient-to-r from-primary via-primary-500 to-accent bg-clip-text text-transparent">
                                under provable control
                            </span>
                            .
                        </h1>
                    </Reveal>

                    <Reveal delay={160}>
                        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-gray-600 sm:text-xl dark:text-gray-400">
                            The FedEx DCA Control Tower governs collection cases across every agency,
                            region and role — with machine-led intake, an immutable audit trail, and
                            boundaries the database itself enforces.
                        </p>
                    </Reveal>

                    <Reveal delay={240}>
                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/login"
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 sm:w-auto dark:focus-visible:ring-offset-black"
                            >
                                Enter Control Tower
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <a
                                href="#governance"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white/70 px-7 py-3.5 text-base font-semibold text-gray-800 backdrop-blur transition-all hover:border-gray-400 hover:bg-white sm:w-auto dark:border-white/15 dark:bg-white/5 dark:text-gray-200 dark:hover:border-white/25 dark:hover:bg-white/10"
                            >
                                See the governance model
                            </a>
                        </div>
                    </Reveal>

                    <Reveal delay={320}>
                        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                            {TRUST_ITEMS.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-500"
                                >
                                    <span className="h-1 w-1 rounded-full bg-accent" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                </div>

                <Reveal delay={200} className="mt-16 sm:mt-20">
                    <div className="mx-auto max-w-5xl">
                        <ControlTowerConsole />
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
