"use client";

import { Users, Bot, MessageSquare, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";

const stats = [
  { label: "Clientes Ativos", value: "12", change: "+2 este mês", icon: Users, trend: "up" },
  { label: "Agentes Rodando", value: "18", change: "3 novos", icon: Bot, trend: "up" },
  { label: "Conversas Hoje", value: "247", change: "+18%", icon: MessageSquare, trend: "up" },
  { label: "Receita Mensal", value: "R$ 4.490", change: "+R$ 749", icon: DollarSign, trend: "up" },
];

const recentConversations = [
  { lead: "João Silva", agent: "Sofia", client: "Clínica Sorriso", score: 8, status: "hot", time: "2 min", lastMsg: "Quero agendar uma limpeza para amanhã" },
  { lead: "Ana Costa", agent: "Carlos", client: "Loja da Maria", score: 5, status: "warm", time: "15 min", lastMsg: "Qual o preço do vestido da vitrine?" },
  { lead: "Pedro Santos", agent: "Julia", client: "Restaurante Sabor", score: 9, status: "hot", time: "23 min", lastMsg: "Quero reservar mesa para 6 pessoas" },
  { lead: "Carla Dias", agent: "Marina", client: "Escritório Silva", score: 3, status: "cold", time: "1h", lastMsg: "Vou pensar e volto depois" },
];

const activeClients = [
  { name: "Clínica Sorriso", plan: "Vendas IA", agents: 2, leads: 45, payment: "ok" },
  { name: "Loja da Maria", plan: "Atendimento IA", agents: 1, leads: 23, payment: "ok" },
  { name: "Restaurante Sabor", plan: "Atendimento IA", agents: 1, leads: 67, payment: "ok" },
  { name: "Escritório Silva", plan: "Operação IA", agents: 3, leads: 31, payment: "pending" },
];

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

export default function AdminDashboard() {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "var(--gray-500)", fontSize: "13px", fontWeight: 500 }}>{stat.label}</p>
                  <p style={{ color: "var(--gray-900)", fontSize: "26px", fontWeight: 800, marginTop: "4px", lineHeight: 1 }}>{stat.value}</p>
                </div>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "var(--radius-sm)",
                  background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} style={{ color: "var(--green)" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px" }}>
                <ArrowUpRight size={14} style={{ color: "var(--green)" }} />
                <span style={{ color: "var(--green)", fontSize: "12px", fontWeight: 600 }}>{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Recent Conversations */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Últimas Conversas</h2>
            <button className="btn-ghost" style={{ fontSize: "12px" }}>Ver todas</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentConversations.map((conv, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px",
                borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="score-dot" style={{ background: scoreColor(conv.score) }}>{conv.score}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{conv.lead}</span>
                    <span style={{ color: "var(--gray-400)", fontSize: "11px" }}>{conv.time}</span>
                  </div>
                  <p style={{ color: "var(--gray-500)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                    {conv.lastMsg}
                  </p>
                  <span style={{ color: "var(--gray-400)", fontSize: "11px" }}>{conv.client} · {conv.agent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Clients */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Clientes Ativos</h2>
            <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>+ Novo</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeClients.map((client, i) => (
              <div key={i} style={{
                padding: "12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 600 }}>{client.name}</span>
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      <span className="badge badge-green">{client.plan}</span>
                      <span className="badge badge-gray">{client.agents} agentes</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "18px", fontWeight: 700 }}>{client.leads}</p>
                    <p style={{ color: "var(--gray-400)", fontSize: "11px" }}>leads</p>
                  </div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <span className={`badge ${client.payment === "ok" ? "badge-green" : "badge-yellow"}`}>
                    {client.payment === "ok" ? "Pago" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
