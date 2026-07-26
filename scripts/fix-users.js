require('dotenv').config({ path: './apps/web/.env.local' });

async function run() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users`;
    
    // We insert the service actor ID into the users table so that 
    // foreign key constraints like 'cases_created_by_fkey' do not fail.
    const payload = {
        id: '89ea85be-9529-4e5c-85d9-1c63e5714392',
        email: 'system-case-automation@system.local',
        full_name: 'System (Case Automation)',
        role: 'FEDEX_ADMIN',
        is_active: true,
        is_verified: true
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
        console.log("✅ Successfully inserted SYSTEM user into public.users!");
        console.log(data);
    } else {
        // If it already exists, that's fine too. We can try a PATCH just in case.
        if (data.code === '23505') {
            console.log("✅ SYSTEM user already exists in public.users.");
        } else {
            console.error("❌ Failed:", data);
        }
    }
}
run();
