import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET_NAME, LOGO_FILENAME } from '../supabaseConfig';

let supabase: any = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const isSupabaseConfigured = () => {
  return !!supabase;
};

export const uploadLogo = async (file: File) => {
  if (!supabase) throw new Error("Supabase not configured");

  // Upload/Upsert the file to the bucket
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(LOGO_FILENAME, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Supabase Upload Error Details:", error);
    
    // Check for RLS error
    if (error.message && error.message.includes("row-level security")) {
      throw new Error(
        "Upload failed due to permissions. Please run the SQL policies in supabaseConfig.ts in your Supabase SQL Editor."
      );
    }
    
    // Check for Auth error (Incorrect API Key)
    if (error.statusCode === 401 || error.statusCode === 403 || error.message.includes("JWT")) {
      throw new Error(
        "Authentication failed. The Supabase Anon Key in 'supabaseConfig.ts' might be incorrect. Standard Supabase keys usually start with 'ey...'."
      );
    }

    throw error;
  }
  return data;
};

export const getLogoPublicUrl = () => {
  if (!supabase) return null;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(LOGO_FILENAME);
  // Add a timestamp to bust cache if needed, or just return the URL
  return `${data.publicUrl}?t=${new Date().getTime()}`;
};

export const fetchLogoForPDF = async (): Promise<string | null> => {
  if (!supabase) return null;

  try {
    // 1. Download the file as a Blob directly from Supabase to avoid CORS issues with simple URL fetching in some environments
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(LOGO_FILENAME);

    if (error) {
      console.warn("Could not download logo from Supabase:", error);
      return null;
    }

    if (!data) return null;

    // 2. Convert Blob to Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(data);
    });
  } catch (e) {
    console.error("Error fetching logo for PDF:", e);
    return null;
  }
};