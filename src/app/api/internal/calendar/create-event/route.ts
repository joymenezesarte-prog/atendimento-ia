import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createEvent } from '@/lib/google-calendar'

// Chamado pelo n8n quando o agente quer agendar uma reuniao
// POST /api/internal/calendar/create-event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agent_id,
      lead_name,
      lead_email,
      attendee_emails = [],
      summary,
      description,
      start_datetime,
      end_datetime,
      timezone = 'America/Sao_Paulo',
    } = body

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id e obrigatorio' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Busca dados do agente - seleciona campos que certamente existem
    const { data: agent, error: agentError } = await db
      .from('agents')
      .select('google_refresh_token, google_calendar_id, name')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agente nao encontrado', detail: agentError?.message }, { status: 404 })
    }

    if (!agent.google_refresh_token) {
      return NextResponse.json({
        error: 'Google Agenda nao conectado para este agente',
        status: 'not_connected'
      }, { status: 422 })
    }

    const calendarId = agent.google_calendar_id || 'primary'

    // Define horarios padrao se nao fornecidos (amanha as 10h)
    let startDt = start_datetime
    let endDt = end_datetime

    if (!startDt) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      startDt = tomorrow.toISOString()
      endDt = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString()
    }

    // Monta lista de convidados (lead + emails adicionais passados pelo n8n)
    const allAttendees: { email: string }[] = []
    if (lead_email) allAttendees.push({ email: lead_email })
    if (Array.isArray(attendee_emails)) {
      attendee_emails.forEach((e: string) => { if (e) allAttendees.push({ email: e }) })
    }

    // Cria o evento (sendUpdates=all envia email de convite para todos os convidados)
    const event = await createEvent(agent.google_refresh_token, calendarId, {
      summary: summary || `Reuniao com ${lead_name || 'Cliente'}`,
      description: description || `Agendamento via agente IA ${agent.name}`,
      start: { dateTime: startDt, timeZone: timezone },
      end: { dateTime: endDt, timeZone: timezone },
      ...(allAttendees.length > 0 ? { attendees: allAttendees } : {}),
    })

    return NextResponse.json({
      status: 'created',
      event_id: event.id,
      event_link: event.htmlLink,
      calendar_id: calendarId,
      start: startDt,
      end: endDt,
    })
  } catch (err: any) {
    console.error('Erro ao criar evento no Google Calendar:', err)
    return NextResponse.json({
      error: err.message || 'Erro interno ao criar evento',
      status: 'error'
    }, { status: 500 })
  }
}
