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
// Aceita tanto o dono do cliente quanto funcionários com metadata { role: 'employee', client_id }
export async function requireClient(): Promise<{ id: string; user_id: string } | null> {
  const supabase = await getSupabaseUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = getSupabaseAdmin()

  // Verifica se é o dono direto
  const { data: clientByOwner } = await db
    .from('clients')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single()
  if (clientByOwner) return clientByOwner

  // Verifica se é funcionário (via user_metadata)
  const clientId = user.user_metadata?.client_id
  if (clientId && user.user_metadata?.role === 'employee') {
    const { data: clientByEmployee } = await db
      .from('clients')
      .select('id, user_id')
      .eq('id', clientId)
      .single()
    if (clientByEmployee) return clientByEmployee
  }

  return null
}
