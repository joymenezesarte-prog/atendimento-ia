import { createClient } from './supabase'

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })
}
