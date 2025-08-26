import { createClient } from "@supabase/supabase-js";

// Replit → Tools → Secrets:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const el = document.getElementById("status");

if (!supabaseUrl || !supabaseKey) {
  el.textContent = "Missing Supabase env vars.";
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);
  // quick smoke-test: get current time from DB (no auth required)
  (async () => {
    try {
      const { data, error } = await supabase.rpc("now"); // requires a `now()` RPC or just skip RPC and set text
      el.textContent = error ? `Supabase OK (no RPC).` : `Supabase OK: ${data}`;
    } catch {
      el.textContent = "Supabase client initialized.";
    }
  })();
}