import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { DashboardLayout } from '@/components/layout';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Role to display label mapping
const ROLE_LABELS: Record<string, string> = {
    'SUPER_ADMIN': 'Super Administrator',
    'FEDEX_ADMIN': 'FedEx Administrator',
    'FEDEX_MANAGER': 'FedEx Manager',
    'FEDEX_ANALYST': 'FedEx Analyst',
    'DCA_ADMIN': 'DCA Administrator',
    'DCA_MANAGER': 'DCA Manager',
    'DCA_AGENT': 'DCA Agent',
    'AUDITOR': 'Auditor',
    'READONLY': 'Read Only',
};

export default async function DashboardGroupLayout({
    children,
}: {
    children: ReactNode;
}) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error ?? !user) {
        redirect('/login?redirect=/dashboard');
    }

    // Use admin client to bypass RLS for role lookup
    // This is required because auth.uid() doesn't match seed user IDs
    const adminSupabase = createAdminClient();

    // Fetch user's role from database
    let rawRole = 'READONLY';
    let userRoleLabel = 'User';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbUser } = await (adminSupabase as any)
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (dbUser?.role) {
        rawRole = dbUser.role;
        userRoleLabel = ROLE_LABELS[dbUser.role] || dbUser.role;
    }

    return (
        <DashboardLayout
            userEmail={user.email}
            userAvatarUrl={user.user_metadata?.avatar_url}
            userRole={rawRole}
            userRoleLabel={userRoleLabel}
        >
            {children}
        </DashboardLayout>
    );
}


