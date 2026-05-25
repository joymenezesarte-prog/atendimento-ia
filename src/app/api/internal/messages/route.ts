import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/internal/messages?conversation_id=xxx&limit=20
// Retorna historico de mensagens de uma conversa (chamado pelo n8n)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id e obrigatorio' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    const { data, error } = await db
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
