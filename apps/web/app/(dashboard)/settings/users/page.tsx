import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const roleColors: Record<string, { bg: string; text: string }> = {
    SUPER_ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800' },
    FEDEX_ADMIN: { bg: 'bg-blue-100', text: 'text-blue-800' },
    FEDEX_MANAGER: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    FEDEX_ANALYST: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    DCA_ADMIN: { bg: 'bg-orange-100', text: 'text-orange-800' },
    DCA_MANAGER: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    DCA_AGENT: { bg: 'bg-green-100', text: 'text-green-800' },
    AUDITOR: { bg: 'bg-gray-100', text: 'text-gray-800' },
    READONLY: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    FEDEX_ADMIN: 'FedEx Admin',
    FEDEX_MANAGER: 'FedEx Manager',
    FEDEX_ANALYST: 'FedEx Analyst',
    DCA_ADMIN: 'DCA Admin',
    DCA_MANAGER: 'DCA Manager',
    DCA_AGENT: 'DCA Agent',
    AUDITOR: 'Auditor',
    READONLY: 'Read Only',
};

export default async function UsersSettingsPage() {
    const supabase = await createClient();

    // Fetch users with organization/dca info
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id,
            email,
            full_name,
            role,
            is_active,
            last_login_at,
            created_at,
            organization:organizations(name),
            dca:dcas(name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch users:', error);
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 mb-2">
                        <Link href="/settings" className="hover:text-primary">Settings</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">User Management</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage users and assign roles</p>
                </div>
                <Link
                    href="/settings/users/new"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                    + Add User
                </Link>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users?.map((user) => {
                            const roleColor = roleColors[user.role] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
                            const roleLabel = roleLabels[user.role] ?? user.role;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const orgName = (user.organization as any)?.name ?? (user.dca as any)?.name ?? '—';

                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{user.full_name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColor.bg} ${roleColor.text}`}>
                                            {roleLabel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {orgName}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${user.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.last_login_at
                                            ? new Date(user.last_login_at).toLocaleDateString()
                                            : 'Never'
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/settings/users/${user.id}/edit`}
                                            className="text-primary hover:text-primary-700 font-medium text-sm"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!users || users.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
