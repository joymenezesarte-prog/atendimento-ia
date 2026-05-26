import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { updateEvent } from '@/lib/google-calendar'

async function sendEmail(opts: { to: string; subject: string; html: string; apiKey: string; from: string }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) console.error('[update-event] Erro Resend:', await res.json())
    else console.log('[update-event] Email enviado para', opts.to)
  } catch (e) { console.error('[update-event] Excecao email:', e) }
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`
}

// POST /api/internal/calendar/update-event
// Reagenda um evento existente. Busca pelo lead_id ou google_event_id.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agent_id,
      lead_id,
      google_event_id,
      appointment_id,
      lead_email,
      lead_name,
      start_datetime,
      end_datetime,
      timezone = 'America/Sao_Paulo',
      service,
    } = body

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id e obrigatorio' }, { status: 400 })
    }
    if (!start_datetime || !end_datetime) {
      return NextResponse.json({ error: 'start_datetime e end_datetime sao obrigatorios' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    const { data: agent, error: agentError } = await db
      .from('agents')
      .select('google_refresh_token, google_calendar_id, name, client_id, notification_email, resend_api_key')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agente nao encontrado' }, { status: 404 })
    }
    if (!agent.google_refresh_token) {
      return NextResponse.json({ error: 'Google Agenda nao conectado', status: 'not_connected' }, { status: 422 })
    }

    const calendarId = agent.google_calendar_id || 'primary'

    // Resolve o google_event_id: usa o fornecido ou busca pelo lead_id
    let eventId = google_event_id
    let apptId = appointment_id
    let existingAppt: any = null

    if (!eventId && (lead_id || apptId)) {
      const query = db
        .from('appointments')
        .select('id, google_event_id, lead_name, lead_email, service')
        .eq('client_id', agent.client_id)
        .eq('status', 'confirmed')
        .not('google_event_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (apptId) query.eq('id', apptId)
      else if (lead_id) query.eq('lead_id', lead_id)

      const { data: appt } = await query.single()
      if (appt) {
        eventId = appt.google_event_id
        apptId = appt.id
        existingAppt = appt
      }
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Nenhum agendamento confirmado encontrado para reagendar' }, { status: 404 })
    }

    // Atualiza no Google Calendar
    const updatedEvent = await updateEvent(agent.google_refresh_token, calendarId, eventId, {
      start: { dateTime: start_datetime, timeZone: timezone },
      end: { dateTime: end_datetime, timeZone: timezone },
      ...(service ? { summary: service } : {}),
    })

    // Calcula nova data/hora local
    const toLocalParts = (dt: Date) => {
      const iso = dt.toLocaleString('sv-SE', { timeZone: timezone })
      const [datePart, timePart] = iso.split(' ')
      return { datePart, timePart }
    }
    const { datePart, timePart: startTimePart } = toLocalParts(new Date(start_datetime))
    const { timePart: endTimePart } = toLocalParts(new Date(end_datetime))

    // Atualiza no banco
    if (apptId) {
      await db.from('appointments').update({
        date: datePart,
        start_time: startTimePart,
        end_time: endTimePart,
        status: 'confirmed',
      }).eq('id', apptId)
    }

    const resolvedLeadName = lead_name || existingAppt?.lead_name || 'Cliente'
    const resolvedLeadEmail = lead_email || existingAppt?.lead_email
    const resolvedService = service || existingAppt?.service || 'Reuniao'
    const meetLink = updatedEvent.hangoutLink || null
    const apiKey = agent.resend_api_key || process.env.RESEND_API_KEY || ''
    const from = process.env.NOTIFICATION_FROM_EMAIL || 'Atendimento IA <noreply@atendimentoia.cloud>'
    const dateFormatted = formatDate(datePart)

    // Email para equipe
    if (agent.notification_email && apiKey) {
      await sendEmail({
        to: agent.notification_email,
        subject: `Reagendamento: ${resolvedLeadName} — ${datePart} as ${startTimePart.slice(0,5)}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#111">Reuniao reagendada</h2>
            <p>Agente: <strong>${agent.name}</strong></p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#888;width:130px">Cliente</td><td style="font-weight:600">${resolvedLeadName}</td></tr>
              <tr><td style="padding:6px 0;color:#888">Nova data</td><td>${dateFormatted}</td></tr>
              <tr><td style="padding:6px 0;color:#888">Horario</td><td>${startTimePart.slice(0,5)}</td></tr>
              ${meetLink ? `<tr><td style="padding:6px 0;color:#888">Meet</td><td><a href="${meetLink}">${meetLink}</a></td></tr>` : ''}
            </table>
          </div>`,
        apiKey, from,
      })
    }

    // Email para o lead
    if (resolvedLeadEmail && apiKey) {
      await sendEmail({
        to: resolvedLeadEmail,
        subject: `Sua reuniao foi reagendada — ${dateFormatted} as ${startTimePart.slice(0,5)}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#111">🔄 Reuniao reagendada</h2>
            <p>Ola, <strong>${resolvedLeadName}</strong>! Sua reuniao foi reagendada com sucesso.</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#888;width:120px">Assunto</td><td style="font-weight:600">${resolvedService}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Nova data</td><td>${dateFormatted}</td></tr>
              <tr><td style="padding:8px 0;color:#888">Horario</td><td>${startTimePart.slice(0,5)}</td></tr>
              ${meetLink ? `<tr><td style="padding:8px 0;color:#888">Link Meet</td><td>
                <a href="${meetLink}" style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">🎥 Entrar na reuniao</a>
              </td></tr>` : ''}
            </table>
          </div>`,
        apiKey, from,
      })
    }

    return NextResponse.json({
      status: 'updated',
      event_id: eventId,
      event_link: updatedEvent.htmlLink,
      meet_link: meetLink,
      new_date: datePart,
      new_start_time: startTimePart,
      appointment_id: apptId,
    })
  } catch (err: any) {
    console.error('[update-event] Erro:', err)
    return NextResponse.json({ error: err.message || 'Erro interno', status: 'error' }, { status: 500 })
  }
}
