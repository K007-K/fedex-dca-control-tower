#!/usr/bin/env node

/**
 * FedEx DCA Control Tower - Live Demo Ingestion Script
 * 
 * Run this script to instantly simulate an ERP system sending a new 
 * unpaid invoice into the Control Tower.
 */

const crypto = require('crypto');
const https = require('https');

// 1. Production Vercel Secret
const SERVICE_SECRET = 'zK9mNpL4qR8wX2vY6bC0dF3gH5jT7uI1oA9sE4yU2nM=';

// 2. Helper to sign a JWT manually
function signJwt(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

// 3. Generate the SYSTEM Auth Token
const token = signJwt({
    service_name: 'case-automation',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
}, SERVICE_SECRET);

// 4. Create the Case Payload
const randomId = Math.floor(Math.random() * 1000000);
const payload = JSON.stringify({
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
});

console.log("🚀 Simulating ERP Ingestion...\n");
console.log("📦 Payload:");
console.log(JSON.stringify(JSON.parse(payload), null, 2));

// 5. Send raw HTTPS request (Bypasses Node's 'fetch' which mimics a browser and triggers the spoofing guard)
const options = {
    hostname: 'fedex-dca-control-tower.vercel.app',
    port: 443,
    path: '/api/v1/cases/system-create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Service-Auth': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log("\n✅ SUCCESS! Case Created and Allocated on the LIVE server.");
                console.log(JSON.stringify(json, null, 2));
            } else {
                console.log(`\n❌ ERROR from server (Status ${res.statusCode}):`);
                console.log(JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log(`\n❌ Raw ERROR from server (Status ${res.statusCode}):`);
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error("\n❌ Failed to connect to server.", e.message);
});

req.write(payload);
req.end();
