import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { exchangeCodeForTokens, listCalendars } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const agentId = searchParams.get('state')
  const error = searchParams.get('error')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.atendimentoia.cloud'

  if (error) {
    return NextResponse.redirect(`${siteUrl}/admin/agents?google_error=${error}`)
  }

  if (!code || !agentId) {
    return NextResponse.redirect(`${siteUrl}/admin/agents?google_error=missing_params`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${siteUrl}/admin/agents?google_error=no_refresh_token`)
    }

    // Busca o calendário primário automaticamente
    let calendarId = 'primary'
    try {
      const calendars = await listCalendars(tokens.refresh_token)
      const primary = calendars.find(c => c.primary)
      if (primary) calendarId = primary.id
    } catch {}

    const db = getSupabaseAdmin()
    const { error: dbError } = await db
      .from('agents')
      .update({
        google_refresh_token: tokens.refresh_token,
        google_calendar_id: calendarId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)

    if (dbError) {
      return NextResponse.redirect(`${siteUrl}/admin/agents?google_error=db_error`)
    }

    return NextResponse.redirect(`${siteUrl}/admin/agents?google_success=${agentId}`)
  } catch (err: any) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${siteUrl}/admin/agents?google_error=token_exchange_failed`)
  }
}
