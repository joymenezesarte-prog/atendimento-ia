"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, Phone, AtSign, Globe, X, Trash2, Save, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Calendar, Link2, RefreshCw, Copy } from "lucide-react";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: Phone },
  { id: "instagram", label: "Instagram", icon: AtSign },
  { id: "website", label: "Website", icon: Globe },
];

const FEATURES: { key: string; label: string; desc: string; config?: { field: string; label: string; placeholder: string; type?: string }[] }[] = [
  {
    key: "feat_send_catalog",
    label: "📁 Enviar Catálogos/PDFs",
    desc: "Envia PDFs automaticamente por palavras-chave",
    config: [{ field: "catalog_url", label: "Link do catálogo (Google Drive ou URL)", placeholder: "https://drive.google.com/..." }],
  },
  {
    key: "feat_qualify_lead",
    label: "⭐ Qualificar Lead (0-10)",
    desc: "Pontua leads com base em critérios de compra",
  },
  {
    key: "feat_escalate_human",
    label: "🧑 Encaminhar para Humano",
    desc: "Transfere conversa para atendente quando necessário",
    config: [{ field: "escalate_keyword", label: "Palavra-chave para transferir (opcional)", placeholder: "Ex: falar com humano, atendente" }],
  },
  {
    key: "feat_send_cta",
    label: "🎯 CTA de Fechamento",
    desc: "Envia link de compra no momento certo",
    config: [{ field: "cta_url", label: "Link de compra / checkout", placeholder: "https://pay.exemplo.com/..." }],
  },
  {
    key: "feat_post_payment",
    label: "💳 Ação Pós-Pagamento",
    desc: "Envia produto/agendamento após confirmação de pagamento",
    config: [{ field: "post_payment_message", label: "Mensagem pós-pagamento", placeholder: "Obrigado! Aqui está seu acesso: ..." }],
  },
  {
    key: "feat_recover_cold_leads",
    label: "🧊 Recuperar Leads Frios",
    desc: "Recontata leads inativos automaticamente",
    config: [{ field: "recovery_days", label: "Recontatar após quantos dias sem resposta", placeholder: "Ex: 3", type: "number" }],
  },
  {
    key: "feat_scheduling",
    label: "📅 Agendamento (Google Agenda)",
    desc: "Agenda horários direto no Google Calendar — conecte acima",
  },
  {
    key: "feat_confirm_presence",
    label: "🔔 Confirmar Presença",
    desc: "Envia lembretes antes do horário agendado",
    config: [{ field: "reminder_hours", label: "Horas antes do compromisso para lembrar", placeholder: "Ex: 24", type: "number" }],
  },
  {
    key: "feat_reschedule",
    label: "🔁 Reagendar/Cancelar",
    desc: "Permite reagendamentos e cancelamentos via chat",
  },
  {
    key: "feat_pre_instructions",
    label: "📋 Instruções Pré-Atendimento",
    desc: "Envia instruções antes do compromisso",
    config: [{ field: "pre_instructions_text", label: "Texto das instruções", placeholder: "Ex: Traga seu RG e chegue 10 min antes..." }],
  },
  {
    key: "feat_post_sale",
    label: "🌟 Pós-Venda",
    desc: "Solicita avaliação e faz upsell após venda",
    config: [{ field: "review_link", label: "Link para avaliação (Google, etc.)", placeholder: "https://g.page/r/..." }],
  },
  {
    key: "feat_urgency_detection",
    label: "🚨 Identificar Urgência",
    desc: "Detecta palavras de urgência e notifica equipe",
    config: [{ field: "urgency_notify_phone", label: "WhatsApp para notificar urgências", placeholder: "+5511999999999" }],
  },
  {
    key: "feat_form_integration",
    label: "🌐 Integrar Formulário/Site/Instagram",
    desc: "Recebe leads de formulários e Instagram DM",
    config: [{ field: "form_webhook_url", label: "Webhook do formulário (opcional)", placeholder: "https://..." }],
  },
];

interface Agent {
  id: string;
  name: string;
  channel: string;
  phone_number: string | null;
  status: string;
  personality: string | null;
  instructions: string | null;
  features: Record<string, boolean>;
  feature_config: Record<string, string>;
  chatwoot_inbox_id: number | null;
  google_connected: boolean;
  google_calendar_id: string | null;
  chatwoot_website_token: string | null;
  conversations_count: number;
  leads_count: number;
  clients: { id: string; company_name: string } | null;
  client_id: string;
}

interface Client { id: string; company_name: string; }

type Toast = { type: "success" | "error"; msg: string } | null;

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFeatures, setShowFeatures] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load(selectId?: string) {
    const [aRes, cRes] = await Promise.all([fetch("/api/admin/agents"), fetch("/api/admin/clients")]);
    if (aRes.status === 401) { router.push("/login"); return; }
    const [a, c] = await Promise.all([aRes.json(), cRes.json()]);
    const agentList: Agent[] = Array.isArray(a) ? a : [];
    setAgents(agentList);
    setClients(Array.isArray(c) ? c : []);
    setLoading(false);
    // Atualiza selected se ainda estiver aberto
    const targetId = selectId || selected?.id;
    if (targetId) {
      const updated = agentList.find(ag => ag.id === targetId);
      if (updated) {
        setSelected(updated);
        setEditForm({
          name: updated.name,
          channel: updated.channel,
          phone_number: updated.phone_number ?? "",
          chatwoot_inbox_id: String(updated.chatwoot_inbox_id ?? ""),
          personality: updated.personality ?? "",
          instructions: updated.instructions ?? "",
          features: updated.features ?? {},
          feature_config: updated.feature_config ?? {},
          websiteToken: updated.chatwoot_website_token ?? "",
        });
      }
    }
  }

  // Trata retorno do OAuth Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('google_success');
    const error = params.get('google_error');
    if (success) {
      showToast("success", "Google Agenda conectado com sucesso!");
      load(success);
      router.replace('/admin/agents');
    } else if (error) {
      const msgs: Record<string, string> = {
        no_refresh_token: "Token não retornado — tente novamente",
        token_exchange_failed: "Falha ao trocar código por token",
        db_error: "Erro ao salvar token no banco",
        access_denied: "Acesso negado pelo Google",
      };
      showToast("error", msgs[error] || `Erro: ${error}`);
      router.replace('/admin/agents');
    }
  }, []);

  const [form, setForm] = useState({ clientId: "", name: "", channel: "whatsapp", phone_number: "", personality: "", instructions: "" });
  const [editForm, setEditForm] = useState<{
    name: string; channel: string; phone_number: string; chatwoot_inbox_id: string;
    personality: string; instructions: string; features: Record<string, boolean>; feature_config: Record<string, string>; websiteToken: string;
  }>({ name: "", channel: "whatsapp", phone_number: "", chatwoot_inbox_id: "", personality: "", instructions: "", features: {}, feature_config: {}, websiteToken: "" });

  useEffect(() => { load(); }, []);

  function selectAgent(agent: Agent) {
    setSelected(agent);
    setEditForm({
      name: agent.name,
      channel: agent.channel,
      phone_number: agent.phone_number ?? "",
      chatwoot_inbox_id: String(agent.chatwoot_inbox_id ?? ""),
      personality: agent.personality ?? "",
      instructions: agent.instructions ?? "",
      features: agent.features ?? {},
      feature_config: agent.feature_config ?? {},
      websiteToken: agent.chatwoot_website_token ?? "",
    });
  }

  function toggleFeature(key: string) {
    setEditForm(f => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }));
  }

  function setFeatureConfig(field: string, value: string) {
    setEditForm(f => ({ ...f, feature_config: { ...f.feature_config, [field]: value } }));
  }

  async function saveAgent() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/agents/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          channel: editForm.channel,
          phone_number: editForm.phone_number || null,
          chatwoot_inbox_id: editForm.chatwoot_inbox_id ? parseInt(editForm.chatwoot_inbox_id) : null,
          personality: editForm.personality || null,
          instructions: editForm.instructions || null,
          features: editForm.features,
          feature_config: editForm.feature_config,
          chatwoot_website_token: editForm.websiteToken || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast("error", err.error || "Erro ao salvar");
      } else {
        const updated = await res.json();
        setSelected(prev => prev ? { ...prev, ...updated } : null);
        setAgents(prev => prev.map(a => a.id === selected.id ? { ...a, ...updated } : a));
        showToast("success", "Agente salvo com sucesso!");
      }
    } catch {
      showToast("error", "Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(agent: Agent) {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
    if (selected?.id === agent.id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
  }

  async function deleteAgent(id: string) {
    if (!confirm("Remover este agente?")) return;
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function handleCreate() {
    setSaving(true);
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: form.clientId,
        name: form.name,
        channel: form.channel,
        phone_number: form.phone_number || null,
        personality: form.personality,
        instructions: form.instructions,
      }),
    });
    setSaving(false);
    setShowModal(false);
    if (res.ok) {
      showToast("success", "Agente criado!");
      load();
    } else {
      showToast("error", "Erro ao criar agente");
    }
  }

  const channelIcon = (ch: string) => { const c = CHANNELS.find(x => x.id === ch); return c ? <c.icon size={13} /> : null; };
  const activeFeats = (agent: Agent) => Object.values(agent.features ?? {}).filter(Boolean).length;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 999,
          background: toast.type === "success" ? "var(--green)" : "var(--danger)",
          color: "white", padding: "12px 18px", borderRadius: "10px",
          display: "flex", alignItems: "center", gap: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontSize: "14px", fontWeight: 600,
        }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Agentes IA</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{agents.length} configurados</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ clientId: clients[0]?.id ?? "", name: "", channel: "whatsapp", phone_number: "", personality: "", instructions: "" }); setShowModal(true); }}>
          <Plus size={16} /> Novo Agente
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 460px" : "1fr", gap: "20px", alignItems: "start" }}>
        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {agents.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <Bot size={32} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>Nenhum agente criado ainda</p>
            </div>
          ) : agents.map(agent => (
            <div
              key={agent.id}
              className="card"
              style={{ padding: "16px 20px", cursor: "pointer", border: selected?.id === agent.id ? "2px solid var(--green)" : "2px solid transparent", transition: "all 0.15s" }}
              onClick={() => selected?.id === agent.id ? setSelected(null) : selectAgent(agent)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: agent.status === "active" ? "var(--green-50)" : "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={20} style={{ color: agent.status === "active" ? "var(--green)" : "var(--gray-400)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{agent.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--gray-500)", fontSize: "11px" }}>{channelIcon(agent.channel)} {CHANNELS.find(c => c.id === agent.channel)?.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "3px" }}>
                    <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{agent.clients?.company_name ?? "—"}</p>
                    {agent.phone_number && <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>📱 {agent.phone_number}</p>}
                    {activeFeats(agent) > 0 && <p style={{ color: "var(--green)", fontSize: "12px", fontWeight: 600 }}>{activeFeats(agent)} funções ativas</p>}
                    {agent.google_connected && <p style={{ color: "#4285f4", fontSize: "12px", fontWeight: 600 }}>📅 Agenda conectada</p>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>{agent.conversations_count}</p>
                    <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>conversas</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>{agent.leads_count}</p>
                    <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>leads</p>
                  </div>
                  <div
                    onClick={e => { e.stopPropagation(); toggleStatus(agent); }}
                    style={{ width: "40px", height: "22px", borderRadius: "11px", background: agent.status === "active" ? "var(--green)" : "var(--gray-200)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
                  >
                    <div style={{ position: "absolute", top: "3px", left: agent.status === "active" ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <button className="btn-ghost" style={{ padding: "6px", color: "var(--danger)" }} onClick={e => { e.stopPropagation(); deleteAgent(agent.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Painel de edição */}
        {selected && (
          <div className="card" style={{ padding: "20px", alignSelf: "start", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>Configurar Agente</h3>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Nome</label>
                <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Canal</label>
                  <select className="input" value={editForm.channel} onChange={e => setEditForm(f => ({ ...f, channel: e.target.value }))}>
                    {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Nº WhatsApp</label>
                  <input className="input" value={editForm.phone_number} onChange={e => setEditForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+5511999..." />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>
                  ID Inbox Chatwoot
                  <span style={{ color: "var(--green)", marginLeft: "6px", fontSize: "10px", fontWeight: 400, textTransform: "none" }}>Chatwoot → Configurações → Caixas de entrada → ID</span>
                </label>
                <input className="input" type="number" value={editForm.chatwoot_inbox_id} onChange={e => setEditForm(f => ({ ...f, chatwoot_inbox_id: e.target.value }))} placeholder="Ex: 1" />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Personalidade</label>
                <input className="input" value={editForm.personality} onChange={e => setEditForm(f => ({ ...f, personality: e.target.value }))} placeholder="Ex: Simpática, profissional, objetiva" />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Instruções / System Prompt</label>
                <textarea
                  className="input"
                  value={editForm.instructions}
                  onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Você é um assistente de atendimento para..."
                  rows={4}
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
                />
              </div>

              {/* Google Agenda */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Google Agenda
                </label>
                {selected?.google_connected ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--green-50)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px" }}>
                    <CheckCircle size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "var(--green)", fontSize: "12px", fontWeight: 700 }}>✓ Conectado</p>
                      <p style={{ color: "var(--gray-500)", fontSize: "11px" }}>{selected.google_calendar_id || "Calendário primário"}</p>
                    </div>
                    <a
                      href={`/api/admin/google/auth?agent_id=${selected.id}`}
                      style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--gray-500)", fontSize: "11px", textDecoration: "none", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--gray-200)", background: "white" }}
                    >
                      <RefreshCw size={11} /> Reconectar
                    </a>
                  </div>
                ) : (
                  <a
                    href={`/api/admin/google/auth?agent_id=${selected?.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px",
                      background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px",
                      textDecoration: "none", color: "var(--gray-700)", fontSize: "13px", fontWeight: 600,
                      transition: "all 0.15s", cursor: "pointer",
                    }}
                  >
                    <Calendar size={15} style={{ color: "#4285f4" }} />
                    <span>Conectar Google Agenda do cliente</span>
                    <Link2 size={13} style={{ color: "var(--gray-400)", marginLeft: "auto" }} />
                  </a>
                )}
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "6px" }}>
                  Faça login com o Gmail do cliente para autorizar o agendamento automático.
                </p>
              </div>


              {/* Chat no Site */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Chat no Site (Widget)
                </label>
                <input
                  className="input"
                  value={editForm.websiteToken}
                  onChange={e => setEditForm(f => ({ ...f, websiteToken: e.target.value }))}
                  placeholder="Token do website inbox do Chatwoot"
                  style={{ fontFamily: "monospace", fontSize: "12px" }}
                />
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "5px" }}>
                  Chatwoot → Configurações → Caixas de entrada → Website → Configurações → Token
                </p>
                {editForm.websiteToken && (
                  <div style={{ marginTop: "10px", position: "relative" }}>
                    <pre style={{
                      background: "var(--gray-900)", color: "#e2e8f0",
                      padding: "12px", borderRadius: "var(--radius-sm)",
                      fontSize: "10px", lineHeight: "1.5", overflow: "auto",
                      margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all",
                    }}>
{`<script>
  (function(d,t) {
    var BASE_URL="${process.env.NEXT_PUBLIC_CHATWOOT_URL||'https://chat.atendimentoia.cloud'}";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.defer=true; g.async=true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: '${editForm.websiteToken}',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>`}
                    </pre>
                    <button
                      onClick={() => {
                        const base = process.env.NEXT_PUBLIC_CHATWOOT_URL || 'https://chat.atendimentoia.cloud';
                        const script = `<script>\n  (function(d,t) {\n    var BASE_URL="${base}";\n    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];\n    g.src=BASE_URL+"/packs/js/sdk.js";\n    g.defer=true; g.async=true;\n    s.parentNode.insertBefore(g,s);\n    g.onload=function(){\n      window.chatwootSDK.run({\n        websiteToken: '${editForm.websiteToken}',\n        baseUrl: BASE_URL\n      })\n    }\n  })(document,"script");\n<\/script>`;
                        navigator.clipboard.writeText(script);
                      }}
                      style={{
                        position: "absolute", top: "8px", right: "8px",
                        display: "flex", alignItems: "center", gap: "4px",
                        background: "rgba(255,255,255,0.1)", color: "white",
                        border: "none", borderRadius: "5px", padding: "4px 8px",
                        fontSize: "10px", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <Copy size={10} /> Copiar
                    </button>
                  </div>
                )}
              </div>

              {/* Feature Toggles */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <button
                  onClick={() => setShowFeatures(f => !f)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showFeatures ? "10px" : 0 }}
                >
                  <span style={{ color: "var(--gray-700)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Funcionalidades ({Object.values(editForm.features).filter(Boolean).length}/{FEATURES.length} ativas)
                  </span>
                  {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showFeatures && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {FEATURES.map(feat => (
                      <div key={feat.key}>
                        <div
                          onClick={() => toggleFeature(feat.key)}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px",
                            borderRadius: "var(--radius-sm)", cursor: "pointer",
                            background: editForm.features[feat.key] ? "var(--green-50)" : "var(--gray-50)",
                            border: `1px solid ${editForm.features[feat.key] ? "rgba(34,197,94,0.25)" : "var(--gray-100)"}`,
                            transition: "all 0.15s",
                          }}
                        >
                          <div style={{ width: "34px", height: "19px", borderRadius: "10px", flexShrink: 0, background: editForm.features[feat.key] ? "var(--green)" : "var(--gray-200)", position: "relative", transition: "background 0.2s" }}>
                            <div style={{ position: "absolute", top: "2.5px", width: "14px", height: "14px", left: editForm.features[feat.key] ? "17px" : "3px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: "var(--gray-800)", fontSize: "12px", fontWeight: 600 }}>{feat.label}</p>
                            <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "1px" }}>{feat.desc}</p>
                          </div>
                        </div>

                        {editForm.features[feat.key] && feat.config && (
                          <div style={{ marginTop: "4px", marginLeft: "10px", padding: "10px", background: "var(--gray-50)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--green)", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {feat.config.map(cfg => (
                              <div key={cfg.field}>
                                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "10px", fontWeight: 600, marginBottom: "3px" }}>{cfg.label}</label>
                                <input
                                  className="input"
                                  type={cfg.type || "text"}
                                  value={editForm.feature_config[cfg.field] || ""}
                                  onChange={e => setFeatureConfig(cfg.field, e.target.value)}
                                  placeholder={cfg.placeholder}
                                  style={{ fontSize: "12px", padding: "6px 10px" }}
                                  onClick={e => e.stopPropagation()}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn-primary" onClick={saveAgent} disabled={saving} style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}>
                <Save size={14} /> {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo Agente */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: "480px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>Novo Agente IA</h3>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Cliente</label>
                <select className="input" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Nome do Agente</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Joy Atendente IA" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Canal</label>
                  <select className="input" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Nº WhatsApp</label>
                  <input className="input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+5511999..." />
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Personalidade</label>
                <input className="input" value={form.personality} onChange={e => setForm(f => ({ ...f, personality: e.target.value }))} placeholder="Ex: Simpática, profissional, objetiva" />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Instruções Iniciais</label>
                <textarea className="input" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Você é um assistente de atendimento para..." rows={3} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.name || !form.clientId}>
                  {saving ? "Criando..." : "Criar Agente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
