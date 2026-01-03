// --- SUPABASE CONFIGURATION ---
// 1. Go to https://supabase.com and create a project.
// 2. Go to 'Storage' and create a new bucket named 'assets'. 
//    NOTE: Do not use the name 'public' as it is a reserved keyword in Supabase.
//    Make sure the "Public bucket" toggle is ON.
// 3. Paste your API URL and Anon Key below.
// 4. IMPORTANT: You must enable Row Level Security (RLS) policies to allow uploads.
//    Run this in the Supabase SQL Editor:
/*
   create policy "Allow public uploads" on storage.objects for insert to anon with check ( bucket_id = 'assets' );
   create policy "Allow public updates" on storage.objects for update to anon using ( bucket_id = 'assets' );
   create policy "Allow public selects" on storage.objects for select to anon using ( bucket_id = 'assets' );
*/

export const SUPABASE_URL = "https://kixcsxwbqwvrwbqofzfx.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_4b_k-udWsN1b_haOkCuW_A_FfBKkHGN";

export const BUCKET_NAME = "assets";
export const LOGO_FILENAME = "logo.png";