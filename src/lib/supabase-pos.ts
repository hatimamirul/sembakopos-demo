import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export function requireSupabase() {
 if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
 return supabase;
}
export async function signInCashier(email: string, password: string) {
 const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
 if (error) throw error;
 const { data: profile, error: profileError } = await requireSupabase().from('profiles').select('id,display_name,role').eq('id',data.user.id).single();
 if (profileError || !profile) { await requireSupabase().auth.signOut(); throw new Error('User has not been provisioned as a cashier/admin.'); }
 return { session: data.session, profile };
}
export async function checkout(items: { product_id: string; quantity: number }[], customerName?: string, soldAt?: string) {
 const { data, error } = await requireSupabase().rpc('checkout', { p_items: items, p_customer_name: customerName ?? null, p_sold_at: soldAt ?? null });
 if (error) throw error;
 return data as string;
}
export async function listProducts() {
 const { data, error } = await requireSupabase().from('products').select('id,name,sku,price,stock,active').eq('active',true).order('name');
 if (error) throw error;
 return data;
}
export async function listSales() {
 const { data, error } = await requireSupabase().from('sales').select('id,customer_name,sold_at,total,cashier_id').order('sold_at',{ascending:false}).limit(100);
 if (error) throw error;
 return data;
}
