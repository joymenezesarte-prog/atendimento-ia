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

/** Desativa horário de trabalho em uma inbox (widget sempre disponível, sem "Estamos ausentes") */
export async function disableInboxWorkingHours(inboxId: number): Promise<void> {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return
  try {
    await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes/${inboxId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ working_hours_enabled: false }),
    })
  } catch { /* silencioso */ }
}

/** Busca o ID de uma inbox pelo website_token (para inboxes já existentes) */
export async function findInboxIdByWebsiteToken(websiteToken: string): Promise<number | null> {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return null
  try {
    const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`, {
      headers: { 'api_access_token': CHATWOOT_API_TOKEN },
    })
    if (!res.ok) return null
    const data = await res.json()
    const inboxes: Array<{ id: number; website_token?: string }> = data.payload || []
    const found = inboxes.find(i => i.website_token === websiteToken)
    return found?.id ?? null
  } catch { return null }
}

/**
 * Cria automação no Chatwoot que encaminha mensagens recebidas da inbox para o n8n.
 * Requer a env var N8N_WEBHOOK_URL configurada no EasyPanel.
 */
export async function createN8nAutomation(inboxId: number, name: string): Promise<{ ok: boolean; reason?: string }> {
  const n8nUrl = process.env.N8N_WEBHOOK_URL
  if (!n8nUrl) return { ok: false, reason: 'N8N_WEBHOOK_URL não configurada no servidor' }
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) return { ok: false, reason: 'Variáveis CHATWOOT_* ausentes' }
  try {
    const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/automation_rules`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: `IA - ${name}`,
        description: 'Encaminha mensagens recebidas para o agente de IA via n8n',
        event_name: 'message_created',
        active: true,
        actions: [
          {
            action_name: 'send_webhook_event',
            action_params: [n8nUrl],
          },
        ],
        conditions: [
          {
            attribute_key: 'inbox_id',
            filter_operator: 'equal_to',
            values: [String(inboxId)],
            query_operator: null,
          },
          {
            attribute_key: 'message_type',
            filter_operator: 'equal_to',
            values: ['incoming'],
            query_operator: 'AND',
          },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, reason: (err as { message?: string })?.message || `Chatwoot retornou ${res.status}` }
    }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

/** Cria inbox de web widget no Chatwoot: atribui agentes + seta online + desativa working hours + cria automação n8n */
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

    // Tudo em paralelo: agentes, online, working hours, automação n8n
    await Promise.all([
      assignAgentsToInbox(inbox.id),
      setChatwootAgentsOnline(),
      disableInboxWorkingHours(inbox.id),
      createN8nAutomation(inbox.id, name),
    ])

    return { website_token: inbox.website_token, inbox_id: inbox.id }
  } catch { return null }
}
