import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { data: client } = await db.from('clients').select('user_id, email, company_name').eq('id', id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Busca dados do usuário dono
  const { data: ownerData } = await db.auth.admin.getUserById(client.user_id)
  const owner = ownerData?.user ? {
    user_id: ownerData.user.id,
    email: ownerData.user.email,
    name: ownerData.user.user_metadata?.full_name || null,
    role: 'owner',
    created_at: ownerData.user.created_at,
  } : null

  // Busca funcionários via metadata
  const employees: Array<{ user_id: string; email: string; name: string | null; role: string; created_at: string }> = []
  let page = 1
  while (true) {
    const { data: usersData } = await db.auth.admin.listUsers({ page, perPage: 50 })
    if (!usersData?.users?.length) break
    for (const u of usersData.users) {
      if (u.user_metadata?.client_id === id && u.user_metadata?.role === 'employee') {
        employees.push({
          user_id: u.id,
          email: u.email ?? '',
          name: u.user_metadata?.full_name || null,
          role: 'employee',
          created_at: u.created_at,
        })
      }
    }
    if (usersData.users.length < 50) break
    page++
  }

  return NextResponse.json({ owner, employees })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const db = getSupabaseAdmin()

  const { data: client } = await db.from('clients').select('user_id, company_name').eq('id', id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Definir senha do dono
  if (body.type === 'set_password') {
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }
    const { error } = await db.auth.admin.updateUserById(client.user_id, { password: body.password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  // Criar acesso de funcionário
  if (body.type === 'create_employee') {
    const { email, name, password } = body
    if (!email || !password) return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })

    const { data: userData, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name || null,
        role: 'employee',
        client_id: id,
        company_name: client.company_name,
      },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({
      user_id: userData.user.id,
      email,
      name: name || null,
      role: 'employee',
      created_at: userData.user.created_at,
    }, { status: 201 })
  }

  return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { user_id } = await request.json()
  const db = getSupabaseAdmin()

  // Verifica que é realmente funcionário deste cliente
  const { data: userData } = await db.auth.admin.getUserById(user_id)
  if (
    !userData?.user ||
    userData.user.user_metadata?.client_id !== id ||
    userData.user.user_metadata?.role !== 'employee'
  ) {
    return NextResponse.json({ error: 'Acesso inválido' }, { status: 400 })
  }

  const { error } = await db.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
