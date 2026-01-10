/**
 * Seed Users via Signup API
 * Uses Supabase's regular signup flow which properly handles password hashing
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../apps/web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PASSWORD = 'Password123!';

interface User {
    email: string;
    full_name: string;
    role: string;
}

const USERS: User[] = [
    { email: 'system.admin@fedex.com', full_name: 'System Admin', role: 'SUPER_ADMIN' },
    { email: 'india.admin@fedex.com', full_name: 'India Admin', role: 'FEDEX_ADMIN' },
    { email: 'agent1@tatarecovery.in', full_name: 'Tata Agent 1', role: 'DCA_AGENT' },
    { email: 'agent2@tatarecovery.in', full_name: 'Tata Agent 2', role: 'DCA_AGENT' },
];

async function signupUser(user: User) {
    console.log(`Signing up: ${user.email}...`);

    // Use Supabase Auth REST API directly
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            email: user.email,
            password: PASSWORD,
            data: { full_name: user.full_name },
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.log(`  ❌ Failed: ${data.error || data.msg || JSON.stringify(data)}`);
        return null;
    }

    console.log(`  ✓ Created auth user: ${data.user?.id}`);
    return data.user?.id;
}

async function confirmEmail(userId: string) {
    // Confirm email using service role
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
            email_confirm: true,
        }),
    });

    if (response.ok) {
        console.log(`  ✓ Email confirmed`);
    }
}

async function createPublicUser(userId: string, user: User) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
            id: userId,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: true,
        }),
    });

    if (response.ok) {
        console.log(`  ✓ Created public.users record`);
    } else {
        const err = await response.text();
        console.log(`  ⚠ Public user: ${err}`);
    }
}

async function main() {
    console.log('='.repeat(50));
    console.log('SIGNUP-BASED USER SEEDING');
    console.log('='.repeat(50));
    console.log(`URL: ${SUPABASE_URL}`);
    console.log();

    for (const user of USERS) {
        const userId = await signupUser(user);
        if (userId) {
            await confirmEmail(userId);
            await createPublicUser(userId, user);
        }
        console.log();
    }

    console.log('='.repeat(50));
    console.log('Done! Try logging in with:');
    console.log('Email: system.admin@fedex.com');
    console.log('Password: Password123!');
    console.log('='.repeat(50));
}

main().catch(console.error);
