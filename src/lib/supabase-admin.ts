import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service-role client (bypasses RLS — admin only)
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Anon client (respects RLS) with cookie auth
export async function getSupabaseUser() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// Verifica se o usuário logado é admin (email bate com ADMIN_EMAIL)
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const supabase = await getSupabaseUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmail = process.env.ADMIN_EMAIL || 'joyomoda@gmail.com'
  if (user.email !== adminEmail) return null
  return { userId: user.id }
}

// Verifica se o usuário logado é um cliente válido e retorna os dados do cliente
export async function requireClient(): Promise<{ id: string; user_id: string } | null> {
  const supabase = await getSupabaseUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data
}
