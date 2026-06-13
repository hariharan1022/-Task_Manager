import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || "https://bkkunsjahduiwlqxguat.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra3Vuc2phaGR1aXdscXhndWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0MzU1NCwiZXhwIjoyMDk2ODE5NTU0fQ.kf25LBQBOLgC0iNTOjdK77Itj_5mWaLHTpwOPVXbvoI";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  db: { schema: "public" },
});

export default supabase;
