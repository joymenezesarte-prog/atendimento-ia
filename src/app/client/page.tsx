"use client";

import { Target, Calendar, Star, TrendingUp, ArrowUpRight, Clock } from "lucide-react";

const stats = [
  { label: "Leads este mês", value: "45", change: "+8 esta semana", icon: Target },
  { label: "Agendamentos hoje", value: "4", change: "Próximo: 14:30", icon: Calendar },
  { label: "Score médio", value: "7.2", change: "+0.5 vs mês passado", icon: Star },
  { label: "Taxa de conversão", value: "34%", change: "+5% vs mês passado", icon: TrendingUp },
];

const todayAppointments = [
  { time: "09:00", name: "Maria Santos", service: "Limpeza", status: "confirmed" },
  { time: "10:30", name: "Carlos Oliveira", service: "Clareamento", status: "confirmed" },
  { time: "14:30", name: "Ana Lima", service: "Avaliação", status: "pending" },
  { time: "16:00", name: "Roberto Dias", service: "Implante", status: "confirmed" },
];

const recentLeads = [
  { name: "João Silva", interest: "Limpeza dental", score: 8, time: "2 min", agent: "Sofia" },
  { name: "Fernanda Costa", interest: "Clareamento", score: 6, time: "15 min", agent: "Sofia" },
  { name: "Pedro Alves", interest: "Implante", score: 9, time: "1h", agent: "Sofia" },
];

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

export default function ClientDashboard() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "22px", fontWeight: 800 }}>Bom dia, Dr. João</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "14px", marginTop: "2px" }}>Resumo do seu atendimento hoje</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ color: "var(--gray-500)", fontSize: "12px", fontWeight: 500 }}>{stat.label}</p>
                <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: "var(--green)" }} />
                </div>
              </div>
              <p style={{ color: "var(--gray-900)", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{stat.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                <ArrowUpRight size={12} style={{ color: "var(--green)" }} />
                <span style={{ color: "var(--green)", fontSize: "11px", fontWeight: 600 }}>{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Appointments */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Agendamentos de Hoje</h3>
            <button className="btn-ghost" style={{ fontSize: "12px" }}>Ver calendário</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {todayAppointments.map((apt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--gray-50)" }}>
                <div style={{ minWidth: "48px" }}>
                  <span style={{ color: "var(--green)", fontSize: "14px", fontWeight: 700 }}>{apt.time}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{apt.name}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{apt.service}</p>
                </div>
                <span className={`badge ${apt.status === "confirmed" ? "badge-green" : "badge-yellow"}`}>
                  {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Últimos Leads</h3>
            <button className="btn-ghost" style={{ fontSize: "12px" }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentLeads.map((lead, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px",
                borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="score-dot" style={{ background: scoreColor(lead.score) }}>{lead.score}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{lead.name}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{lead.interest} · {lead.agent}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--gray-400)" }}>
                  <Clock size={12} />
                  <span style={{ fontSize: "12px" }}>{lead.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
