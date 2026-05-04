"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Calendar, Star, TrendingUp, ArrowUpRight, Clock, Loader2 } from "lucide-react";

interface DashboardData {
  totalLeads: number;
  newLeads: number;
  activeConversations: number;
  avgScore: number;
  todayAppointments: number;
  agents: { id: string; name: string; status: string; conversations_count: number }[];
}

interface Lead {
  id: string;
  name: string;
  service?: string;
  score: number;
  created_at: string;
  stage: string;
}

interface Appointment {
  id: string;
  lead_name: string;
  service?: string;
  start_time: string;
  status: string;
  date: string;
}

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("Dashboard");

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, leadsRes, aptsRes, clientRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/leads"),
          fetch("/api/appointments?today=true"),
          fetch("/api/clients/me"),
        ]);
        if (dashRes.status === 401) { router.push("/"); return; }
        if (dashRes.ok) setData(await dashRes.json());
        if (leadsRes.ok) setLeads((await leadsRes.json()).slice(0, 5));
        if (aptsRes.ok) setAppointments(await aptsRes.json());
        if (clientRes.ok) {
          const c = await clientRes.json();
          setClientName(c.company_name || c.contact_name || "Dashboard");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
        <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const stats = [
    { label: "Total de Leads", value: String(data?.totalLeads ?? 0), change: `${data?.newLeads ?? 0} novos`, icon: Target },
    { label: "Agendamentos hoje", value: String(data?.todayAppointments ?? 0), change: "Hoje", icon: Calendar },
    { label: "Score médio", value: String(data?.avgScore ?? 0), change: "Conversas ativas", icon: Star },
    { label: "Conversas ativas", value: String(data?.activeConversations ?? 0), change: "Em andamento", icon: TrendingUp },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "22px", fontWeight: 800 }}>Olá, {clientName} 👋</h2>
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
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Agendamentos de Hoje</h3>
            <button className="btn-ghost" style={{ fontSize: "12px" }} onClick={() => router.push("/client/calendar")}>Ver calendário</button>
          </div>
          {appointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--gray-400)", fontSize: "13px" }}>
              Nenhum agendamento para hoje
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {appointments.map((apt) => (
                <div key={apt.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--gray-50)" }}>
                  <div style={{ minWidth: "48px" }}>
                    <span style={{ color: "var(--green)", fontSize: "14px", fontWeight: 700 }}>{apt.start_time?.slice(0, 5)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{apt.lead_name}</p>
                    <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{apt.service || "—"}</p>
                  </div>
                  <span className={`badge ${apt.status === "confirmed" ? "badge-green" : "badge-yellow"}`}>
                    {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Últimos Leads</h3>
            <button className="btn-ghost" style={{ fontSize: "12px" }} onClick={() => router.push("/client/leads")}>Ver todos</button>
          </div>
          {leads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--gray-400)", fontSize: "13px" }}>
              Nenhum lead ainda. Seus agentes vão captar em breve!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {leads.map((lead) => (
                <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => router.push("/client/leads")}
                >
                  <div className="score-dot" style={{ background: scoreColor(lead.score) }}>{lead.score}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{lead.name}</p>
                    <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{lead.service || lead.stage}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--gray-400)" }}>
                    <Clock size={12} />
                    <span style={{ fontSize: "12px" }}>{timeAgo(lead.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data?.agents && data.agents.length > 0 && (
        <div className="card" style={{ padding: "20px", marginTop: "16px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>Status dos Agentes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {data.agents.map(agent => (
              <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--gray-50)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: agent.status === "active" ? "var(--green)" : "var(--gray-300)" }} />
                <div>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{agent.name}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "11px" }}>{agent.conversations_count} conversas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
