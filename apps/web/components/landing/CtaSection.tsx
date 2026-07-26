import { ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from './Reveal';

export function CtaSection() {
    return (
        <section className="relative border-t border-gray-200/80 py-24 sm:py-28 dark:border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary to-primary-600 px-6 py-16 text-center sm:px-16 sm:py-20">
                        {/* Decorative field */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
                        />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent/40 blur-[100px]"
                        />

                        <div className="relative mx-auto max-w-2xl">
                            <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-[42px]">
                                Bring the whole recovery estate under one control tower.
                            </h2>
                            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/75">
                                Sign in to your workbench. Every action you take from here is
                                permission-checked, region-scoped and written to the audit trail.
                            </p>
                            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Link
                                    href="/login"
                                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-800 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
                                >
                                    Enter Control Tower
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <span className="inline-flex items-center gap-2 text-sm text-white/60">
                                    <KeyRound className="h-4 w-4" />
                                    Access is provisioned by your administrator
                                </span>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
