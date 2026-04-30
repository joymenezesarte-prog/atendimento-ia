"use client";

import { Search, Phone } from "lucide-react";

const leads = [
  { name: "João Silva", interest: "Limpeza dental", score: 8, status: "Agendado", phone: "+55 11 99900-1234", date: "Hoje" },
  { name: "Fernanda Costa", interest: "Clareamento", score: 6, status: "Orçamento", phone: "+55 21 98800-2345", date: "Hoje" },
  { name: "Pedro Alves", interest: "Implante", score: 9, status: "Novo", phone: "+55 31 97700-3456", date: "Hoje" },
  { name: "Ana Souza", interest: "Urgência", score: 9, status: "Novo", phone: "+55 11 96600-4567", date: "Hoje" },
  { name: "Marcos Lima", interest: "Consulta", score: 3, status: "Frio", phone: "+55 21 95500-5678", date: "Ontem" },
];

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }
function statusStyle(s: string) {
  const map: Record<string, string> = { Novo: "badge-blue", Orçamento: "badge-yellow", Agendado: "badge-green", Frio: "badge-gray" };
  return map[s] || "badge-gray";
}

export default function ClientLeadsPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Leads</h2>
      <div style={{ position: "relative", maxWidth: "280px", marginBottom: "16px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
        <input className="input" placeholder="Buscar lead..." style={{ paddingLeft: "36px" }} />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Lead", "Interesse", "Score", "Status", "Data"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--gray-50)", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{lead.name}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}><Phone size={10} /> {lead.phone}</p>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px" }}>{lead.interest}</td>
                <td style={{ padding: "14px 16px" }}><div className="score-dot" style={{ background: scoreColor(lead.score) }}>{lead.score}</div></td>
                <td style={{ padding: "14px 16px" }}><span className={`badge ${statusStyle(lead.status)}`}>{lead.status}</span></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "13px" }}>{lead.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
