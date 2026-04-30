"use client";

import { useState } from "react";
import { Plus, Bot, MessageSquare, AtSign, Globe, Phone } from "lucide-react";

const channels = [
  { id: "whatsapp", label: "WhatsApp", icon: Phone },
  { id: "instagram", label: "Instagram", icon: AtSign },
  { id: "website", label: "Website", icon: Globe },
];

const togglesList = [
  "Resposta automática", "Qualificação de leads", "Enviar catálogo/preços",
  "Agendar compromissos", "Encaminhar p/ humano", "Coletar dados do lead",
  "Enviar links de pagamento", "Follow-up automático", "Recuperar leads inativos",
  "Enviar CTA personalizado", "Identificar urgência", "Integrar formulário",
  "Pós-venda Google Reviews", "Multi-idioma",
];

const initialAgents = [
  { id: "1", name: "Sofia", client: "Clínica Sorriso", channel: "whatsapp", status: true, toggles: 9, personality: "Simpática e profissional. Usa emojis com moderação." },
  { id: "2", name: "Carlos", client: "Loja da Maria", channel: "whatsapp", status: true, toggles: 9, personality: "Vendedor persuasivo. Direto ao ponto." },
];

export default function AgentsPage() {
  const [agents] = useState(initialAgents);
  const [selected, setSelected] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const agent = agents.find(a => a.id === selected);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Agentes IA</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{agents.length} configurados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Novo Agente</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
        {/* Agent List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {agents.map(a => {
            const ChannelIcon = channels.find(c => c.id === a.channel)?.icon || Phone;
            return (
              <div key={a.id} className="card" onClick={() => setSelected(a.id)}
                style={{ padding: "16px", cursor: "pointer", borderLeft: selected === a.id ? "3px solid var(--green)" : "3px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={20} style={{ color: "var(--green)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{a.name}</p>
                    <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{a.client}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <span className="badge badge-green">Ativo</span>
                  <span className="badge badge-gray"><ChannelIcon size={11} style={{ marginRight: "2px" }} /> {channels.find(c => c.id === a.channel)?.label}</span>
                  <span className="badge badge-blue">{a.toggles} funções</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="card" style={{ padding: "24px" }}>
          {!agent ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Bot size={40} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>Selecione um agente</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "var(--gray-900)", fontSize: "18px", fontWeight: 700 }}>{agent.name}</h3>
                <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>{agent.client}</p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Personalidade / System Prompt</label>
                <textarea className="input" rows={3} defaultValue={agent.personality} style={{ resize: "vertical" }} />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>Funcionalidades</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {togglesList.map((t, i) => (
                    <div key={t} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--gray-50)",
                    }}>
                      <span style={{ color: "var(--gray-700)", fontSize: "13px" }}>{t}</span>
                      <div className={`toggle ${i < agent.toggles ? "active" : ""}`} />
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-primary">Salvar alterações</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
