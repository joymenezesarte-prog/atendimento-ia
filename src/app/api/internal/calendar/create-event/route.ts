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
      lead_id,
      lead_name,
      lead_phone,
      lead_email,
      attendee_emails = [],
      summary,
      description,
      start_datetime,
      end_datetime,
      timezone = 'America/Sao_Paulo',
      service,
      notes,
    } = body

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id e obrigatorio' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // Busca dados do agente incluindo client_id para salvar o appointment
    const { data: agent, error: agentError } = await db
      .from('agents')
      .select('google_refresh_token, google_calendar_id, name, client_id')
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

    // Define horarios padrao se nao fornecidos (amanha as 10h BRT)
    let startDt = start_datetime
    let endDt = end_datetime

    if (!startDt) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(13, 0, 0, 0) // 10h BRT = 13h UTC
      startDt = tomorrow.toISOString()
      endDt = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString()
    }

    // Monta lista de convidados (lead + emails adicionais)
    const allAttendees: { email: string }[] = []
    if (lead_email) allAttendees.push({ email: lead_email })
    if (Array.isArray(attendee_emails)) {
      attendee_emails.forEach((e: string) => { if (e && e !== lead_email) allAttendees.push({ email: e }) })
    }

    // Cria o evento no Google Calendar com Google Meet automatico
    const event = await createEvent(agent.google_refresh_token, calendarId, {
      summary: summary || `Reuniao com ${lead_name || 'Cliente'}`,
      description: description || `Agendamento via agente IA ${agent.name}`,
      start: { dateTime: startDt, timeZone: timezone },
      end: { dateTime: endDt, timeZone: timezone },
      ...(allAttendees.length > 0 ? { attendees: allAttendees } : {}),
    })

    // Salva o agendamento na tabela appointments do Supabase
    const startDate = new Date(startDt)
    const endDate = new Date(endDt)

    // Extrai date/time no fuso correto usando sv-SE locale (YYYY-MM-DD HH:MM:SS)
    const toLocalParts = (dt: Date) => {
      const iso = dt.toLocaleString('sv-SE', { timeZone: timezone })
      const [datePart, timePart] = iso.split(' ')
      return { datePart, timePart }
    }

    const { datePart, timePart: startTimePart } = toLocalParts(startDate)
    const { timePart: endTimePart } = toLocalParts(endDate)

    let savedAppointmentId: string | null = null
    try {
      const meetNote = event.hangoutLink ? `Link Meet: ${event.hangoutLink}` : null
      const { data: appt, error: apptError } = await db
        .from('appointments')
        .insert({
          client_id: agent.client_id,
          lead_id: lead_id || null,
          lead_name: lead_name || 'Lead',
          lead_phone: lead_phone || null,
          service: service || summary || `Reuniao com ${lead_name || 'Cliente'}`,
          date: datePart,
          start_time: startTimePart,
          end_time: endTimePart,
          status: 'confirmed',
          notes: [notes || description, meetNote].filter(Boolean).join('\n') || null,
          google_event_id: event.id || null,
        })
        .select('id')
        .single()

      if (apptError) {
        console.error('Erro ao salvar appointment no DB:', apptError)
      } else {
        savedAppointmentId = appt.id
      }
    } catch (apptErr) {
      console.error('Excecao ao salvar appointment:', apptErr)
    }

    return NextResponse.json({
      status: 'created',
      event_id: event.id,
      event_link: event.htmlLink,
      meet_link: event.hangoutLink || null,
      calendar_id: calendarId,
      start: startDt,
      end: endDt,
      appointment_id: savedAppointmentId,
    })
  } catch (err: any) {
    console.error('Erro ao criar evento no Google Calendar:', err)
    return NextResponse.json({
      error: err.message || 'Erro interno ao criar evento',
      status: 'error'
    }, { status: 500 })
  }
}
