import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const db = getSupabaseAdmin()

  // Verifica se agente existe e pega client_id
  const { data: agent, error: agentErr } = await db
    .from('agents')
    .select('id, client_id')
    .eq('id', agentId)
    .single()

  if (agentErr || !agent) {
    return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
  }

  // Aceita qualquer JSON ou form-urlencoded
  let data: Record<string, any> = {}
  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      data = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      formData.forEach((value, key) => { data[key] = value })
    } else {
      const text = await request.text()
      try { data = JSON.parse(text) } catch { data = { raw: text } }
    }
  } catch {
    data = {}
  }

  // Detecta source pelo header ou campo
  const source = request.headers.get('x-form-source') || data._source || 'webhook'
  delete data._source

  const { error } = await db.from('form_submissions').insert({
    agent_id: agentId,
    client_id: agent.client_id,
    source,
    data,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true }, { status: 201 })
}

// Permite CORS para sites externos
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-form-source',
    },
  })
}
