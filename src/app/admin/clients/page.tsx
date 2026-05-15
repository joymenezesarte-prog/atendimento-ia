"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Bot, X, Check, Smartphone, ChevronDown, ChevronUp, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";

const PLANS = [
  { id: "atendimento", name: "Atendimento IA", monthly: 249 },
  { id: "vendas",      name: "Vendas IA",      monthly: 499 },
  { id: "operacao",    name: "Operação IA",    monthly: 889 },
];
const PLAN_MAP: Record<string, string> = { atendimento: "Atendimento IA", vendas: "Vendas IA", operacao: "Operação IA" };

const ALL_MODULES = [
  { id: "conversations", label: "💬 Conversas",    desc: "Histórico de conversas com leads" },
  { id: "leads",         label: "🎯 Leads",         desc: "CRM de leads captados pelo agente" },
  { id: "calendar",      label: "📅 Agendamentos",  desc: "Agenda e gestão de horários" },
  { id: "products",      label: "📦 Produtos",      desc: "Catálogo de produtos + links de pagamento MP/Stripe" },
  { id: "reports",       label: "📊 Relatórios",    desc: "Métricas e desempenho do agente" },
  { id: "team",          label: "👥 Equipe",        desc: "Gestão de membros da equipe" },
];

const DEFAULT_MODULES: Record<string, boolean> = {
  conversations: true,
  leads: true,
  calendar: true,
  products: false,
  reports: true,
  team: false,
};

interface Client {
  id: string; company_name: string; contact_name: string | null;
  email: string | null; phone: string | null; plan_id: string | null;
  status: string; gemini_api_key: string | null; modules: Record<string, boolean> | null;
  agent_count: number; lead_count: number; created_at: string;
}

const emptyForm = { name: "", contactName: "", email: "", phone: "", plan: "atendimento", geminiKey: "", whatsappNumber: "", metaPhoneNumberId: "", agentName: "" };

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [showModules, setShowModules] = useState(true);
  const [setupResult, setSetupResult] = useState<{ message: string; status: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [modules, setModules] = useState<Record<string, boolean>>(DEFAULT_MODULES);

  const f = (key: keyof typeof emptyForm, val: string) => setForm(p => ({ ...p, [key]: val }));
  const toggleModule = (id: string) => setModules(m => ({ ...m, [id]: !m[id] }));

  async function load() {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditClient(null);
    setForm(emptyForm);
    setModules(DEFAULT_MODULES);
    setSetupResult(null);
    setShowWhatsApp(true);
    setShowModules(true);
    setShowModal(true);
  }

  function openEdit(c: Client) {
    setEditClient(c);
    setForm({ ...emptyForm, name: c.company_name, contactName: c.contact_name ?? "", email: c.email ?? "", phone: c.phone ?? "", plan: c.plan_id ?? "atendimento", geminiKey: c.gemini_api_key ?? "" });
    setModules(c.modules ?? DEFAULT_MODULES);
    setSetupResult(null);
    setShowWhatsApp(false);
    setShowModules(true);
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setSetupResult(null);

    if (editClient) {
      await fetch(`/api/admin/clients/${editClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.name,
          contact_name: form.contactName || null,
          email: form.email,
          phone: form.phone,
          plan_id: form.plan,
          gemini_api_key: form.geminiKey || null,
          modules,
        }),
      });
      setSaving(false); setShowModal(false); load();
    } else {
      const res = await fetch("/api/admin/clients/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.name,
          contact_name: form.contactName || null,
          email: form.email,
          phone: form.phone || null,
          plan_id: form.plan,
          gemini_api_key: form.geminiKey || null,
          whatsapp_number: form.whatsappNumber || null,
          meta_phone_number_id: form.metaPhoneNumberId || null,
          agent_name: form.agentName || null,
          modules,
        }),
      });
      const data = await res.json();
      setSaving(false);
      if (!res.ok) {
        setSetupResult({ message: data.error || "Erro ao criar cliente", status: "erro" });
      } else {
        setSetupResult({ message: data.message, status: data.status });
        load();
      }
    }
  }

  const enabledCount = (m: Record<string, boolean> | null) =>
    m ? Object.values(m).filter(Boolean).length : ALL_MODULES.length;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Clientes</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{clients.length} cadastrados</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Novo Cliente</button>
      </div>

      <div style={{ marginBottom: "20px", position: "relative", maxWidth: "320px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
        <input className="input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Empresa", "Plano", "Agentes", "Leads", "Status", "Módulos", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--gray-400)", fontSize: "13px" }}>Nenhum cliente encontrado</td></tr>
            ) : filtered.map(client => (
              <tr key={client.id} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 700 }}>{client.company_name}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "11px" }}>{client.email}</p>
                </td>
                <td style={{ padding: "14px 16px" }}><span className="badge badge-green">{PLAN_MAP[client.plan_id ?? ""] ?? "—"}</span></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px", textAlign: "center" }}>{client.agent_count}</td>
                <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px", textAlign: "center" }}>{client.lead_count}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge ${client.status === "active" ? "badge-green" : client.status === "trial" ? "badge-yellow" : "badge-red"}`}>
                    {client.status === "active" ? "Ativo" : client.status === "trial" ? "Trial" : "Inativo"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: "var(--gray-600)", fontSize: "12px" }}>
                    {enabledCount(client.modules)}/{ALL_MODULES.length} ativos
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn-ghost" style={{ padding: "6px" }} onClick={() => openEdit(client)} title="Editar"><Pencil size={14} /></button>
                    <button className="btn-ghost" style={{ padding: "6px" }} onClick={() => router.push("/admin/agents")} title="Agentes"><Bot size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: "540px", padding: "28px", position: "relative", maxHeight: "92vh", overflowY: "auto" }}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}><X size={18} /></button>
            <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 800, marginBottom: "4px" }}>
              {editClient ? "Editar Cliente" : "Novo Cliente"}
            </h3>
            {!editClient && (
              <p style={{ color: "var(--gray-400)", fontSize: "12px", marginBottom: "20px" }}>
                Preencha os dados e o WhatsApp para configurar tudo automaticamente.
              </p>
            )}

            {setupResult && (
              <div style={{
                padding: "12px 14px", borderRadius: "var(--radius-sm)", marginBottom: "16px",
                background: setupResult.status === "completo" ? "var(--green-50)" : setupResult.status === "erro" ? "rgba(239,68,68,0.06)" : "rgba(234,179,8,0.08)",
                border: `1px solid ${setupResult.status === "completo" ? "rgba(34,197,94,0.25)" : setupResult.status === "erro" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.25)"}`,
                display: "flex", gap: "8px", alignItems: "flex-start",
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px", color: setupResult.status === "completo" ? "var(--green)" : setupResult.status === "erro" ? "var(--danger)" : "#ca8a04" }} />
                <p style={{ fontSize: "12px", color: "var(--gray-700)", lineHeight: 1.5 }}>{setupResult.message}</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Dados da empresa */}
              <div>
                <p style={{ color: "var(--gray-500)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Dados da Empresa</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Nome da Empresa *</label>
                    <input className="input" value={form.name} onChange={e => f("name", e.target.value)} placeholder="Ex: Clínica Sorriso" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Nome do Contato</label>
                      <input className="input" value={form.contactName} onChange={e => f("contactName", e.target.value)} placeholder="Ex: João Silva" />
                    </div>
                    <div>
                      <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Telefone</label>
                      <input className="input" value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Email *</label>
                    <input className="input" type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="contato@empresa.com" disabled={!!editClient} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Plano</label>
                      <select className="input" value={form.plan} onChange={e => f("plan", e.target.value)}>
                        {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} — R$ {p.monthly}/mês</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Gemini API Key</label>
                      <input className="input" value={form.geminiKey} onChange={e => f("geminiKey", e.target.value)} placeholder="AIzaSy..." style={{ fontFamily: "monospace", fontSize: "11px" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulos */}
              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "14px" }}>
                <button
                  onClick={() => setShowModules(s => !s)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showModules ? "12px" : 0 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ToggleRight size={15} style={{ color: "var(--green)" }} />
                    <p style={{ color: "var(--gray-700)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Módulos do Painel</p>
                    <span style={{ background: "var(--green-50)", color: "var(--green)", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>
                      {Object.values(modules).filter(Boolean).length}/{ALL_MODULES.length}
                    </span>
                  </div>
                  {showModules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showModules && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {ALL_MODULES.map(mod => {
                      const enabled = modules[mod.id] ?? false;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => toggleModule(mod.id)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 12px", borderRadius: "8px", cursor: "pointer", border: "none",
                            background: enabled ? "var(--green-50)" : "var(--gray-50)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: enabled ? "var(--gray-900)" : "var(--gray-500)" }}>{mod.label}</span>
                            <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>{mod.desc}</span>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {enabled
                              ? <ToggleRight size={22} style={{ color: "var(--green)" }} />
                              : <ToggleLeft size={22} style={{ color: "var(--gray-300)" }} />
                            }
                     