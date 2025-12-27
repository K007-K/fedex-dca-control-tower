import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="border-b bg-white">
                <div className="page-container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <span className="text-lg font-bold text-white">F</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            DCA Control Tower
                        </span>
                    </div>
                    <Link
                        href="/login"
                        className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="page-container py-20 text-center">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                            Enterprise Debt Collection Management
                        </div>
                        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                            FedEx DCA{' '}
                            <span className="text-gradient">Control Tower</span>
                        </h1>
                        <p className="mb-10 text-xl text-gray-600">
                            Centralized command center for managing 500+ Debt Collection Agencies
                            across 50+ countries. AI-powered insights, real-time SLA monitoring,
                            and optimized recovery workflows.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
                            >
                                Access Dashboard
                                <svg
                                    className="ml-2 h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </Link>
                            <Link
                                href="#features"
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="border-t bg-white py-20">
                <div className="page-container">
                    <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
                        Enterprise-Grade Capabilities
                    </h2>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="rounded-xl border bg-white p-6 shadow-soft transition-shadow hover:shadow-elevated"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <span className="text-2xl">{feature.icon}</span>
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-gray-50 py-8">
                <div className="page-container text-center text-sm text-gray-600">
                    <p>© {new Date().getFullYear()} FedEx Corporation. All rights reserved.</p>
                    <p className="mt-2">
                        DCA Control Tower - Enterprise Debt Collection Management System
                    </p>
                </div>
            </footer>
        </div>
    );
}

const features = [
    {
        icon: '🎯',
        title: 'AI-Powered Scoring',
        description:
            'Machine learning models predict recovery probability and prioritize cases for optimal resource allocation.',
    },
    {
        icon: '⚡',
        title: 'Real-Time Monitoring',
        description:
            'Live dashboards with instant updates on case status, SLA compliance, and DCA performance metrics.',
    },
    {
        icon: '🔄',
        title: 'Smart Allocation',
        description:
            'Automated case routing based on DCA capacity, specialization, and historical performance.',
    },
    {
        icon: '📊',
        title: 'Advanced Analytics',
        description:
            'Comprehensive reporting with recovery trends, cohort analysis, and predictive forecasting.',
    },
    {
        icon: '🔒',
        title: 'Enterprise Security',
        description:
            'Role-based access control, audit logging, and compliance with SOC 2 and GDPR standards.',
    },
    {
        icon: '🌍',
        title: 'Global Scale',
        description:
            'Support for 500+ DCAs across 50+ countries with multi-currency and timezone handling.',
    },
];
