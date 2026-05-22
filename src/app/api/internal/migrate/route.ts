import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Endpoint temporário para rodar migrations DDL via service role
// Protegido por secret header — chamar uma vez e remover depois
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-migrate-secret')
  if (secret !== 'migrate-2026-atendimento') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const results: Record<string, string> = {}

  // Adicionar chatwoot_conv_id na tabela conversations
  const { error: e1 } = await db
    .from('conversations')
    .select('chatwoot_conv_id')
    .limit(1)

  if (e1?.code === '42703') {
    // Coluna não existe — precisamos rodar via rpc
    results['chatwoot_conv_id_check'] = 'column_missing_run_sql_manually'
  } else {
    results['chatwoot_conv_id_check'] = 'column_already_exists'
  }

  // Verificar notification_email nos agents
  const { error: e2 } = await db
    .from('agents')
    .select('notification_email')
    .limit(1)

  if (e2?.code === '42703') {
    results['notification_email_check'] = 'column_missing_run_sql_manually'
  } else {
    results['notification_email_check'] = 'column_already_exists'
  }

  return NextResponse.json({ status: 'checked', results })
}
