import { isDBConnected } from "../config/db.js";

export function requireDB(req, res, next) {
  if (isDBConnected()) return next();
  return res.status(503).json({
    message:
      "Database is not connected. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in server/.env, then run the SQL schema from server/db/schema.sql in your Supabase SQL editor, and restart the API.",
  });
}
