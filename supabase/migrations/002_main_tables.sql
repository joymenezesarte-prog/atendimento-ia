-- ============================================================
-- MIGRATION 002: Tabelas principais do SaaS
-- ============================================================

-- CLIENTS (empresas assinantes — vinculadas a um user do Supabase)
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  plan_id TEXT CHECK (plan_id IN ('atendimento', 'vendas', 'operacao')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
  api_key TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENTS (agentes de IA de cada cliente)
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'website')),
  phone_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training')),
  personality TEXT DEFAULT 'professional',
  instructions TEXT,
  features JSONB DEFAULT '{}',
  conversations_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS (prospects captados pelos agentes)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  channel TEXT DEFAULT 'whatsapp',
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'quote_sent', 'waiting_payment', 'scheduled', 'done')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  service TEXT,
  notes TEXT,
  last_contact TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSATIONS (conversas entre leads e agentes)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  channel TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred')),
  score INTEGER DEFAULT 0,
  summary TEXT,
  transferred_to TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES (mensagens de cada conversa)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS (agendamentos)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  service TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
  notes TEXT,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS (equipe de cada cliente)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'attendant' CHECK (role IN ('admin', 'manager', 'attendant', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Clients: usuário vê apenas o próprio registro
CREATE POLICY "client_own" ON clients FOR ALL USING (auth.uid() = user_id);

-- Demais tabelas: acesso via client_id do usuário logado
CREATE POLICY "agents_own" ON agents FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "leads_own" ON leads FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "conversations_own" ON conversations FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "messages_own" ON messages FOR ALL USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN clients cl ON cl.id = c.client_id
    WHERE cl.user_id = auth.uid()
  )
);
CREATE POLICY "appointments_own" ON appointments FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "team_own" ON team_members FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agents_client ON agents(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_team_client ON team_members(client_id);

-- ============================================================
-- TRIGGER: cria client automaticamente ao confirmar assinatura
-- ============================================================

CREATE OR REPLACE FUNCTION create_client_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clients (user_id, company_name, contact_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_client_on_signup();
