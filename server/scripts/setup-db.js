/**
 * Skyrovix Database Setup Script
 * 
 * Run this script to apply the Supabase schema.
 * 
 * Usage:
 *   node scripts/setup-db.js
 * 
 * You need a Supabase Management API token:
 *   1. Go to https://supabase.com/dashboard/account/tokens
 *   2. Create a new token
 *   3. Set it as SUPABASE_MGMT_TOKEN env var or pass as argument
 * 
 * OR simply copy/paste the SQL from server/db/schema.sql into your
 * Supabase project's SQL Editor and run it manually.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const PROJECT_REF = "bkkunsjahduiwlqxguat";
const SQL_FILE = path.resolve(__dirname, "../db/schema.sql");

async function main() {
  const token = process.env.SUPABASE_MGMT_TOKEN || process.argv[2];
  if (!token) {
    console.log("=== Option 1: Run SQL manually ===");
    console.log(`1. Open https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log(`2. Copy the contents of: ${SQL_FILE}`);
    console.log("3. Paste and run in the SQL Editor\n");
    console.log("=== Option 2: Use Management API ===");
    console.log("Set SUPABASE_MGMT_TOKEN env var or pass as argument:");
    console.log("  node scripts/setup-db.js YOUR_MANAGEMENT_TOKEN\n");
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_FILE, "utf8");
  console.log(`Running schema SQL against project ${PROJECT_REF}...`);

  const data = JSON.stringify({ query: sql });
  const req = https.request(
    {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT_REF}/database/sql`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(data),
      },
    },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log("Schema applied successfully!");
        } else {
          console.error(`Error (${res.statusCode}):`, body);
        }
      });
    }
  );
  req.on("error", (err) => console.error("Request failed:", err.message));
  req.write(data);
  req.end();
}

main();
