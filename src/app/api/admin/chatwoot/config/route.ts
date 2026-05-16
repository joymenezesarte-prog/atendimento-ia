import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    url: process.env.CHATWOOT_URL || '',
    account_id: process.env.CHATWOOT_ACCOUNT_ID || '',
  })
}
