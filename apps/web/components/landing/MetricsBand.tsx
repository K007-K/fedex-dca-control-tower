import { Reveal } from './Reveal';

const METRICS = [
    { value: '11', label: 'Governed roles', sub: '9 active · 2 legacy aliases' },
    { value: '36', label: 'Discrete permissions', sub: 'Checked server-side' },
    { value: '12', label: 'Immutability triggers', sub: 'Cases · users · regions' },
    { value: '109', label: 'Governance tests', sub: 'RBAC · auth · ingestion' },
    { value: '500+', label: 'Agencies in scope', sub: 'Design scale target' },
];

export function MetricsBand() {
    return (
        <section className="relative border-y border-gray-200/80 bg-gray-50/60 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <dl className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0 lg:divide-x lg:divide-gray-200/80 dark:lg:divide-white/10">
                    {METRICS.map((metric, i) => (
                        <Reveal key={metric.label} delay={i * 60}>
                            <div className="px-5 py-8 sm:px-6">
                                <dd className="font-mono text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                    {metric.value}
                                </dd>
                                <dt className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {metric.label}
                                </dt>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                    {metric.sub}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </dl>
            </div>
        </section>
    );
}
