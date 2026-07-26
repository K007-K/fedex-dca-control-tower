import type { Metadata } from 'next';

import { Capabilities } from '@/components/landing/Capabilities';
import { CtaSection } from '@/components/landing/CtaSection';
import { GovernanceModel } from '@/components/landing/GovernanceModel';
import { Hero } from '@/components/landing/Hero';
import { IngestionContract } from '@/components/landing/IngestionContract';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';
import { Lifecycle } from '@/components/landing/Lifecycle';
import { MetricsBand } from '@/components/landing/MetricsBand';
import { SecurityArchitecture } from '@/components/landing/SecurityArchitecture';
import { WorkbenchSection } from '@/components/landing/WorkbenchSection';

export const metadata: Metadata = {
    title: 'FedEx DCA Control Tower — Enterprise Debt Collection Governance',
    description:
        'Governance-first management of debt collection operations across agencies, regions and organisational boundaries. SYSTEM-only case intake, immutable audit trail, and role-based workbenches enforced in the database.',
};

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-black">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
                Skip to content
            </a>

            <LandingNav />

            <main id="main" className="flex-1">
                <Hero />
                <MetricsBand />
                <GovernanceModel />
                <IngestionContract />
                <Capabilities />
                <WorkbenchSection />
                <Lifecycle />
                <SecurityArchitecture />
                <CtaSection />
            </main>

            <LandingFooter />
        </div>
    );
}
