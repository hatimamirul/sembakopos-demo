# Supabase multi-cashier integration (development branch)
This is a foundation, **not yet wired to the existing POS screens**. The production POS remains unchanged.

1. Create a Supabase project and run `supabase/migrations/001_multi_cashier.sql` in its SQL editor.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel preview environment (and local .env). Never use service_role in frontend.
3. Create users in Supabase Auth; provision the first admin in SQL Editor using their auth UUID. Provision cashiers via a trusted admin-only backend, not by direct browser writes.
4. Import `signInCashier`, `checkout`, `listProducts`, `listSales` from `src/lib/supabase-pos.ts` into the existing UI after verifying its data model and migration plan.
5. Test with two sessions: simultaneous checkout of last item must allow only one sale, and verify RLS blocks cashier product edits and viewing other cashier sales.
6. Do not migrate existing local browser data automatically. Back up and map it first.

NOTE: Manual sold_at is permitted to preserve current receipt behavior; for audit integrity consider restricting it to admins or recording an immutable server timestamp separately (created_at already does this).
