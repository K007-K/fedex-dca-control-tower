import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getCurrentUser } from '@/lib/auth';
import { guardPage } from '@/lib/auth/page-guard';
import { type UserRole } from '@/lib/auth/rbac';

export default async function DashboardPage() {
    // GOVERNANCE: Redirect DCA_AGENT to /agent/dashboard
    await guardPage('/dashboard');

    const user = await getCurrentUser();
    const userRole = (user?.role || 'FEDEX_VIEWER') as UserRole;

    return <DashboardClient userRole={userRole} />;
}
