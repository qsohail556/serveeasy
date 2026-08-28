import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env — server cannot start without them.');
}

// Server-side client uses the service role key — never expose this key to the frontend.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
