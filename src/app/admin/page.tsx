"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Bot, MessageSquare, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";

interface Stats {
  totalClients: number;
  totalAgents: number;
  activeAgents: number;
  todayConversations: number;
  mrr: number;
  pendingPayments: number;
}
interface Conversation {
  id: string;
  lead_name: string;
  last_message: string | null;
  score: number;
  status: string;
  last_message_at: string;
  agents: { name: string } | null;
  clients: { company_name: string } | null;
}
interface Client {
  id: string;
  company_name: string;
  plan_id: string | null;
  status: string;
  agent_count: number;
  lead_count: number;
}

const PLAN_LABELS: Record<string, string> = {
  atendimento: "Atendimento IA",
  vendas: "Vendas IA",
  operacao: "Operação IA",
};

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sRes, cRes, clRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/conversations"),
        fetch("/api/admin/clients"),
      ]);
      if (sRes.status === 401 || cRes.status === 401) { router.push("/login"); return; }
      const [s, c, cl] = await Promise.all([sRes.json(), cRes.json(), clRes.json()]);
      setStats(s);
      setConversations(Array.isArray(c) ? c.slice(0, 5) : []);
      setClients(Array.isArray(cl) ? cl.slice(0, 5) : []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="spinner" />
    </div>
  );

  const statCards = [
    { label: "Clientes Ativos", value: stats?.totalClients ?? 0, change: "total", icon: Users },
    { label: "Agentes Ativos", value: stats?.activeAgents ?? 0, change: `${stats?.totalAgents ?? 0} total`, icon: Bot },
    { label: "Conversas Hoje", value: stats?.todayConversations ?? 0, change: "hoje", icon: MessageSquare },
    { label: "Receita Mensal", value: `R$ ${(stats?.mrr ?? 0).toLocaleString("pt-BR")}`, change: "MRR", icon: DollarSign },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "var(--gray-500)", fontSize: "13px", fontWeight: 500 }}>{stat.label}</p>
                  <p style={{ color: "var(--gray-900)", fontSize: "26px", fontWeight: 800, marginTop: "4px", lineHeight: 1 }}>{stat.value}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                    <TrendingUp size={11} style={{ color: "var(--green)" }} />
                    <span style={{ color: "var(--green)", fontSize: "11px", fontWeight: 600 }}>{stat.change}</span>
                  </div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: "var(--green)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Conversas recentes */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>Conversas Recentes</h3>
            <button className="btn-ghost" style={{ fontSize: "12px" }} onClick={() => router.push("/admin/conversations")}>
              Ver todas <ArrowUpRight size={12} />
            </button>
          </div>
          {conversations.length === 0 ? (
            <p style={{ color: "var(--gray-400)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Nenhuma conversa ainda</p>
          ) : conversations.map(conv => (
            <div key={conv.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--gray-50)" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--gray-600)", flexShrink: 0 }}>
                {conv.lead_name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{conv.lead_name}</span>
                  <span style={{ color: "var(--gray-400)", fontSize: "11px" }}>{timeAgo(conv.last_message_at)}</span>
                </div>
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "2px" }}>
                  {conv.agents?.name ?? "—"} · {conv.clients?.company_name ?? "—"}
                </p>
                {conv.last_message && (
                  <p style={{ color: "var(--gray-500)", fontSize: "12px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.last_message}</p>
                )}
              </div>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: scoreColor(conv.score) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: scoreColor(conv.score), flexShrink: 0 }}>
                {conv.score}
              </div>
            </div>
          ))}
        </div>

        {/* Clientes ativos */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700 }}>Clientes Ativos</h3>
            <button className="btn-ghost" style={{ fontSize: "12px" }} onClick={() => router.push("/admin/clients")}>
              Ver todos <ArrowUpRight size={12} />
            </button>
          </div>
          {clients.length === 0 ? (
            <p style={{ color: "var(--gray-400)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Nenhum cliente ainda</p>
          ) : clients.map(client => (
            <div key={client.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--gray-50)" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "var(--green)", flexShrink: 0 }}>
                {client.company_name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{client.company_name}</p>
                <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "2px" }}>
                  {PLAN_LABELS[client.plan_id ?? ""] ?? "Sem plano"} · {client.agent_count} agente{client.agent_count !== 1 ? "s" : ""}
                </p>
              </div>
              <span className={`badge ${client.status === "active" ? "badge-green" : client.status === "trial" ? "badge-yellow" : "badge-red"}`}>
                {client.status === "active" ? "Ativo" : client.status === "trial" ? "Trial" : "Inativo"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
