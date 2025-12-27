import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { DashboardLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';

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

    return (
        <DashboardLayout
            userEmail={user.email}
            userAvatarUrl={user.user_metadata?.avatar_url}
            userRole="FedEx Admin"
        >
            {children}
        </DashboardLayout>
    );
}
