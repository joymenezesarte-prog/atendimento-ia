import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createEvent, getAccessToken } from '@/lib/google-calendar'

// Chamado pelo n8n quando o agente quer agendar uma reunião
// POST /api/internal/calendar/create-event
// Body: { agent_id, lead_name, lead_phone, summary, description, start_datetime, end_datetime, timezone, chatwoot_conv_id }
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
      return NextResponse.json({ error: 'agent_id é obrigatório' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Busca o refresh_token e calendar_id do agente
    const { data: agent, error: agentError } = await db
      .from('agents')
      .select('google_refresh_token, google_calendar_id, name')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
    }

    if (!agent.google_refresh_token) {
      return NextResponse.json({
        error: 'Google Agenda não conectado para este agente',
        status: 'not_connected',
        action_needed: 'Conecte o Google Agenda no painel admin do agente'
      }, { status: 422 })
    }

    const calendarId = agent.google_calendar_id || 'primary'

    // Define horários padrão se não fornecidos (amanhã às 10h)
    let startDt = start_datetime
    let endDt = end_datetime

    if (!startDt) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      startDt = tomorrow.toISOString()
      endDt = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString()
    }

    // Monta lista de convidados: lead + emails da equipe fornecidos
    const allAttendees: { email: string }[] = []
    if (lead_email) allAttendees.push({ email: lead_email })
    if (Array.isArray(attendee_emails)) {
      attendee_emails.forEach((e: string) => { if (e) allAttendees.push({ email: e }) })
    }

    // Cria o evento no Google Calendar
    const event = await createEvent(agent.google_refresh_token, calendarId, {
      summary: summary || `Reunião com ${lead_name || 'Cliente'}`,
      description: description || `Agendamento via agente IA ${agent.name}`,
      start: { dateTime: startDt, timeZone: timezone },
      end: { dateTime: endDt, timeZone: timezone },
      ...(allAttendees.length > 0 ? { attendees: allAttendees } : {}),
 