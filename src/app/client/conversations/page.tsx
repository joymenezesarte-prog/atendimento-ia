"use client";

import { Search, Clock } from "lucide-react";

const conversations = [
  { lead: "João Silva", lastMsg: "Quero agendar uma limpeza para amanhã", status: "active", score: 8, time: "14:32", agent: "Sofia" },
  { lead: "Fernanda Costa", lastMsg: "Qual o preço do clareamento?", status: "active", score: 6, time: "14:15", agent: "Sofia" },
  { lead: "Pedro Alves", lastMsg: "Vocês aceitam convênio?", status: "active", score: 9, time: "13:50", agent: "Sofia" },
  { lead: "Marcos Lima", lastMsg: "Vou pensar...", status: "closed", score: 3, time: "12:30", agent: "Sofia" },
  { lead: "Ana Souza", lastMsg: "Quero marcar urgente!", status: "active", score: 9, time: "11:00", agent: "Sofia" },
];

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

export default function ClientConversationsPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Conversas</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input className="input" placeholder="Buscar lead..." style={{ paddingLeft: "36px" }} />
        </div>
        <select className="input" style={{ width: "auto" }}>
          <option>Todos</option><option>Ativas</option><option>Fechadas</option>
        </select>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        {conversations.map((conv, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
            borderBottom: i < conversations.length - 1 ? "1px solid var(--gray-50)" : "none",
            cursor: "pointer", transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--gray-50)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="score-dot" style={{ background: scoreColor(conv.score) }}>{conv.score}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{conv.lead}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--gray-400)" }}>
                  <Clock size={11} /><span style={{ fontSize: "11px" }}>{conv.time}</span>
                </div>
              </div>
              <p style={{ color: "var(--gray-500)", fontSize: "12px", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.lastMsg}</p>
            </div>
            <span className={`badge ${conv.status === "active" ? "badge-green" : "badge-gray"}`}>
              {conv.status === "active" ? "Ativa" : "Fechada"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
