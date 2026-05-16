/**
 * Utilitários para a API do Chatwoot
 */

const CHATWOOT_URL = process.env.CHATWOOT_URL
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN

function headers() {
  return { 'Content-Type': 'application/json', 'api_access_token': CHATWOOT_API_TOKEN! }
}

/** Busca todos os agentes da conta */
export async function getChatwootAgents(): Promise<{ id: number; name: string }[]> {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return []
  try {
    const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/agents`, {
      headers: { 'api_access_token': CHATWOOT_API_TOKEN },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

/** Define todos os agentes da conta como Online */
export async function setChatwootAgentsOnline(): Promise<void> {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return
  try {
    const agents = await getChatwootAgents()
    await Promise.all(
      agents.map(agent =>
        fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/agents/${agent.id}`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ availability: 'online' }),
        }).catch(() => {})
      )
    )
  } catch { /* silencioso */ }
}

/** Atribui todos os agentes da conta a um inbox */
export async function assignAgentsToInbox(inboxId: number): Promise<void> {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return
  try {
    const agents = await getChatwootAgents()
    const userIds = agents.map(a => a.id)
    if (userIds.length === 0) return
    await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inbox_members`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ user_ids: userIds, inbox_id: inboxId }),
    })
  } catch { /* silencioso */ }
}

/** Cria inbox de web widget no Chatwoot e já atribui agentes + seta online */
export async function createWebWidgetInbox(name: string): Promise<{ website_token: string; inbox_id: number } | null> {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return null
  try {
    const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name,
        channel: {
          type: 'web_widget',
          website_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://app.atendimentoia.cloud',
        },
        working_hours_enabled: false,
      }),
    })
    if (!res.ok) return null
    const inbox = await res.json()
    if (!inbox.website_token) return null

    // Atribui agentes e seta online em paralelo
    await Promise.all([
      assignAgentsToInbox(inbox.id),
      setChatwootAgentsOnline(),
    ])

    return { website_token: inbox.website_token, inbox_id: inbox.id }
  } catch { return null }
}
