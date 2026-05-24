/**
 * Create a founder user via Supabase Admin API (no confirmation email).
 *
 * 1. Supabase Dashboard → Project Settings → API → service_role (secret)
 * 2. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=eyJ...
 * 3. Run: node scripts/create-founder.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const USER = {
  email: "shourya@designsverse.in",
  password: "Admin@123",
  full_name: "Shourya sharma",
};

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

if (!serviceKey) {
  console.error(`
Missing SUPABASE_SERVICE_ROLE_KEY.

Get it from: Supabase Dashboard → Project Settings → API → service_role (click Reveal)
Add to .env.local:

  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

Then run: node scripts/create-founder.mjs
`);
  process.exit(1);
}

const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: USER.email,
    password: USER.password,
    email_confirm: true,
    user_metadata: { full_name: USER.full_name },
  }),
});

const data = await res.json();

if (!res.ok) {
  // User may already exist — try to fetch and confirm
  if (data.msg?.includes("already") || data.error_code === "email_exists") {
    console.log("User already exists. Ensuring profile...");
    const listRes = await fetch(
      `${url}/auth/v1/admin/users?email=${encodeURIComponent(USER.email)}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const list = await listRes.json();
    const existing = list.users?.[0];
    if (existing) {
      console.log("✓ User found:", existing.id, existing.email);
      process.exit(0);
    }
  }
  console.error("Failed:", data);
  process.exit(1);
}

console.log("✓ User created successfully");
console.log("  Name:", USER.full_name);
console.log("  Email:", USER.email);
console.log("  ID:", data.id);
console.log("\nLogin at http://localhost:3000/login");
