const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3'

export function getOAuthUrl(agentId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/google/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: agentId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error_description || 'Erro ao trocar codigo por tokens')
  }
  return res.json()
}

export async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Erro ao renovar access token')
  const data = await res.json()
  return data.access_token
}

export async function listCalendars(refreshToken: string): Promise<{ id: string; summary: string; primary?: boolean }[]> {
  const accessToken = await getAccessToken(refreshToken)
  const res = await fetch(`${GOOGLE_CALENDAR_URL}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Erro ao listar calendarios')
  const data = await res.json()
  return data.items || []
}

export async function createEvent(
  refreshToken: string,
  calendarId: string,
  event: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone?: string }
    end: { dateTime: string; timeZone?: string }
    attendees?: { email: string }[]
    conferenceData?: object
  },
  withMeet = true
): Promise<{ id: string; htmlLink: string; hangoutLink?: string }> {
  const accessToken = await getAccessToken(refreshToken)

  // Adiciona Google Meet automaticamente
  const eventBody = withMeet
    ? {
        ...event,
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }
    : event

  const url =
    `${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events` +
    `?sendUpdates=all${withMeet ? '&conferenceDataVersion=1' : ''}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Erro ao criar evento')
  }
  return res.json()
}

export async function getAvailableSlots(
  refreshToken: string,
  calendarId: string,
  dateMin: string,
  dateMax: string
): Promise<{ start: string; end: string }[]> {
  const accessToken = await getAccessToken(refreshToken)
  const res = await fetch(
    `${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events?` +
    new URLSearchParams({
      timeMin: dateMin,
      timeMax: dateMax,
      singleEvents: 'true',
      orderBy: 'startTime',
    }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error('Erro ao buscar eventos')
  const data = await res.json()
  return (data.items || []).map((e: any) => ({
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
  }))
}
