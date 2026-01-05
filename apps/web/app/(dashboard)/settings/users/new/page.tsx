'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { LocationSearch } from '@/components/ui/LocationSearch';

// =====================================================
// ROLE DEFINITIONS - MATCHING API BUSINESS RULES
// =====================================================
// FedEx can create: FEDEX roles + DCA_ADMIN
// DCA_ADMIN can create: DCA_MANAGER, DCA_AGENT only

interface RoleDefinition {
    value: string;
    label: string;
    org: 'fedex' | 'dca' | 'any';
    level: number;
    fedexCanCreate: boolean;
    dcaAdminCanCreate: boolean;
}

const ALL_ROLES: RoleDefinition[] = [
    // READONLY: Uses personal email for login (external users)
    { value: 'READONLY', label: 'Read Only', org: 'any', level: 10, fedexCanCreate: true, dcaAdminCanCreate: false },
    { value: 'DCA_AGENT', label: 'DCA Agent', org: 'dca', level: 20, fedexCanCreate: false, dcaAdminCanCreate: true },
    // FEDEX_AUDITOR: Uses @fedex.com (internal FedEx auditors)
    { value: 'FEDEX_AUDITOR', label: 'FedEx Auditor', org: 'fedex', level: 30, fedexCanCreate: true, dcaAdminCanCreate: false },
    { value: 'DCA_MANAGER', label: 'DCA Manager', org: 'dca', level: 40, fedexCanCreate: false, dcaAdminCanCreate: true },
    { value: 'FEDEX_ANALYST', label: 'FedEx Analyst', org: 'fedex', level: 50, fedexCanCreate: true, dcaAdminCanCreate: false },
    { value: 'DCA_ADMIN', label: 'DCA Admin', org: 'dca', level: 60, fedexCanCreate: true, dcaAdminCanCreate: false },
    { value: 'FEDEX_MANAGER', label: 'FedEx Manager', org: 'fedex', level: 70, fedexCanCreate: true, dcaAdminCanCreate: false },
    { value: 'FEDEX_ADMIN', label: 'FedEx Admin', org: 'fedex', level: 90, fedexCanCreate: true, dcaAdminCanCreate: false },
];

const ROLE_HIERARCHY: Record<string, number> = {
    'SUPER_ADMIN': 100,
    'FEDEX_ADMIN': 90,
    'FEDEX_MANAGER': 70,
    'FEDEX_ANALYST': 50,
    'DCA_ADMIN': 60,
    'DCA_MANAGER': 40,
    'FEDEX_AUDITOR': 30,
    'DCA_AGENT': 20,
    'READONLY': 10,
};

interface DCA {
    id: string;
    name: string;
    region?: string;
}

interface Region {
    id: string;
    name: string;
    region_code: string;
}

interface CurrentUser {
    role: string;
    dcaId?: string;
    dcaName?: string;
}

interface CreatedUserResult {
    email: string;
    tempPassword: string;
    fullName: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dcas, setDcas] = useState<DCA[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [dcaOperatingRegions, setDcaOperatingRegions] = useState<string[]>([]); // DCA's operating region IDs
    const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        personalEmail: '',
        corporateEmail: '', // For DCA roles - manual entry
        role: '',
        dcaId: '',
        regionId: '',
        regionIds: [] as string[], // For FEDEX_ADMIN multi-region
        phone: '',
    });

    // Fetch current user's role to determine available roles
    useEffect(() => {
        async function fetchCurrentUser() {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser({
                        role: data.user?.role || 'READONLY',
                        dcaId: data.user?.dca_id || undefined,
                    });
                    // If DCA user, pre-select their DCA
                    if (data.user?.dca_id) {
                        setFormData(prev => ({ ...prev, dcaId: data.user.dca_id }));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch current user:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCurrentUser();
    }, []);

    // Fetch DCAs for dropdown (only if FedEx user creating DCA_ADMIN)
    useEffect(() => {
        async function fetchDcas() {
            try {
                const response = await fetch('/api/dcas');
                if (response.ok) {
                    const data = await response.json();
                    setDcas(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch DCAs:', error);
            }
        }
        fetchDcas();
    }, []);

    // Fetch regions for FedEx user creation
    useEffect(() => {
        async function fetchRegions() {
            try {
                const response = await fetch('/api/regions');
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        setRegions(data.data);
                    } else {
                        // Fallback to hardcoded regions if API returns empty
                        setRegions([
                            { id: 'INDIA', name: 'India', region_code: 'INDIA' },
                            { id: 'AMERICAS', name: 'Americas', region_code: 'AMERICAS' },
                            { id: 'EMEA', name: 'Europe, Middle East & Africa', region_code: 'EMEA' },
                            { id: 'APAC', name: 'Asia Pacific', region_code: 'APAC' },
                        ]);
                    }
                } else {
                    // Fallback if API fails
                    setRegions([
                        { id: 'INDIA', name: 'India', region_code: 'INDIA' },
                        { id: 'AMERICAS', name: 'Americas', region_code: 'AMERICAS' },
                        { id: 'EMEA', name: 'Europe, Middle East & Africa', region_code: 'EMEA' },
                        { id: 'APAC', name: 'Asia Pacific', region_code: 'APAC' },
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch regions:', error);
                // Fallback on error
                setRegions([
                    { id: 'INDIA', name: 'India', region_code: 'INDIA' },
                    { id: 'AMERICAS', name: 'Americas', region_code: 'AMERICAS' },
                    { id: 'EMEA', name: 'Europe, Middle East & Africa', region_code: 'EMEA' },
                    { id: 'APAC', name: 'Asia Pacific', region_code: 'APAC' },
                ]);
            }
        }
        fetchRegions();
    }, []);

    // Check if current user is FedEx or DCA
    const isFedExUser = useMemo(() => {
        if (!currentUser) return false;
        return ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST'].includes(currentUser.role);
    }, [currentUser]);

    const isDCAUser = useMemo(() => {
        if (!currentUser) return false;
        return ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(currentUser.role);
    }, [currentUser]);

    // Get available roles based on current user's role and business rules
    const getAvailableRoles = useMemo(() => {
        if (!currentUser) return [];

        const currentLevel = ROLE_HIERARCHY[currentUser.role] || 0;

        // Filter roles that are:
        // 1. Lower than current user's level
        // 2. Allowed based on FedEx/DCA creation rules
        return ALL_ROLES.filter(role => {
            // Must be lower level
            if (role.level >= currentLevel) return false;

            // Apply FedEx/DCA creation rules
            if (currentUser.role === 'DCA_ADMIN') {
                return role.dcaAdminCanCreate;
            } else if (isFedExUser) {
                return role.fedexCanCreate;
            }

            return false;
        });
    }, [currentUser, isFedExUser]);

    const selectedRoleInfo = ALL_ROLES.find(r => r.value === formData.role);
    const isDCARole = selectedRoleInfo?.org === 'dca';
    const isFedExRole = selectedRoleInfo?.org === 'fedex';
    const isReadOnlyRole = formData.role === 'READONLY'; // Uses personal email for login
    // GOVERNANCE: No region selectors - region derived from dca_id
    const showDCASelector = isFedExUser && formData.role === 'DCA_ADMIN';


    // Set default role when available roles are loaded
    useEffect(() => {
        if (getAvailableRoles.length > 0 && !formData.role) {
            setFormData(prev => ({ ...prev, role: getAvailableRoles[0].value }));
        }
    }, [getAvailableRoles, formData.role]);

    // Fetch DCA operating regions when DCA is selected (for DCA_ADMIN creation)
    useEffect(() => {
        async function fetchDcaOperatingRegions() {
            if (!formData.dcaId || formData.role !== 'DCA_ADMIN') {
                setDcaOperatingRegions([]);
                return;
            }

            try {
                // Fetch region_dca_assignments for this DCA
                const response = await fetch(`/api/dcas/${formData.dcaId}/regions`);
                if (response.ok) {
                    const data = await response.json();
                    // Extract region IDs from assignments
                    const regionIds = data.regions?.map((r: { region_id: string }) => r.region_id) || [];
                    setDcaOperatingRegions(regionIds);
                    // Auto-clear selected regions that are not in DCA's operating regions
                    setFormData(prev => ({
                        ...prev,
                        regionIds: prev.regionIds.filter(id => regionIds.includes(id))
                    }));
                } else {
                    console.error('Failed to fetch DCA regions');
                    setDcaOperatingRegions([]);
                }
            } catch (error) {
                console.error('Error fetching DCA regions:', error);
                setDcaOperatingRegions([]);
            }
        }
        fetchDcaOperatingRegions();
    }, [formData.dcaId, formData.role]);

    // Get filtered regions based on context
    const availableRegions = useMemo(() => {
        // For DCA_ADMIN creation: only show DCA's operating regions
        if (formData.role === 'DCA_ADMIN' && formData.dcaId && dcaOperatingRegions.length > 0) {
            return regions.filter(r => dcaOperatingRegions.includes(r.id));
        }
        // For FedEx roles: show all regions
        return regions;
    }, [regions, formData.role, formData.dcaId, dcaOperatingRegions]);

    // Generate work email for FEDEX roles ONLY (uses @fedex.com)
    // READONLY uses personal email for login
    const generatedFedExEmail = formData.firstName && formData.lastName && isFedExRole
        ? `${formData.firstName.toLowerCase().replace(/\s+/g, '')}.${formData.lastName.toLowerCase().replace(/\s+/g, '')}@fedex.com`
        : '';

    // Determine which email to use based on role:
    // - FedEx roles: auto-generated @fedex.com
    // - DCA roles: manual corporate email entry
    // - READONLY: personal email (for external users)
    const emailToSubmit = isReadOnlyRole
        ? formData.personalEmail
        : (isDCARole ? formData.corporateEmail : generatedFedExEmail);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;




            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailToSubmit,
                    full_name: fullName,
                    role: formData.role,
                    phone: formData.phone || null,
                    personal_email: formData.personalEmail || null,
                    // ENTERPRISE MODEL: Explicit region assignment
                    // All users get explicit region_ids (except SUPER_ADMIN who has all)
                    region_ids: formData.regionIds.length > 0 ? formData.regionIds : undefined,
                    // DCA roles: dca_id required
                    dca_id: isDCARole ? (showDCASelector ? formData.dcaId : undefined) : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            // Show credentials modal
            setCreatedUser({
                email: emailToSubmit,
                tempPassword: data.tempPassword,
                fullName: fullName,
            });

            toast.success('User Created', `Account created for ${fullName}`);

        } catch (err) {
            toast.error('Error', err instanceof Error ? err.message : 'Failed to create user');
            setIsSubmitting(false);
        }
    };

    const handleCloseCredentials = () => {
        setCreatedUser(null);
        router.push('/settings/users');
        router.refresh();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied!', 'Credentials copied to clipboard');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (getAvailableRoles.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Link href="/settings" className="hover:text-primary">Settings</Link>
                        <span className="mx-2">/</span>
                        <Link href="/settings/users" className="hover:text-primary">Users</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 dark:text-white">New User</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-2">
                        ⚠️ Permission Denied
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                        Your role ({currentUser?.role?.replace(/_/g, ' ')}) does not have permission to create new users.
                    </p>
                    <Link href="/settings/users" className="mt-4 inline-block">
                        <Button variant="outline">← Back to Users</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings" className="hover:text-primary">Settings</Link>
                    <span className="mx-2">/</span>
                    <Link href="/settings/users" className="hover:text-primary">Users</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">New User</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
                <p className="text-gray-500 dark:text-gray-400">Add a new employee to the system</p>
            </div>

            {/* Permission Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                    ℹ️ As a <strong>{currentUser?.role?.replace(/_/g, ' ')}</strong>, you can create: {' '}
                    <span className="font-medium">{getAvailableRoles.map(r => r.label).join(', ')}</span>
                </p>
                {isDCAUser && (
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        🏢 Users will be automatically assigned to your DCA and inherit its region.
                    </p>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 max-w-2xl">
                <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="John"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Doe"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Email Display - Role-aware */}
                    {/* FedEx roles: Auto-generated @fedex.com */}
                    {isFedExRole && generatedFedExEmail && (
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#333]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Work Email (auto-generated)
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-primary font-mono text-lg">{generatedFedExEmail}</span>
                                <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">@fedex.com</span>
                            </div>
                        </div>
                    )}

                    {/* DCA roles: Manual corporate email entry */}
                    {isDCARole && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Corporate Email (DCA-owned) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.corporateEmail}
                                onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                                placeholder="name@your-dca-company.com"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Must belong to DCA organization. No @fedex.com or personal emails (gmail, yahoo, etc).
                            </p>
                        </div>
                    )}

                    {/* READONLY role: Uses personal email for login (external users) */}
                    {isReadOnlyRole && (
                        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
                            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                                ℹ️ Read Only users use their personal email for login (external access).
                            </p>
                        </div>
                    )}

                    {/* Personal Email - REQUIRED for credential delivery */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isReadOnlyRole ? 'Login Email' : 'Personal Email'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.personalEmail}
                            onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                            placeholder={isReadOnlyRole ? 'user@email.com' : 'personal@gmail.com'}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {isReadOnlyRole
                                ? 'This email will be used for login. Credentials will be sent here.'
                                : 'Credentials will be sent to this email.'}
                        </p>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value, dcaId: '', regionId: '' })}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        >
                            {getAvailableRoles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DCA Selection (only for FedEx creating DCA_ADMIN) */}
                    {showDCASelector && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assign to DCA <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.dcaId}
                                onChange={(e) => setFormData({ ...formData, dcaId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            >
                                <option value="">Select a DCA...</option>
                                {dcas.map((dca) => (
                                    <option key={dca.id} value={dca.id}>
                                        {dca.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                The user&apos;s region will be inherited from the DCA.
                            </p>
                        </div>
                    )}

                    {/* ENTERPRISE MODEL: Explicit Region Selection */}
                    {/* Hide for DCA Admin creating DCA roles - they inherit region from DCA */}
                    {availableRegions.length > 0 && !(isDCAUser && isDCARole) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Regions <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Select one or more regions this user will have access to.
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-[#333] rounded-lg p-3">
                                {availableRegions.map(region => (
                                    <label key={region.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.regionIds.includes(region.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, regionIds: [...formData.regionIds, region.id] });
                                                } else {
                                                    setFormData({ ...formData, regionIds: formData.regionIds.filter(id => id !== region.id) });
                                                }
                                            }}
                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{region.name}</span>
                                    </label>
                                ))}
                            </div>
                            {formData.regionIds.length > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                    ✓ {formData.regionIds.length} region(s) selected
                                </p>
                            )}
                        </div>
                    )}

                    {/* DCA Info for DCA users (read-only) */}
                    {isDCAUser && isDCARole && (
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#333]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                DCA Assignment
                            </label>
                            <p className="text-gray-700 dark:text-gray-300">
                                ✓ User will be assigned to <strong>your DCA</strong> and inherit its region.
                            </p>
                        </div>
                    )}

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#222] flex items-center gap-3">
                    <Button type="submit" disabled={isSubmitting || !emailToSubmit}>
                        {isSubmitting ? 'Creating...' : 'Create User'}
                    </Button>
                    <Link href="/settings/users">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>

            {/* Credentials Modal */}
            {createdUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#111] rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[#222]">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Created Successfully!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{createdUser.fullName}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 space-y-3 border border-gray-200 dark:border-[#333]">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Email</label>
                                <p className="font-mono text-primary font-medium">{createdUser.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Temporary Password</label>
                                <p className="font-mono text-gray-900 dark:text-white font-medium">{createdUser.tempPassword}</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                ⚠️ Save these credentials! Share them securely with the user.
                            </p>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                onClick={() => copyToClipboard(`Email: ${createdUser.email}\nPassword: ${createdUser.tempPassword}`)}
                                variant="outline"
                                className="flex-1"
                            >
                                📋 Copy Credentials
                            </Button>
                            <Button onClick={handleCloseCredentials} className="flex-1">
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
