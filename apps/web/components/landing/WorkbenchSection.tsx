import { SectionHeading } from './SectionHeading';
import { Workbenches } from './Workbenches';

export function WorkbenchSection() {
    return (
        <section
            id="workbenches"
            className="relative scroll-mt-20 border-t border-gray-200/80 py-24 sm:py-32 dark:border-white/10"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Role-based workbenches"
                    title="Everyone gets the surface their role justifies."
                    description="Not one dashboard with features greyed out — separate workbenches, each scoped to what that role is permitted to see and do. What is blocked is blocked in the API, not merely hidden in the UI."
                />
                <Workbenches />
            </div>
        </section>
    );
}
