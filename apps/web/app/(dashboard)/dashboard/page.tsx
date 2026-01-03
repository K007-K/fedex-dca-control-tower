import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getCurrentUser } from '@/lib/auth';
import { type UserRole } from '@/lib/auth/rbac';

export default async function DashboardPage() {
    const user = await getCurrentUser();
    const userRole = (user?.role || 'FEDEX_VIEWER') as UserRole;

    return <DashboardClient userRole={userRole} />;
}
