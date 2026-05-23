import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Endpoint de diagnóstico — retorna o estado de configuração de todos os agentes
// GET /api/internal/diagnose
// Protegido pela INTERNAL_SECRET ou apenas pelo admin (service role)
export async function GET(_request: NextRequest) {
  const db = getSupabaseAdmin()

  const { data: agents, error } = await db
    .from('agents')
    .select('id, name, client_id, google_refresh_token, google_calendar_id, notification_email, features, status')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const report = (agents || []).map(agent => {
    const features = (agent.features as Record<string, boolean>) || {}
    return {
      id: agent.id,
      name: agent.name,
      client_id: agent.client_id,
      status: agent.status,
      google_calendar: {
        connected: !!agent.google_refresh_token,
        calendar_id: agent.google_calendar_id || 'primary',
        fix: !agent.google_refresh_token
          ? `Acesse: https://app.atendimentoia.cloud/api/admin/google/auth?agent_id=${agent.id}`
          : null,
      },
      scheduling: {
        feat_scheduling_enabled: !!features.feat_scheduling,
        fix: !features.feat_scheduling
          ? 'Ative "Agendamento" nas features do agente em /admin/agents'
          : null,
      },
      notifications: {
        notification_email: agent.notification_email || null,
        configured: !!agent.notification_email,
        fix: !agent.notification_email
          ? 'Configure o email de notificação nas configurações do agente'
          : null,
      },
    }
  })

  return NextResponse.json({
    total_agents: report.length,
    agents: report,
    env_checks: {
      resend_api_key: !!process.env.RESEND_API_KEY,
      google_client_id: !!process.env.GOOGLE_CLIENT_ID,
      google_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
    }
  })
}
