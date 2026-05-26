import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cancelEvent } from '@/lib/google-calendar'

async function sendEmail(opts: { to: string; subject: string; html: string; apiKey: string; from: string }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) console.error('[cancel-event] Erro Resend:', await res.json())
    else console.log('[cancel-event] Email enviado para', opts.to)
  } catch (e) { console.error('[cancel-event] Excecao email:', e) }
}

// POST /api/internal/calendar/cancel-event
// Cancela o agendamento mais recente confirmado do lead.
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
      timezone = 'America/Sao_Paulo',
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
      return NextResponse.json({ error: 'Agente nao encontrado' }, { status: 404 })
    }
    if (!agent.google_refresh_token) {
      return NextResponse.json({ error: 'Google Agenda nao conectado', status: 'not_connected' }, { status: 422 })
    }

    const calendarId = agent.google_calendar_id || 'primary'

    // Resolve o agendamento a cancelar
    let eventId = google_event_id
    let apptId = appointment_id
    let existingAppt: any = null

    if (!eventId && (lead_id || apptId)) {
      let query = db
        .from('appointments')
        .select('id, google_event_id, lead_name, lead_email, service, date, start_time')
        .eq('client_id', agent.client_id)
        .eq('status', 'confirmed')
        .not('google_event_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (apptId) query = query.eq('id', apptId)
      else if (lead_id) query = query.eq('lead_id', lead_id)

      const { data: appt } = await query.single()
      if (appt) {
        eventId = appt.google_event_id
        apptId = appt.id
        existingAppt = appt
      }
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Nenhum agendamento confirmado encontrado para cancelar' }, { status: 404 })
    }

    // Cancela no Google Calendar
    await cancelEvent(agent.google_refresh_token, calendarId, eventId)

    // Atualiza status no banco
    if (apptId) {
      await db.from('appointments').update({ status: 'cancelled' }).eq('id', apptId)
    }

    const resolvedLeadName = lead_name || existingAppt?.lead_name || 'Cliente'
    const resolvedLeadEmail = lead_email || existingAppt?.lead_email
    const resolvedService = existingAppt?.service || 'Reuniao'
    const resolvedDate = existingAppt?.date || ''
    const resolvedTime = existingAppt?.start_time || ''
    const apiKey = agent.resend_api_key || process.env.RESEND_API_KEY || ''
    const from = process.env.NOTIFICATION_FROM_EMAIL || 'Atendimento IA <noreply@atendimentoia.cloud>'

    // Email para equipe
    if (agent.notification_email && apiKey) {
      await sendEmail({
        to: agent.notification_email,
        subject: `Cancelamento: ${resolvedLeadName} — ${resolvedDate}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#c62828">Reuniao cancelada</h2>
            <p>Agente: <strong>${agent.name}</strong></p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#888;width:130px">Cliente</td><td style="font-weight:600">${resolvedLeadName}</td></tr>
              <tr><td style="padding:6px 0;color:#888">Servico</td><td>${resolvedService}</td></tr>
              ${resolvedDate ? `<tr><td style="padding:6px 0;color:#888">Data</td><td>${resolvedDate} as ${resolvedTime.slice(0,5)}</td></tr>` : ''}
            </table>
          </div>`,
        apiKey, from,
      })
    }

    // Email para o lead
    if (resolvedLeadEmail && apiKey) {
      await sendEmail({
        to: resolvedLeadEmail,
        subject: `Sua reuniao foi cancelada`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#c62828">❌ Reuniao cancelada</h2>
            <p>Ola, <strong>${resolvedLeadName}</strong>. Sua reuniao foi cancelada conforme solicitado.</p>
            ${resolvedDate ? `<p style="color:#555">Data cancelada: <strong>${resolvedDate} as ${resolvedTime.slice(0,5)}</strong></p>` : ''}
            <p style="color:#888;font-size:13px">Se quiser reagendar, entre em contato conosco a qualquer momento.</p>
          </div>`,
        apiKey, from,
      })
    }

    return NextResponse.json({
      status: 'cancelled',
      event_id: eventId,
      appointment_id: apptId,
    })
  } catch (err: any) {
    console.error('[cancel-event] Erro:', err)
    return NextResponse.json({ error: err.message || 'Erro interno', status: 'error' }, { status: 500 })
  }
}
