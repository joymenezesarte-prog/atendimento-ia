"use client";

import { useEffect, useState } from "react";
import {
  Plus, X, Save, Trash2, Copy, Check, ExternalLink, Package,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, Webhook, Zap, Info,
} from "lucide-react";

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

const STRIPE_WEBHOOK_URL = "https://app.atendimentoia.cloud/api/webhooks/stripe";
const MP_WEBHOOK_URL = "https://app.atendimentoia.cloud/api/webhooks/mercadopago";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [mpToken, setMpToken] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [savingMP, setSavingMP] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false);
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [showMPGuide, setShowMPGuide] = useState(false);
  const [copiedStripeWebhook, setCopiedStripeWebhook] = useState(false);
  const [copiedMPWebhook, setCopiedMPWebhook] = useState(false);

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
    if (s?.stripe_secret_key) setStripeKey(s.stripe_secret_key);
    if (s?.stripe_webhook_secret) setStripeWebhookSecret(s.stripe_webhook_secret);
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
      name: p.name, description: p.description ?? "", price: String(p.price),
      payment_provider: p.payment_provider, post_payment_action: p.post_payment_action,
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
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (res.ok) {
        showToast("success", editing ? "Produto atualizado!" : "Produto criado! Link gerado automaticamente.");
        setShowModal(false); load();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Erro ao salvar");
      }
    } catch { showToast("error", "Erro de conexão"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    const res = await fetch(`/api/client/products/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("success", "Produto removido"); load(); }
    else showToast("error", "Erro ao remover");
  }

  async function saveSettings(fields: Record<string, string>, setLoad: (v: boolean) => void) {
    setLoad(true);
    const res = await fetch("/api/client/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setLoad(false);
    if (res.ok) showToast("success", "Configuração salva!");
    else showToast("error", "Erro ao salvar");
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true); setTimeout(() => setter(false), 2000);
  }

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const actionLabel = (val: string) => POST_ACTIONS.find(a => a.value === val)?.label ?? val;
  const providerLabel = (p: string) => p === "stripe" ? "Stripe" : "Mercado Pago";
  const providerColor = (p: string) => p === "stripe" ? "#635bff" : "var(--green)";

  const stripeConfigured = !!stripeKey && !!stripeWebhookSecret;
  const mpConfigured = !!mpToken;

  const StepNumber = ({ n, done }: { n: number; done?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        width: "30px", height: "30px", borderRadius: "50%",
        background: done ? "var(--green)" : "#635bff",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 800, flexShrink: 0,
      }}>
        {done ? <CheckCircle size={15} /> : n}
      </div>
      <div style={{ width: "2px", flex: 1, background: "var(--gray-200)", margin: "4px 0" }} />
    </div>
  );

  const MPStepNumber = ({ n, done }: { n: number; done?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        width: "30px", height: "30px", borderRadius: "50%",
        background: done ? "var(--green)" : "#009ee3",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 800, flexShrink: 0,
      }}>
        {done ? <CheckCircle size={15} /> : n}
      </div>
      <div style={{ width: "2px", flex: 1, background: "var(--gray-200)", margin: "4px 0" }} />
    </div>
  );

  const CopyUrlBox = ({ url, copied: isCopied, onCopy }: { url: string; copied: boolean; onCopy: () => void }) => (
    <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "8px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <Webhook size={14} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
      <code style={{ flex: 1, fontSize: "12px", color: "var(--gray-700)", wordBreak: "break-all" }}>{url}</code>
      <button
        onClick={onCopy}
        style={{
          background: isCopied ? "var(--green)" : "#009ee3",
          color: "white", border: "none", borderRadius: "6px",
          padding: "5px 10px", fontSize: "12px", fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
          flexShrink: 0, transition: "background 0.2s",
        }}
      >
        {isCopied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar URL</>}
      </button>
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
      <div className="spinner" />
    </div>
  );

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

      {/* Cards de status */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Mercado Pago */}
        <div
          className="card"
          style={{ flex: 1, minWidth: "200px", padding: "14px 16px", cursor: "pointer", border: showMPGuide ? "2px solid #009ee3" : "2px solid transparent" }}
          onClick={() => { setShowMPGuide(s => !s); setShowStripeGuide(false); }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🟢</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)" }}>Mercado Pago</span>
                {mpConfigured
                  ? <span style={{ background: "var(--green-50)", color: "var(--green)", fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>✓ Configurado</span>
                  : <span style={{ background: "var(--gray-100)", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px" }}>Ver como configurar</span>
                }
              </div>
              <p style={{ color: "var(--gray-500)", fontSize: "11px", marginTop: "2px" }}>Pix, cartão, boleto</p>
            </div>
            {showMPGuide ? <ChevronUp size={14} style={{ color: "var(--gray-400)" }} /> : <ChevronDown size={14} style={{ color: "var(--gray-400)" }} />}
          </div>
        </div>

        {/* Stripe */}
        <div
          className="card"
          style={{ flex: 1, minWidth: "200px", padding: "14px 16px", cursor: "pointer", border: showStripeGuide ? "2px solid #635bff" : "2px solid transparent" }}
          onClick={() => { setShowStripeGuide(s => !s); setShowMPGuide(false); }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>💜</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)" }}>Stripe</span>
                {stripeConfigured
                  ? <span style={{ background: "rgba(99,91,255,0.1)", color: "#635bff", fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>✓ Configurado</span>
                  : <span style={{ background: "var(--gray-100)", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px" }}>Ver como configurar</span>
                }
              </div>
              <p style={{ color: "var(--gray-500)", fontSize: "11px", marginTop: "2px" }}>Cartão internacional</p>
            </div>
            {showStripeGuide ? <ChevronUp size={14} style={{ color: "var(--gray-400)" }} /> : <ChevronDown size={14} style={{ color: "var(--gray-400)" }} />}
          </div>
        </div>
      </div>

      {/* Guia Mercado Pago */}
      {showMPGuide && (
        <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--gray-900)", marginBottom: "6px" }}>
            🟢 Como configurar o Mercado Pago
          </h3>

          <div style={{ background: "rgba(0,158,227,0.06)", border: "1px solid rgba(0,158,227,0.25)", borderRadius: "10px", padding: "12px 14px", marginBottom: "22px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <Zap size={15} style={{ color: "#009ee3", marginTop: "1px", flexShrink: 0 }} />
            <p style={{ color: "#007ab8", fontSize: "13px", fontWeight: 500, margin: 0 }}>
              <strong>Você não precisa criar nada manualmente no Mercado Pago.</strong> Ao cadastrar um produto aqui, o link de pagamento é gerado automaticamente com o valor correto.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <MPStepNumber n={1} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Crie uma conta no Mercado Pago</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
                  Acesse{" "}
                  <a href="https://www.mercadopago.com.br" target="_blank" rel="noreferrer" style={{ color: "#009ee3", fontWeight: 600 }}>mercadopago.com.br ↗</a>
                  {" "}e crie sua conta gratuitamente. Se já tiver, pule este passo.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <MPStepNumber n={2} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Crie uma aplicação no painel de desenvolvedores</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
                  Acesse{" "}
                  <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer" style={{ color: "#009ee3", fontWeight: 600 }}>Mercado Pago Developers ↗</a>
                  {" "}→ clique em <strong>Criar aplicação</strong> → dê um nome (ex: "Minha Loja") → marque a opção <strong>CheckoutPro</strong> → salve.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <MPStepNumber n={3} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Copie o Access Token de produção</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "10px" }}>
                  Dentro da aplicação criada → aba <strong>Credenciais de produção</strong> → copie o <strong>Access Token</strong> (começa com <code style={{ background: "var(--gray-100)", padding: "1px 5px", borderRadius: "4px", fontSize: "12px" }}>APP_USR-</code>).
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="input" type="password" value={mpToken}
                    onChange={e => setMpToken(e.target.value)}
                    placeholder="APP_USR-..." style={{ flex: 1 }}
                  />
                  <button
                    className="btn-primary"
                    style={{ background: "#009ee3" }}
                    onClick={() => saveSettings({ mp_access_token: mpToken }, setSavingMP)}
                    disabled={savingMP || !mpToken}
                  >
                    <Save size={14} /> {savingMP ? "Salvando..." : "Salvar"}
                  </button>
                </div>
                {mpToken && (
                  <p style={{ color: "var(--green)", fontSize: "11px", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle size={11} /> Token preenchido — clique em Salvar
                  </p>
                )}
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <MPStepNumber n={4} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Configure as notificações (webhook)</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "10px" }}>
                  Ainda na sua aplicação → aba <strong>Notificações Webhooks</strong> → cole a URL abaixo no campo <strong>URL de produção</strong> → marque o tópico <strong>Pagamentos</strong> → salve.
                </p>
                <CopyUrlBox
                  url={MP_WEBHOOK_URL}
                  copied={copiedMPWebhook}
                  onCopy={() => copyText(MP_WEBHOOK_URL, setCopiedMPWebhook)}
                />
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 12px", display: "flex", gap: "7px", alignItems: "flex-start" }}>
                  <Info size={13} style={{ color: "#d97706", marginTop: "1px", flexShrink: 0 }} />
                  <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
                    Esse passo é essencial para o sistema enviar a mensagem automática ao comprador após o pagamento ser aprovado.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 — Done */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: mpConfigured ? "var(--green)" : "var(--gray-300)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 800, flexShrink: 0,
                }}>
                  {mpConfigured ? <CheckCircle size={15} /> : "5"}
                </div>
              </div>
              <div style={{ paddingBottom: "4px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: mpConfigured ? "var(--green)" : "var(--gray-400)", marginBottom: "4px" }}>
                  {mpConfigured ? "✓ Mercado Pago configurado! Cadastre seus produtos abaixo." : "Pronto! Cadastre seus produtos"}
                </p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
                  Ao criar um produto aqui, o link de pagamento é gerado automaticamente. Nenhuma ação extra no Mercado Pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guia Stripe */}
      {showStripeGuide && (
        <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--gray-900)", marginBottom: "6px" }}>
            💜 Como configurar o Stripe
          </h3>

          <div style={{ background: "rgba(99,91,255,0.06)", border: "1px solid rgba(99,91,255,0.2)", borderRadius: "10px", padding: "12px 14px", marginBottom: "22px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <Zap size={15} style={{ color: "#635bff", marginTop: "1px", flexShrink: 0 }} />
            <p style={{ color: "#635bff", fontSize: "13px", fontWeight: 500, margin: 0 }}>
              <strong>Você não precisa criar nada manualmente no Stripe.</strong> Ao cadastrar um produto aqui, o link de pagamento é gerado automaticamente com o valor correto.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <StepNumber n={1} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Crie uma conta no Stripe</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
                  Acesse{" "}
                  <a href="https://dashboard.stripe.com/register" target="_blank" rel="noreferrer" style={{ color: "#635bff", fontWeight: 600 }}>stripe.com ↗</a>
                  {" "}e crie sua conta. Se já tiver, pule este passo.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <StepNumber n={2} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Copie sua Chave Secreta</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "10px" }}>
                  No Stripe Dashboard →{" "}
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" style={{ color: "#635bff", fontWeight: 600 }}>Developers → API Keys ↗</a>
                  {" "}→ copie a <strong>Secret key</strong> (começa com <code style={{ background: "var(--gray-100)", padding: "1px 5px", borderRadius: "4px", fontSize: "12px" }}>sk_live_</code>).
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="input" type="password" value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder="sk_live_..." style={{ flex: 1 }} />
                  <button
                    className="btn-primary" style={{ background: "#635bff" }}
                    onClick={() => saveSettings({ stripe_secret_key: stripeKey }, setSavingStripe)}
                    disabled={savingStripe || !stripeKey}
                  >
                    <Save size={14} /> Salvar
                  </button>
                </div>
                {stripeKey && (
                  <p style={{ color: "var(--green)", fontSize: "11px", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle size={11} /> Chave preenchida — clique em Salvar
                  </p>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", gap: "16px" }}>
              <StepNumber n={3} />
              <div style={{ paddingBottom: "20px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--gray-900)", marginBottom: "4px" }}>Configure o Webhook</p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "10px" }}>
                  No Stripe Dashboard →{" "}
                  <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" style={{ color: "#635bff", fontWeight: 600 }}>Developers → Webhooks ↗</a>
                  {" "}→ <strong>Adicionar endpoint</strong> → cole a URL abaixo → selecione o evento{" "}
                  <code style={{ background: "var(--gray-100)", padding: "1px 5px", borderRadius: "4px", fontSize: "12px" }}>checkout.session.completed</code>
                  {" "}→ salve e copie o <strong>Segredo da assinatura</strong> (começa com <code style={{ background: "var(--gray-100)", padding: "1px 5px", borderRadius: "4px", fontSize: "12px" }}>whsec_</code>).
                </p>
                <CopyUrlBox
                  url={STRIPE_WEBHOOK_URL}
                  copied={copiedStripeWebhook}
                  onCopy={() => copyText(STRIPE_WEBHOOK_URL, setCopiedStripeWebhook)}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="input" type="password" value={stripeWebhookSecret} onChange={e => setStripeWebhookSecret(e.target.value)} placeholder="whsec_..." style={{ flex: 1 }} />
                  <button
                    className="btn-primary" style={{ background: "#635bff" }}
                    onClick={() => saveSettings({ stripe_webhook_secret: stripeWebhookSecret }, setSavingStripe)}
                    disabled={savingStripe || !stripeWebhookSecret}
                  >
                    <Save size={14} /> Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4 — Done */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: stripeConfigured ? "var(--green)" : "var(--gray-300)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 800, flexShrink: 0,
                }}>
                  {stripeConfigured ? <CheckCircle size={15} /> : "4"}
                </div>
              </div>
              <div style={{ paddingBottom: "4px", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: stripeConfigured ? "var(--green)" : "var(--gray-400)", marginBottom: "4px" }}>
                  {stripeConfigured ? "✓ Stripe configurado! Cadastre seus produtos abaixo." : "Pronto! Cadastre seus produtos"}
                </p>
                <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
                  Ao criar um produto aqui, o link de pagamento Stripe é gerado automaticamente. Nenhuma ação extra necessária no Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header lista */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Meus Produtos</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Novo Produto</button>
      </div>

      {/* Lista */}
      {products.length === 0 ? (
        <div className="card" style={{ padding: "50px", textAlign: "center" }}>
          <Package size={36} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: 600 }}>Nenhum produto ainda</p>
          <p style={{ color: "var(--gray-400)", fontSize: "13px", marginTop: "4px" }}>
            Crie produtos e o agente enviará os links de pagamento automaticamente
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>{p.name}</span>
                    <span style={{ background: "var(--green-50)", color: "var(--green)", fontSize: "13px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>{fmt(p.price)}</span>
                    <span style={{ background: p.payment_provider === "stripe" ? "rgba(99,91,255,0.08)" : "rgba(0,158,227,0.08)", color: providerColor(p.payment_provider), fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px" }}>
                      {providerLabel(p.payment_provider)}
                    </span>
                    <span style={{ background: p.status === "active" ? "var(--green-50)" : "var(--gray-100)", color: p.status === "active" ? "var(--green)" : "var(--gray-400)", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px" }}>
                      {p.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {p.description && <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "8px" }}>{p.description}</p>}
                  <span style={{ color: "var(--gray-400)", fontSize: "12px" }}>
                    Pós-pagamento: <strong style={{ color: "var(--gray-700)" }}>{actionLabel(p.post_payment_action)}</strong>
                  </span>
                  {p.payment_link ? (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input readOnly value={p.payment_link} style={{ flex: 1, fontSize: "11px", padding: "5px 8px", background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "6px", color: "var(--gray-600)", fontFamily: "monospace" }} />
                      <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: "12px" }} onClick={() => copyLink(p.payment_link!, p.id)}>
                        {copied === p.id ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                      </button>
                      <a href={p.payment_link} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: "5px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", color: "inherit" }}>
                        <ExternalLink size={13} /> Abrir
                      </a>
                    </div>
                  ) : (
                    <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>
                      ⚠️ Link não gerado — configure o meio de pagamento acima
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
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}>
              <X size={18} />
            </button>
            <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 800, marginBottom: "20px" }}>
              {editing ? "Editar Produto" : "Novo Produto"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Nome do produto *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Consulta online, Ebook, Curso..." />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Descrição</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do produto" />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Preço (R$) *</label>
                <input className="input" type="number" step="0.01" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>Meio de pagamento</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { value: "mercadopago", label: "🟢 Mercado Pago", configured: mpConfigured, color: "#009ee3" },
                    { value: "stripe", label: "💜 Stripe", configured: stripeConfigured, color: "#635bff" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, payment_provider: opt.value }))}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "8px",
                        border: `2px solid ${form.payment_provider === opt.value ? opt.color : "var(--gray-200)"}`,
                        background: form.payment_provider === opt.value ? `${opt.color}10` : "white",
                        cursor: "pointer", fontSize: "13px", fontWeight: 600,
                        color: form.payment_provider === opt.value ? opt.color : "var(--gray-600)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                      }}
                    >
                      {opt.label}
                      <span style={{ fontSize: "10px", fontWeight: 400, color: opt.configured ? "var(--green)" : "var(--gray-400)" }}>
                        {opt.configured ? "✓ Configurado" : "Não configurado"}
                      </span>
                    </button>
                  ))}
                </div>
                {((form.payment_provider === "mercadopago" && !mpConfigured) || (form.payment_provider === "stripe" && !stripeConfigured)) && (
                  <div style={{ marginTop: "8px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 12px", display: "flex", gap: "7px", alignItems: "flex-start" }}>
                    <Info size={13} style={{ color: "#d97706", marginTop: "1px", flexShrink: 0 }} />
                    <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
                      Configure o {form.payment_provider === "stripe" ? "Stripe" : "Mercado Pago"} antes de criar produtos com este meio de pagamento.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>O que fazer após o pagamento?</label>
                <select className="input" value={form.post_payment_action} onChange={e => setForm(f => ({ ...f, post_payment_action: e.target.value }))}>
                  {POST_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 600, marginBottom: "5px" }}>
                  {POST_ACTIONS.find(a => a.value === form.post_payment_action)?.label ?? "Conteúdo"}
                </label>
                <textarea
                  className="input" rows={3}
                  value={form.post_payment_content}
                  onChange={e => setForm(f => ({ ...f, post_payment_content: e.target.value }))}
                  placeholder={POST_ACTIONS.find(a => a.value === form.post_payment_action)?.placeholder ?? ""}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving || !form.name || !form.price}>
                  {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar produto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
