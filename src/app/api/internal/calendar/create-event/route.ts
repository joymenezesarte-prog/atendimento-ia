import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createEvent } from '@/lib/google-calendar'

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  apiKey: string
  from: string
}) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[calendar] Erro Resend para', opts.to, ':', err)
    } else {
      console.log('[calendar] Email enviado para', opts.to)
    }
  } catch (e) {
    console.error('[calendar] Excecao email:', e)
  }
}

// Email interno para a equipe
async function sendTeamNotification(opts: {
  to: string
  lead_name: string
  lead_phone: string | null
  lead_email: string | null
  service: string
  date: string
  start_time: string
  meet_link: string | null
  agent_name: string
  resend_api_key?: string | null
}) {
  const apiKey = opts.resend_api_key || process.env.RESEND_API_KEY
  if (!apiKey) return
  const from = process.env.NOTIFICATION_FROM_EMAIL || 'Atendimento IA <noreply@atendimentoia.cloud>'
  const subject = `Novo agendamento: ${opts.lead_name} — ${opts.date} as ${opts.start_time.slice(0, 5)}`
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#111;margin-bottom:4px">Novo agendamento confirmado</h2>
      <p style="color:#555;margin-top:0">Agente: <strong>${opts.agent_name}</strong></p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;width:130px">Cliente</td><td style="padding:6px 0;font-weight:600">${opts.lead_name}</td></tr>
        ${opts.lead_phone ? `<tr><td style="padding:6px 0;color:#888">Telefone</td><td style="padding:6px 0">${opts.lead_phone}</td></tr>` : ''}
        ${opts.lead_email ? `<tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0">${opts.lead_email}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#888">Servico</td><td style="padding:6px 0">${opts.service}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Data</td><td style="padding:6px 0">${opts.date}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Horario</td><td style="padding:6px 0">${opts.start_time.slice(0, 5)}</td></tr>
        ${opts.meet_link ? `<tr><td style="padding:6px 0;color:#888">Google Meet</td><td style="padding:6px 0"><a href="${opts.meet_link}" style="color:#1a73e8">${opts.meet_link}</a></td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <p style="color:#888;font-size:12px">Enviado automaticamente pelo agente IA · Atendimento IA</p>
    </div>
  `
  await sendEmail({ to: opts.to, subject, html, apiKey, from })
}

// Email de confirmacao para o lead (cliente)
async function sendLeadConfirmation(opts: {
  to: string
  lead_name: string
  service: string
  date: string
  start_time: string
  meet_link: string | null
  resend_api_key?: string | null
}) {
  const apiKey = opts.resend_api_key || process.env.RESEND_API_KEY
  if (!apiKey) return
  const from = process.env.NOTIFICATION_FROM_EMAIL || 'Atendimento IA <noreply@atendimentoia.cloud>'

  const [year, month, day] = opts.date.split('-')
  const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const dateFormatted = `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`

  const subject = `Sua reuniao esta confirmada — ${dateFormatted} as ${opts.start_time.slice(0, 5)}`
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff">
      <h2 style="color:#111;margin-bottom:4px">✅ Reuniao confirmada!</h2>
      <p style="color:#555;margin-top:0">Ola, <strong>${opts.lead_name}</strong>! Seu agendamento foi confirmado com sucesso.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#888;width:120px">Assunto</td><td style="padding:8px 0;font-weight:600">${opts.service}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Data</td><td style="padding:8px 0">${dateFormatted}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Horario</td><td style="padding:8px 0">${opts.start_time.slice(0, 5)}</td></tr>
        ${opts.meet_link ? `
        <tr><td style="padding:8px 0;color:#888">Link Meet</td><td style="padding:8px 0">
          <a href="${opts.meet_link}" style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">🎥 Entrar na reuniao</a>
        </td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <p style="color:#aaa;font-size:12px">Se precisar reagendar ou cancelar, responda esta conversa.</p>
    </div>
  `
  await sendEmail({ to: opts.to, subject, html, apiKey, from })
}

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

    const { data: agent, error: agentError } = await db
      .from('agents')
      .select('google_refresh_token, google_calendar_id, name, client_id, notification_email, resend_api_key')
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

    let startDt = start_datetime
    let endDt = end_datetime

    if (!startDt) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(13, 0, 0, 0)
      startDt = tomorrow.toISOString()
      endDt = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString()
    }

    const allAttendees: { email: string }[] = []
    if (lead_email) allAttendees.push({ email: lead_email })
    if (Array.isArray(attendee_emails)) {
      attendee_emails.forEach((e: string) => { if (e && e !== lead_email) allAttendees.push({ email: e }) })
    }

    const event = await createEvent(agent.google_refresh_token, calendarId, {
      summary: summary || `Reuniao com ${lead_name || 'Cliente'}`,
      description: description || `Agendamento via agente IA ${agent.name}`,
      start: { dateTime: startDt, timeZone: timezone },
      end: { dateTime: endDt, timeZone: timezone },
      ...(allAttendees.length > 0 ? { attendees: allAttendees } : {}),
    })

    const startDate = new Date(startDt)
    const endDate = new Date(endDt)

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

      if (apptError) console.error('Erro ao salvar appointment:', apptError)
      else savedAppointmentId = appt.id
    } catch (apptErr) {
      console.error('Excecao ao salvar appointment:', apptErr)
    }

    const serviceLabel = service || summary || `Reuniao com ${lead_name || 'Cliente'}`

    // Email para equipe
    if (agent.notification_email) {
      await sendTeamNotification({
        to: agent.notification_email,
        lead_name: lead_name || 'Lead',
        lead_phone: lead_phone || null,
        lead_email: lead_email || null,
        service: serviceLabel,
        date: datePart,
        start_time: startTimePart,
        meet_link: event.hangoutLink || null,
        agent_name: agent.name,
        resend_api_key: agent.resend_api_key || null,
      })
    }

    // Email de confirmacao para o lead
    if (lead_email) {
      await sendLeadConfirmation({
        to: lead_email,
        lead_name: lead_name || 'Cliente',
        service: serviceLabel,
        date: datePart,
        start_time: startTimePart,
        meet_link: event.hangoutLink || null,
        resend_api_key: agent.resend_api_key || null,
      })
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
