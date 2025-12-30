import { NotificationsList } from '@/components/notifications';
import { NotificationActions } from '@/components/notifications/NotificationActions';
import { createClient } from '@/lib/supabase/server';

export default async function NotificationsPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();

    let userId = authUser?.id || null;

    // Get database user ID by email (important: auth.uid != users.id for seed data)
    if (authUser?.email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', authUser.email)
            .single();

        if (profile?.id) {
            userId = profile.id;
        }
    }

    // Fetch notifications for the CURRENT user only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    // Filter by user if we have their ID
    if (userId) {
        query = query.eq('recipient_id', userId);
    }

    const { data: notifications } = await query;

    // Calculate stats
    const unreadCount = notifications?.filter((n: { is_read: boolean }) => !n.is_read).length || 0;
    const todayCount = notifications?.filter((n: { created_at: string }) => {
        const created = new Date(n.created_at);
        const today = new Date();
        return created.toDateString() === today.toDateString();
    }).length || 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <p className="text-gray-500 dark:text-gray-400">Stay updated on case activities and alerts</p>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationActions hasNotifications={(notifications?.length || 0) > 0} />
                    <a
                        href="/settings/notifications"
                        className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                        ⚙️ Preferences
                    </a>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center text-xl">
                            🔔
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Unread</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">
                            📅
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center text-xl">
                            📬
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <NotificationsList notifications={notifications || []} />
            </div>
        </div>
    );
}
