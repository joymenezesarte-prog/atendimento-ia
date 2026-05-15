import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase-admin'
import { getOAuthUrl } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = request.nextUrl.searchParams.get('agent_id')
  if (!agentId) return NextResponse.json({ error: 'agent_id obrigatório' }, { status: 400 })

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID não configurado' }, { status: 500 })
  }

  const url = getOAuthUrl(agentId)
  return NextResponse.redirect(url)
}
