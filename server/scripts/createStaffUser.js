// One-off script to create the first staff/admin user.
// Usage:
//   node scripts/createStaffUser.js --name "Sohail" --email admin@demo.com --password secret123 --role admin
//
// Requires .env in server/ with SUPABASE_URL, SUPABASE_SERVICE_KEY set (same as index.js).
// Run this from inside the server/ folder: node scripts/createStaffUser.js ...

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase } from '../db/supabaseClient.js';

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    parsed[key] = args[i + 1];
  }
  return parsed;
}

async function main() {
  const { name, email, password, role = 'admin' } = parseArgs();

  if (!name || !email || !password) {
    console.error('Usage: node scripts/createStaffUser.js --name "Full Name" --email you@example.com --password yourpassword [--role admin|staff] [--hotel-slug demo-restaurant]');
    process.exit(1);
  }

  if (!['admin', 'staff'].includes(role)) {
    console.error('--role must be "admin" or "staff"');
    process.exit(1);
  }

  const hotelSlug = parseArgs()['hotel-slug'] || 'demo-restaurant';

  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('slug', hotelSlug)
    .single();

  if (hotelError || !hotel) {
    console.error(`No hotel found with slug "${hotelSlug}". Create one first (schema.sql seeds "demo-restaurant" by default).`);
    process.exit(1);
  }

  const { data: existing } = await supabase
    .from('staff_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    console.error(`A staff user with email "${email}" already exists.`);
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('staff_users')
    .insert({ hotel_id: hotel.id, name, email, password_hash, role })
    .select('id, name, email, role')
    .single();

  if (error) {
    console.error('Failed to create user:', error.message);
    process.exit(1);
  }

  console.log('✅ Staff user created:');
  console.log(`   Name:  ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
  console.log(`   Hotel: ${hotel.name} (${hotelSlug})`);
  console.log('\nYou can now log in at /staff/login with this email and password.');
}

main();