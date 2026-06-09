import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || "https://ytfumhzpzqgplvvpvmco.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZnVtaHpwenFncGx2dnB2bWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Njc4NzYsImV4cCI6MjA5NjE0Mzg3Nn0.9ZG9fZnmQKCdkO15W541JRIWYGcDD8mNYkcnsYD5Z-o";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  db: { schema: "public" },
});

export default supabase;
