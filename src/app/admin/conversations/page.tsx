"use client";

import { Clock, Search } from "lucide-react";

const conversations = [
  { lead: "João Silva", agent: "Sofia", client: "Clínica Sorriso", score: 8, msgs: 8, status: "active", time: "2 min", lastMsg: "Quero agendar para amanhã" },
  { lead: "Ana Costa", agent: "Carlos", client: "Loja da Maria", score: 5, msgs: 5, status: "active", time: "15 min", lastMsg: "Qual preço do vestido?" },
  { lead: "Pedro Santos", agent: "Julia", client: "Restaurante Sabor", score: 9, msgs: 12, status: "active", time: "23 min", lastMsg: "Mesa para 6 pessoas" },
  { lead: "Carla Dias", agent: "Marina", client: "Escritório Silva", score: 3, msgs: 3, status: "closed", time: "1h", lastMsg: "Vou pensar e volto" },
  { lead: "Marcos Lima", agent: "Sofia", client: "Clínica Sorriso", score: 7, msgs: 6, status: "active", time: "2h", lastMsg: "Quanto custa a consulta?" },
];

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

export default function ConversationsPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Conversas</h2>
      <div style={{ position: "relative", maxWidth: "280px", marginBottom: "16px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
        <input className="input" placeholder="Buscar conversa..." style={{ paddingLeft: "36px" }} />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Lead", "Agente", "Cliente", "Score", "Msgs", "Status", "Tempo"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conversations.map((conv, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--gray-50)", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{conv.lead}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>{conv.lastMsg}</p>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px" }}>{conv.agent}</td>
                <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px" }}>{conv.client}</td>
                <td style={{ padding: "14px 16px" }}><div className="score-dot" style={{ background: scoreColor(conv.score) }}>{conv.score}</div></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px" }}>{conv.msgs}</td>
                <td style={{ padding: "14px 16px" }}><span className={`badge ${conv.status === "active" ? "badge-green" : "badge-gray"}`}>{conv.status === "active" ? "Ativa" : "Fechada"}</span></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> {conv.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
