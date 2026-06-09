import supabase from "./supabase.js";

let connected = false;

export async function connectDB() {
  try {
    const { data, error } = await supabase.from("users").select("id", { count: "exact", head: true }).limit(1);
    if (error && error.code === "PGRST301") {
      console.warn("[db] Supabase connection failed — check service key");
      connected = false;
      return;
    }
    if (error && error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      console.warn("[db] Tables don't exist yet — run SQL from server/db/schema.sql in Supabase SQL Editor");
      connected = false;
      return;
    }
    connected = true;
    console.log("[db] Supabase connected");
  } catch (err) {
    connected = false;
    console.error("[db] Supabase connection error:", err.message);
  }
}

export function isDBConnected() {
  return connected;
}

export async function disconnectDB() {
  connected = false;
}
