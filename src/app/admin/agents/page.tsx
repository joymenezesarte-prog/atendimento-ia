"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, Phone, AtSign, Globe, X, Trash2, Save, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Calendar, Link2, RefreshCw, Copy, FileText, Key } from "lucide-react";

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
  groq_api_key: string | null;
  gemini_api_key: string | null;
  resend_api_key: string | null;
  features: Record<string, boolean>;
  feature_config: Record<string, string>;
  chatwoot_inbox_id: number | null;
  google_connected: boolean;
  google_calendar_id: string | null;
  notification_email: string | null;
  chatwoot_website_token: string | null;
  chatwoot_instagram_inbox_id: number | null;
  conversations_count: number;
  leads_count: number;
  clients: { id: string; company_name: string } | null;
  client_id: string;
}

interface Client { id: string; company_name: string; }
interface ChaiwootInbox { id: number; name: string; channel_type: string; }

type Toast = { type: "success" | "error"; msg: string } | null;

function buildEmbedScript(token: string): string {
  return [
    "<script>",
    "  (function(d,t) {",
    '    var BASE_URL="https://chat.atendimentoia.cloud";',
    "    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];",
    '    g.src=BASE_URL+"/packs/js/sdk.js";',
    "    g.defer=true; g.async=true;",
    "    s.parentNode.insertBefore(g,s);",
    "    g.onload=function(){",
    "      window.chatwootSDK.run({",
    "        websiteToken: '" + token + "',",
    "        baseUrl: BASE_URL",
    "      })",
    "    }",
    "  })(document,\"script\");",
    "<\/script>",
  ].join("\n");
}

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
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [creatingWidget, setCreatingWidget] = useState(false);
  const [creatingInbox, setCreatingInbox] = useState(false);
  const [chatwootInboxes, setChatwootInboxes] = useState<ChaiwootInbox[]>([]);
  const [loadingInboxes, setLoadingInboxes] = useState(false);
  const [inboxesLoaded, setInboxesLoaded] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [instagramFallback, setInstagramFallback] = useState(false);
  const [instagramManualId, setInstagramManualId] = useState("");
  const [fixingInbox, setFixingInbox] = useState(false);

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
          groq_api_key: updated.groq_api_key ?? "",
          gemini_api_key: updated.gemini_api_key ?? "",
          resend_api_key: updated.resend_api_key ?? "",
          features: updated.features ?? {},
          feature_config: updated.feature_config ?? {},
          instagramInboxId: String(updated.chatwoot_instagram_inbox_id ?? ""),
          notification_email: updated.notification_email ?? "",
        });
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("google_success");
    const error = params.get("google_error");
    if (success) {
      showToast("success", "Google Agenda conectado com sucesso!");
      load(success);
      router.replace("/admin/agents");
    } else if (error) {
      const msgs: Record<string, string> = {
        no_refresh_token: "Token não retornado — tente novamente",
        token_exchange_failed: "Falha ao trocar código por token",
        db_error: "Erro ao salvar token no banco",
        access_denied: "Acesso negado pelo Google",
      };
      showToast("error", msgs[error] || "Erro: " + error);
      router.replace("/admin/agents");
    }
  }, []);

  const [form, setForm] = useState({ clientId: "", name: "", channel: "whatsapp", phone_number: "", personality: "", instructions: "", groq_api_key: "" });
  const [editForm, setEditForm] = useState<{
    name: string; channel: string; phone_number: string; chatwoot_inbox_id: string;
    personality: string; instructions: string; groq_api_key: string; gemini_api_key: string;
    resend_api_key: string; features: Record<string, boolean>;
    feature_config: Record<string, string>; instagramInboxId: string; notification_email: string;
  }>({ name: "", channel: "whatsapp", phone_number: "", chatwoot_inbox_id: "", personality: "", instructions: "", groq_api_key: "", gemini_api_key: "", resend_api_key: "", features: {}, feature_config: {}, instagramInboxId: "", notification_email: "" });

  useEffect(() => { load(); }, []);

  function selectAgent(agent: Agent) {
    setSelected(agent);
    setInboxesLoaded(false);
    setChatwootInboxes([]);
    setEditForm({
      name: agent.name,
      channel: agent.channel,
      phone_number: agent.phone_number ?? "",
      chatwoot_inbox_id: String(agent.chatwoot_inbox_id ?? ""),
      personality: agent.personality ?? "",
      instructions: agent.instructions ?? "",
      groq_api_key: agent.groq_api_key ?? "",
      gemini_api_key: agent.gemini_api_key ?? "",
      resend_api_key: agent.resend_api_key ?? "",
      features: agent.features ?? {},
      feature_config: agent.feature_config ?? {},
      instagramInboxId: String(agent.chatwoot_instagram_inbox_id ?? ""),
      notification_email: agent.notification_email ?? "",
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
      const res = await fetch("/api/admin/agents/" + selected.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          channel: editForm.channel,
          phone_number: editForm.phone_number || null,
          chatwoot_inbox_id: editForm.chatwoot_inbox_id ? parseInt(editForm.chatwoot_inbox_id) : null,
          personality: editForm.personality || null,
          instructions: editForm.instructions || null,
          groq_api_key: editForm.groq_api_key || null,
          gemini_api_key: editForm.gemini_api_key || null,
          resend_api_key: editForm.resend_api_key || null,
          features: editForm.features,
          feature_config: editForm.feature_config,
          chatwoot_instagram_inbox_id: editForm.instagramInboxId ? parseInt(editForm.instagramInboxId) : null,
          notification_email: editForm.notification_email || null,
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

  async function createWidget(force = false) {
    if (!selected) return;
    setCreatingWidget(true);
    try {
      const res = await fetch("/api/admin/agents/" + selected.id + "/create-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Erro ao criar widget");
      } else {
        showToast("success", force ? "Widget recriado com sucesso!" : data.already_existed ? "Widget já existia — token carregado!" : "Widget criado com sucesso!");
        load(selected.id);
      }
    } catch {
      showToast("error", "Erro de conexão");
    } finally {
      setCreatingWidget(false);
    }
  }

  async function fixInbox() {
    if (!selected) return;
    setFixingInbox(true);
    try {
      const res = await fetch("/api/admin/agents/" + selected.id + "/fix-inbox", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Erro ao corrigir inbox");
      } else {
        showToast("success", data.summary || "Inboxes corrigidas!");
      }
    } catch {
      showToast("error", "Erro de conexão");
    } finally {
      setFixingInbox(false);
    }
  }

  async function createInbox() {
    if (!selected) return;
    setCreatingInbox(true);
    try {
      const res = await fetch("/api/admin/agents/" + selected.id + "/create-inbox", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Erro ao criar inbox");
      } else {
        showToast("success", data.already_existed ? "Inbox já existia (ID: " + data.inbox_id + ")" : "Inbox criada com sucesso! (ID: " + data.inbox_id + ")");
        load(selected.id);
      }
    } catch {
      showToast("error", "Erro de conexão");
    } finally {
      setCreatingInbox(false);
    }
  }

  async function saveInstagramInboxId(inboxId: number) {
    if (!selected) return;
    const res = await fetch("/api/admin/agents/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatwoot_instagram_inbox_id: inboxId }),
    });
    if (res.ok) {
      showToast("success", "Instagram conectado! Inbox ID: " + inboxId);
      setInstagramFallback(false);
      setInstagramManualId("");
      load(selected.id);
    } else {
      showToast("error", "Erro ao salvar inbox");
    }
  }

  async function connectInstagram() {
    if (!selected) return;
    setConnectingInstagram(true);
    setInstagramFallback(false);
    const cfgRes = await fetch("/api/admin/chatwoot/config");
    if (!cfgRes.ok) { showToast("error", "Erro ao buscar config do Chatwoot"); setConnectingInstagram(false); return; }
    const { url: chatwootUrl, account_id } = await cfgRes.json();
    const beforeRes = await fetch("/api/admin/chatwoot/inboxes");
    const beforeInboxes: ChaiwootInbox[] = beforeRes.ok ? await beforeRes.json() : [];
    const beforeIds = new Set(beforeInboxes.map((i: ChaiwootInbox) => i.id));
    const popupUrl = chatwootUrl + "/app/accounts/" + account_id + "/settings/inboxes/new/instagram";
    const popup = window.open(popupUrl, "instagram-connect", "width=900,height=650,scrollbars=yes,resizable=yes");
    if (!popup) { showToast("error", "Popup bloqueado — permita popups para este site"); setConnectingInstagram(false); return; }
    const timer = setInterval(async () => {
      if (popup.closed) {
        clearInterval(timer);
        await new Promise(r => setTimeout(r, 2000));
        const afterRes = await fetch("/api/admin/chatwoot/inboxes");
        setConnectingInstagram(false);
        if (!afterRes.ok) { setInstagramFallback(true); return; }
        const afterInboxes: ChaiwootInbox[] = await afterRes.json();
        const newInboxes = afterInboxes.filter(i => !beforeIds.has(i.id));
        if (newInboxes.length > 0) {
          const instagramFirst = newInboxes.sort((a, b) => {
            const aMatch = a.channel_type.toLowerCase().includes("instagram") || a.name.toLowerCase().includes("instagram") ? -1 : 0;
            const bMatch = b.channel_type.toLowerCase().includes("instagram") || b.name.toLowerCase().includes("instagram") ? -1 : 0;
            return aMatch - bMatch;
          });
          await saveInstagramInboxId(instagramFirst[0].id);
        } else { setInstagramFallback(true); }
      }
    }, 800);
  }

  async function loadChatwootInboxes() {
    setLoadingInboxes(true);
    try {
      const res = await fetch("/api/admin/chatwoot/inboxes");
      if (res.ok) { const data = await res.json(); setChatwootInboxes(Array.isArray(data) ? data : []); setInboxesLoaded(true); }
      else showToast("error", "Erro ao buscar inboxes do Chatwoot");
    } catch { showToast("error", "Erro de conexão"); } finally { setLoadingInboxes(false); }
  }

  async function toggleStatus(agent: Agent) {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    await fetch("/api/admin/agents/" + agent.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
    if (selected?.id === agent.id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
  }

  async function deleteAgent(id: string) {
    if (!confirm("Remover este agente?")) return;
    await fetch("/api/admin/agents/" + id, { method: "DELETE" });
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function handleCreate() {
    setSaving(true);
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: form.clientId, name: form.name, channel: form.channel, phone_number: form.phone_number || null, personality: form.personality, instructions: form.instructions, groq_api_key: form.groq_api_key || null }),
    });
    setSaving(false);
    setShowModal(false);
    if (res.ok) { showToast("success", "Agente criado!"); load(); }
    else showToast("error", "Erro ao criar agente");
  }

  const channelIcon = (ch: string) => { const c = CHANNELS.find(x => x.id === ch); return c ? <c.icon size={13} /> : null; };
  const activeFeats = (agent: Agent) => Object.values(agent.features ?? {}).filter(Boolean).length;
  const instagramInboxes = chatwootInboxes.filter(i => i.channel_type === "Channel::Instagram" || i.channel_type === "Channel::Instagramdm" || i.name.toLowerCase().includes("instagram"));

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, background: toast.type === "success" ? "var(--green)" : "var(--danger)", color: "white", padding: "12px 18px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontSize: "14px", fontWeight: 600 }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Agentes IA</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{agents.length} configurados</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ clientId: clients[0]?.id ?? "", name: "", channel: "whatsapp", phone_number: "", personality: "", instructions: "", groq_api_key: "" }); setShowModal(true); }}>
          <Plus size={16} /> Novo Agente
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 460px" : "1fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {agents.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <Bot size={32} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>Nenhum agente criado ainda</p>
            </div>
          ) : agents.map(agent => (
            <div key={agent.id} className="card" style={{ padding: "16px 20px", cursor: "pointer", border: selected?.id === agent.id ? "2px solid var(--green)" : "2px solid transparent", transition: "all 0.15s" }} onClick={() => selected?.id === agent.id ? setSelected(null) : selectAgent(agent)}>
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
                  <div style={{ textAlign: "center" }}><p style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>{agent.conversations_count}</p><p style={{ color: "var(--gray-400)", fontSize: "10px" }}>conversas</p></div>
                  <div style={{ textAlign: "center" }}><p style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>{agent.leads_count}</p><p style={{ color: "var(--gray-400)", fontSize: "10px" }}>leads</p></div>
                  <div onClick={e => { e.stopPropagation(); toggleStatus(agent); }} style={{ width: "40px", height: "22px", borderRadius: "11px", background: agent.status === "active" ? "var(--green)" : "var(--gray-200)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: "3px", left: agent.status === "active" ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <button className="btn-ghost" style={{ padding: "6px", color: "var(--danger)" }} onClick={e => { e.stopPropagation(); deleteAgent(agent.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

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
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Inbox WhatsApp (Chatwoot)</label>
                {selected.chatwoot_inbox_id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--green-50)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px" }}>
                    <CheckCircle size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}><p style={{ color: "var(--green)", fontSize: "12px", fontWeight: 700 }}>✓ Inbox criada</p><p style={{ color: "var(--gray-500)", fontSize: "11px" }}>{"ID: " + selected.chatwoot_inbox_id}</p></div>
                    <button onClick={createInbox} disabled={creatingInbox} style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--gray-500)", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--gray-200)", background: "white", cursor: "pointer" }}><RefreshCw size={11} /> Recriar</button>
                  </div>
                ) : (
                  <button onClick={createInbox} disabled={creatingInbox} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "12px 16px", background: "white", border: "2px dashed var(--gray-200)", borderRadius: "8px", cursor: creatingInbox ? "not-allowed" : "pointer", color: "var(--gray-600)", fontSize: "13px", fontWeight: 600 }}>
                    <Phone size={14} style={{ color: "var(--green)" }} />
                    {creatingInbox ? "Criando inbox no Chatwoot..." : "Criar Inbox WhatsApp"}
                    {!creatingInbox && <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--gray-400)" }}>automático ✨</span>}
                  </button>
                )}
              </div>

              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Personalidade</label>
                <input className="input" value={editForm.personality} onChange={e => setEditForm(f => ({ ...f, personality: e.target.value }))} placeholder="Ex: Simpática, profissional, objetiva" />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Instruções / System Prompt</label>
                <textarea className="input" value={editForm.instructions} onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Você é um assistente de atendimento para..." rows={4} style={{ resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} />
              </div>

              {/* Chaves de API do cliente */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <Key size={13} style={{ color: "var(--gray-500)" }} />
                  <span style={{ color: "var(--gray-600)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Chaves de API do Cliente</span>
                </div>
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginBottom: "10px" }}>
                  Cada cliente usa suas próprias chaves — sem limite compartilhado.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>🤖 Gemini API Key</label>
                    <input className="input" type="password" value={editForm.gemini_api_key} onChange={e => setEditForm(f => ({ ...f, gemini_api_key: e.target.value }))} placeholder="AIza..." style={{ fontFamily: "monospace", fontSize: "12px" }} />
                    <p style={{ color: "var(--gray-400)", fontSize: "10px", marginTop: "3px" }}>Em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>aistudio.google.com/apikey</a> — gratuito</p>
                  </div>

                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>📧 Resend API Key (email)</label>
                    <input className="input" type="password" value={editForm.resend_api_key} onChange={e => setEditForm(f => ({ ...f, resend_api_key: e.target.value }))} placeholder="re_..." style={{ fontFamily: "monospace", fontSize: "12px" }} />
                    <p style={{ color: "var(--gray-400)", fontSize: "10px", marginTop: "3px" }}>Em <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>resend.com</a> — 3.000 emails/mês grátis por conta</p>
                  </div>

                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>🔑 Groq API Key (Whisper/áudio)</label>
                    <input className="input" type="password" value={editForm.groq_api_key} onChange={e => setEditForm(f => ({ ...f, groq_api_key: e.target.value }))} placeholder="gsk_..." style={{ fontFamily: "monospace", fontSize: "12px" }} />
                    <p style={{ color: "var(--gray-400)", fontSize: "10px", marginTop: "3px" }}>Em <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>console.groq.com</a> — gratuito</p>
                  </div>
                </div>
              </div>

              {/* Google Agenda */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Google Agenda</label>
                {selected.google_connected ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--green-50)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px" }}>
                    <CheckCircle size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}><p style={{ color: "var(--green)", fontSize: "12px", fontWeight: 700 }}>✓ Conectado</p><p style={{ color: "var(--gray-500)", fontSize: "11px" }}>{selected.google_calendar_id || "Calendário primário"}</p></div>
                    <a href={"/api/admin/google/auth?agent_id=" + selected.id} style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--gray-500)", fontSize: "11px", textDecoration: "none", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--gray-200)", background: "white" }}><RefreshCw size={11} /> Reconectar</a>
                  </div>
                ) : (
                  <a href={"/api/admin/google/auth?agent_id=" + selected.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", textDecoration: "none", color: "var(--gray-700)", fontSize: "13px", fontWeight: 600 }}>
                    <Calendar size={15} style={{ color: "#4285f4" }} />
                    <span>Conectar Google Agenda do cliente</span>
                    <Link2 size={13} style={{ color: "var(--gray-400)", marginLeft: "auto" }} />
                  </a>
                )}
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "6px" }}>Faça login com o Gmail do cliente para autorizar o agendamento automático.</p>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>📬 Email de notificação da equipe</label>
                  <input className="input" type="email" value={editForm.notification_email} onChange={e => setEditForm(f => ({ ...f, notification_email: e.target.value }))} placeholder="equipe@suaempresa.com" style={{ fontSize: "13px" }} />
                  <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "4px" }}>Receba um email a cada agendamento confirmado. Requer Resend API Key acima.</p>
                </div>
              </div>

              {/* Chat no Site */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Chat no Site (Widget)</label>
                {selected.chatwoot_website_token ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--green-50)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", marginBottom: "10px" }}>
                      <CheckCircle size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}><p style={{ color: "var(--green)", fontSize: "12px", fontWeight: 700 }}>✓ Widget criado</p><p style={{ color: "var(--gray-500)", fontSize: "11px", fontFamily: "monospace" }}>{selected.chatwoot_website_token}</p></div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => fixInbox()} disabled={fixingInbox} style={{ display: "flex", alignItems: "center", gap: "5px", color: "#7c3aed", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #ddd6fe", background: "#f5f3ff", cursor: fixingInbox ? "not-allowed" : "pointer", fontWeight: 600 }}><AlertCircle size={11} /> {fixingInbox ? "Corrigindo..." : "Corrigir IA"}</button>
                        <button onClick={() => createWidget(true)} disabled={creatingWidget} style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--gray-500)", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--gray-200)", background: "white", cursor: "pointer" }}><RefreshCw size={11} /> Recriar</button>
                      </div>
                    </div>
                    <div style={{ position: "relative" }}>
                      <pre style={{ background: "var(--gray-900)", color: "#e2e8f0", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: "10px", lineHeight: "1.5", overflow: "auto", margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{buildEmbedScript(selected.chatwoot_website_token)}</pre>
                      <button onClick={() => { navigator.clipboard.writeText(buildEmbedScript(selected.chatwoot_website_token!)); setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); }} style={{ position: "absolute", top: "8px", right: "8px", display: "flex", alignItems: "center", gap: "4px", background: copiedScript ? "var(--green)" : "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "5px", padding: "4px 8px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}><Copy size={10} /> {copiedScript ? "Copiado!" : "Copiar Script"}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => createWidget()} disabled={creatingWidget} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "12px 16px", background: "white", border: "2px dashed var(--gray-200)", borderRadius: "8px", cursor: creatingWidget ? "not-allowed" : "pointer", color: "var(--gray-600)", fontSize: "13px", fontWeight: 600 }}>
                    <Globe size={15} style={{ color: "var(--green)" }} />
                    {creatingWidget ? "Criando widget no Chatwoot..." : "Criar Widget de Chat para o Site"}
                    {!creatingWidget && <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--gray-400)" }}>automático ✨</span>}
                  </button>
                )}
              </div>

              {/* Instagram Direct */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Instagram Direct</label>
                {selected.chatwoot_instagram_inbox_id && !instagramFallback ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "linear-gradient(135deg, rgba(131,58,180,0.08), rgba(252,180,69,0.08))", border: "1px solid rgba(131,58,180,0.25)", borderRadius: "8px" }}>
                    <CheckCircle size={16} style={{ color: "#833ab4", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}><p style={{ color: "#833ab4", fontSize: "12px", fontWeight: 700 }}>{"✓ Conectado"}</p><p style={{ color: "var(--gray-500)", fontSize: "11px" }}>{"Inbox #" + selected.chatwoot_instagram_inbox_id}</p></div>
                    <button onClick={connectInstagram} disabled={connectingInstagram} style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--gray-500)", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--gray-200)", background: "white", cursor: "pointer" }}><RefreshCw size={11} /> Reconectar</button>
                  </div>
                ) : instagramFallback ? (
                  <div style={{ padding: "12px", background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: "8px" }}>
                    <p style={{ color: "#c2410c", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Inbox nao detectada automaticamente. Cole o ID:</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input className="input" type="number" placeholder="ID da inbox (ex: 5)" value={instagramManualId} onChange={e => setInstagramManualId(e.target.value)} style={{ fontSize: "13px" }} />
                      <button onClick={() => instagramManualId ? saveInstagramInboxId(parseInt(instagramManualId)) : null} disabled={!instagramManualId} style={{ padding: "0 14px", background: "#833ab4", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: instagramManualId ? "pointer" : "not-allowed" }}>Salvar</button>
                      <button onClick={connectInstagram} style={{ padding: "0 10px", background: "white", color: "var(--gray-600)", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>Tentar de novo</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={connectInstagram} disabled={connectingInstagram} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", width: "100%", cursor: connectingInstagram ? "not-allowed" : "pointer", color: "var(--gray-700)", fontSize: "13px", fontWeight: 600 }}>
                    <AtSign size={15} style={{ color: "#833ab4" }} />
                    <span>{connectingInstagram ? "Aguardando conexao no Chatwoot..." : "Conectar Instagram do cliente"}</span>
                    {!connectingInstagram && <Link2 size={13} style={{ color: "var(--gray-400)", marginLeft: "auto" }} />}
                  </button>
                )}
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "6px" }}>Abre o Chatwoot para conectar a conta Instagram. Detecta e salva automaticamente ao fechar.</p>
              </div>

              {/* Formulários / Webhook */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  <FileText size={12} style={{ display: "inline", marginRight: "5px" }} />Formulários {"&"} Webhook
                </label>
                <div style={{ padding: "10px 14px", background: "var(--gray-50)", borderRadius: "8px", border: "1px solid var(--gray-200)" }}>
                  <p style={{ color: "var(--gray-500)", fontSize: "11px", marginBottom: "6px" }}>URL do Webhook (cole no formulário do site, Google Forms ou Sheets):</p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <code style={{ flex: 1, fontSize: "10px", color: "var(--gray-700)", background: "white", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--gray-200)", wordBreak: "break-all" }}>{"https://app.atendimentoia.cloud/api/webhooks/form/" + selected.id}</code>
                    <button onClick={() => { navigator.clipboard.writeText("https://app.atendimentoia.cloud/api/webhooks/form/" + selected.id); setCopiedWebhook(true); setTimeout(() => setCopiedWebhook(false), 2000); }} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--gray-200)", background: copiedWebhook ? "var(--green)" : "white", color: copiedWebhook ? "white" : "var(--gray-600)", fontSize: "11px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}><Copy size={11} /> {copiedWebhook ? "Copiado!" : "Copiar"}</button>
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "13px" }}>
                <button onClick={() => setShowFeatures(f => !f)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showFeatures ? "10px" : 0 }}>
                  <span style={{ color: "var(--gray-700)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Funcionalidades ({Object.values(editForm.features).filter(Boolean).length}/{FEATURES.length} ativas)</span>
                  {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showFeatures && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {FEATURES.map(feat => (
                      <div key={feat.key}>
                        <div onClick={() => toggleFeature(feat.key)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: editForm.features[feat.key] ? "var(--green-50)" : "var(--gray-50)", border: "1px solid " + (editForm.features[feat.key] ? "rgba(34,197,94,0.25)" : "var(--gray-100)"), transition: "all 0.15s" }}>
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
                                <input className="input" type={cfg.type || "text"} value={editForm.feature_config[cfg.field] || ""} onChange={e => setFeatureConfig(cfg.field, e.target.value)} placeholder={cfg.placeholder} style={{ fontSize: "12px", padding: "6px 10px" }} onClick={e => e.stopPropagation()} />
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
                <Save size={14} /> {saving ? "Salvando..." : "Salvar Alteracoes"}
              </button>
            </div>
          </div>
        )}
      </div>

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
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Nr WhatsApp</label>
                  <input className="input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+5511999..." />
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Personalidade</label>
                <input className="input" value={form.personality} onChange={e => setForm(f => ({ ...f, personality: e.target.value }))} placeholder="Ex: Simpatica, profissional, objetiva" />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "5px" }}>Instrucoes Iniciais</label>
                <textarea className="input" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Voce e um assistente de atendimento para..." rows={3} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.name || !form.clientId}>{saving ? "Criando..." : "Criar Agente"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
