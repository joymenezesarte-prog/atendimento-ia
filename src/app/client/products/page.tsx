"use client";

import { useEffect, useState } from "react";
import { Plus, X, Save, Trash2, Copy, Check, ExternalLink, Package, CheckCircle, AlertCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  payment_provider: string;
  payment_link: string | null;
  post_payment_action: string;
  post_payment_content: string | null;
  status: string;
}

type Toast = { type: "success" | "error"; msg: string } | null;

const POST_ACTIONS = [
  { value: "message", label: "💬 Mensagem de texto", placeholder: "Ex: Obrigado pela compra! Seu acesso: https://..." },
  { value: "file", label: "📁 Enviar arquivo/link", placeholder: "Ex: https://drive.google.com/... (link do produto digital)" },
  { value: "schedule", label: "📅 Confirmar agendamento", placeholder: "Ex: Sua sessão foi confirmada! Em breve entraremos em contato." },
  { value: "whatsapp_group", label: "💚 Link de grupo WhatsApp", placeholder: "https://chat.whatsapp.com/..." },
  { value: "email", label: "📧 Instruções por mensagem", placeholder: "Você receberá um e-mail com as instruções em até 24h." },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [mpToken, setMpToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", payment_provider: "mercadopago",
    post_payment_action: "message", post_payment_content: "",
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    const [pRes, sRes] = await Promise.all([
      fetch("/api/client/products"),
      fetch("/api/client/settings"),
    ]);
    const [p, s] = await Promise.all([pRes.json(), sRes.json()]);
    setProducts(Array.isArray(p) ? p : []);
    if (s?.mp_access_token) setMpToken(s.mp_access_token);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", price: "", payment_provider: "mercadopago", post_payment_action: "message", post_payment_content: "" });
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      payment_provider: p.payment_provider,
      post_payment_action: p.post_payment_action,
      post_payment_content: p.post_payment_content ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const url = editing ? `/api/client/products/${editing.id}` : "/api/client/products";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (res.ok) {
        showToast("success", editing ? "Produto atualizado!" : "Produto criado! Link gerado automaticamente.");
        setShowModal(false);
        load();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Erro ao salvar");
      }
    } catch {
      showToast("error", "Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    const res = await fetch(`/api/client/products/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("success", "Produto removido"); load(); }
    else showToast("error", "Erro ao remover");
  }

  async function saveToken() {
    setSavingToken(true);
    const res = await fetch("/api/client/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mp_access_token: mpToken }),
    });
    setSavingToken(false);
    if (res.ok) showToast("success", "Token salvo! Novos produtos já gerarão links automaticamente.");
    else showToast("error", "Erro ao salvar token");
  }

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const actionLabel = (val: string) => POST_ACTIONS.find(a => a.value === val)?.label ?? val;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div>
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

      {/* Token MP */}
      <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
          🔑 Mercado Pago — Token de Acesso
        </h3>
        <p style={{ color: "var(--gray-500)", fontSize: "12px", marginBottom: "12px" }}>
          Cole seu Access Token do MP para gerar links de pagamento automaticamente.
          <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer" style={{ color: "var(--green)", marginLeft: "6px" }}>
            Pegar token ↗
          </a>
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            className="input"
            type="password"
            value={mpToken}
            onChange={e => setMpToken(e.target.value)}
            placeholder="APP_USR-..."
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={saveToken} disabled={savingToken || !mpToken}>
            <Save size={14} /> {savingToken ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Meus Produtos</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Lista */}
      {products.length === 0 ? (
        <div className="card" style={{ padding: "50px", textAlign: "center" }}>
          <Package size={36} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: 600 }}>Nenhum produto ainda</p>
          <p style={{ color: "var(--gray-400)", fontSize: "13px", marginTop: "4px" }}>Crie produtos e o agente enviará os links de pagamento automaticamente</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>{p.name}</span>
                    <span style={{ background: "var(--green-50)", color: "var(--green)", fontSize: "13px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>{fmt(p.price)}</span>
                    <span style={{ background: p.status === "active" ? "var(--green-50)" : "var(--gray-100)", color: p.status === "active" ? "var(--green)" : "var(--gray-400)", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px" }}>
                      {p.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {p.description && <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "8px" }}>{p.description}</p>}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--gray-400)", fontSize: "12px" }}>
                      Pós-pagamento: <strong style={{ color: "var(--gray-700)" }}>{actionLabel(p.post_payment_action)}</strong>
                    </span>
                  </div>
                  {p.payment_link && (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        readOnly
                        value={p.payment_link}
                        style={{ flex: 1, fontSize: "11px", padding: "5px 8px", background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "6px", color: "var(--gray-600)", fontFamily: "monospace" }}
                      />
                      <button
                        className="btn-ghost"
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                        onClick={() => copyLink(p.payment_link!, p.id)}
                      >
                        {copied === p.id ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                      </button>
                      <a href={p.payment_link} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: "5px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", color: "inherit" }}>
                        <ExternalLink size={13} /> Abrir
                      </a>
                    </div>
                  )}
                  {!p.payment_link && (
                    <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>
                      ⚠️ Link não gerado — adicione seu token do Mercado Pago acima
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => openEdit(p)}>Editar</button>
                  <button className="btn-ghost" style={{ padding: "6px", color: "var(--danger)" }} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: "520px", padding: "28px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}><X size={18} /></button>
            <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 800, marginBottom: "20px" }}>
              {editing ? "Editar Produto" : "Novo Produto"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Nome do produto *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Plano Básico, Consultoria 1h, Curso X" />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Descrição</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do produto..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Preço (R$) *</label>
                  <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Processador</label>
                  <select className="input" value={form.payment_provider} onChange={e => setForm(f => ({ ...f, payment_provider: e.target.value }))}>
                    <option value="mercadopago">Mercado Pago (+ Pix)</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "14px" }}>
                <label style={{ display: "block", color: "var(--gray-700)", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Ação após pagamento confirmado
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                  {POST_ACTIONS.map(a => (
                    <label key={a.value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "8px 10px", borderRadius: "8px", background: form.post_payment_action === a.value ? "var(--green-50)" : "var(--gray-50)", border: `1px solid ${form.post_payment_action === a.value ? "rgba(34,197,94,0.3)" : "var(--gray-100)"}` }}>
                      <input type="radio" name="action" value={a.value} checked={form.post_payment_action === a.value} onChange={() => setForm(f => ({ ...f, post_payment_action: a.value }))} style={{ accentColor: "var(--green)" }} />
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--gray-800)" }}>{a.label}</span>
                    </label>
                  ))}
                </div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Conteúdo da mensagem pós-pagamento
                </label>
                <textarea
                  className="input"
                  value={form.post_payment_content}
                  onChange={e => setForm(f => ({ ...f, post_payment_content: e.target.value }))}
                  placeholder={POST_ACTIONS.find(a => a.value === form.post_payment_action)?.placeholder}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.price}>
                {saving ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
