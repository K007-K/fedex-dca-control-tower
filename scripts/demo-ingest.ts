/**
 * FedEx DCA Control Tower - Live Demo Ingestion Script
 * 
 * Run this script to instantly simulate an ERP system sending a new 
 * unpaid invoice into the Control Tower.
 * 
 * Usage: 
 *   npx tsx scripts/demo-ingest.ts
 */

import fs from 'fs';
import path from 'path';
import * as jose from '../apps/web/node_modules/jose/dist/node/esm/index.js';

// 1. Load the SERVICE_SECRET from .env.local
const envPath = path.join(process.cwd(), 'apps', 'web', '.env.local');
if (!fs.existsSync(envPath)) {
    console.error("❌ Could not find .env.local at", envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const secretMatch = envContent.match(/SERVICE_SECRET=(.+)/);
if (!secretMatch) {
    console.error("❌ Could not find SERVICE_SECRET in .env.local");
    process.exit(1);
}
const SERVICE_SECRET = secretMatch[1].replace(/["']/g, '');

// 2. Generate the SYSTEM Auth Token using jose directly
async function generateToken(payload: any, secret: string) {
    const secretKey = new TextEncoder().encode(secret);
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretKey);
}

// 4. Send the request to your local development server
async function run() {
    console.log("🚀 Simulating ERP Ingestion...\n");
    
    // 3. Generate the SYSTEM Auth Token
    const token = await generateToken({
        service_name: 'case-automation',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }, SERVICE_SECRET);

    const randomId = Math.floor(Math.random() * 1000000);
    const payload = {
        case_type: 'INVOICE',
        source_system: 'ERP_BILLING_SYSTEM',
        source_reference_id: `ERP-INV-${randomId}`,
        region: 'India',
        currency: 'INR',
        principal_amount: 50000,
        tax_amount: 9000,
        total_due: 59000,
        customer_id: `CUST-${randomId}`,
        customer_name: 'Reliance Logistics (Demo)',
        customer_contact: {
            email: 'billing@reliance-demo.in',
            phone: '+91 98765 43210',
        },
        customer_address: {
            country: 'IN',
            city: 'Mumbai',
        },
        invoice_number: `INV-${randomId}`,
        customer_segment: 'Enterprise'
    };

    console.log("📦 Payload:");
    console.log(JSON.stringify(payload, null, 2));
    
    try {
        const response = await fetch('http://localhost:3000/api/v1/cases/system-create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Auth': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("\n✅ SUCCESS! Case Created and Allocated.");
            console.log(JSON.stringify(data, null, 2));
            console.log("\n👉 Next steps for the demo:");
            console.log("1. Check the Manager Dashboard to see this case appear in real-time.");
            console.log("2. Check the Audit Logs to see the exact forensic trail of this ingestion.");
        } else {
            console.log("\n❌ ERROR from server:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err: any) {
        console.error("\n❌ Failed to connect to server.", err.message);
    }
}

run();
