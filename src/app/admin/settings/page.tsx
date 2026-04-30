"use client";

import { Key, Save } from "lucide-react";

const integrations = [
  { name: "Chatwoot", desc: "CRM de conversas", fields: [{ label: "URL", value: "https://chatwoot.seudominio.com" }, { label: "Access Token", value: "T1Lemo***" }] },
  { name: "n8n", desc: "Workflows", fields: [{ label: "URL", value: "https://n8n.seudominio.com" }, { label: "Webhook", value: "https://n8n.../webhook/..." }] },
  { name: "Gemini", desc: "IA", fields: [{ label: "API Key", value: "AIzaSy***" }] },
  { name: "Stripe", desc: "Pagamentos", fields: [{ label: "Secret Key", value: "sk_live_***" }, { label: "Webhook", value: "whsec_***" }] },
];

export default function SettingsPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Configurações</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {integrations.map(int => (
          <div key={int.name} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Key size={14} style={{ color: "var(--green)" }} />
              </div>
              <div>
                <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{int.name}</h3>
                <p style={{ color: "var(--gray-400)", fontSize: "11px" }}>{int.desc}</p>
              </div>
              <span className="badge badge-green" style={{ marginLeft: "auto" }}>Conectado</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {int.fields.map(f => (
                <div key={f.label}>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>{f.label}</label>
                  <input className="input" defaultValue={f.value} style={{ fontFamily: "monospace", fontSize: "13px" }} />
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ marginTop: "12px", padding: "8px 14px", fontSize: "13px" }}><Save size={14} /> Salvar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
