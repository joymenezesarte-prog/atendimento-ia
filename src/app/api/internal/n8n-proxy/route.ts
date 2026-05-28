import { NextRequest, NextResponse } from 'next/server'

const N8N_INTERNAL = process.env.N8N_INTERNAL_URL || 'http://n8n:5678'
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const PROXY_SECRET = process.env.N8N_PROXY_SECRET || 'atendimento-proxy-2024'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-proxy-secret')
  if (secret !== PROXY_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workflowId = req.nextUrl.searchParams.get('id')
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'executions') {
    const res = await fetch(`${N8N_INTERNAL}/api/v1/executions?workflowId=${workflowId}&limit=5&includeData=false`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    return NextResponse.json(data, { status: res.status })
  }

  if (!workflowId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const res = await fetch(`${N8N_INTERNAL}/api/v1/workflows/${workflowId}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get('x-proxy-secret')
  if (secret !== PROXY_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workflowId = req.nextUrl.searchParams.get('id')
  if (!workflowId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()

  const res = await fetch(`${N8N_INTERNAL}/api/v1/workflows/${workflowId}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-proxy-secret')
  if (secret !== PROXY_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workflowId = req.nextUrl.searchParams.get('id')
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'activate') {
    const res = await fetch(`${N8N_INTERNAL}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : { activated: true }
    return NextResponse.json(data, { status: res.status })
  }

  if (action === 'deactivate') {
    const res = await fetch(`${N8N_INTERNAL}/api/v1/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : { deactivated: true }
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
