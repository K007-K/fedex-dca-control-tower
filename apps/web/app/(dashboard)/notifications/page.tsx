import { createClient } from '@/lib/supabase/server';
import { NotificationsList } from '@/components/notifications';

export default async function NotificationsPage() {
    const supabase = await createClient();

    // Fetch notifications for the current user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notifications } = await (supabase as any)
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

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
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500">Stay updated on case activities and alerts</p>
                </div>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    ⚙️ Preferences
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                            🔔
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Unread</p>
                            <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                            📅
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Today</p>
                            <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                            📬
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{notifications?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <NotificationsList notifications={notifications || []} />
            </div>
        </div>
    );
}
