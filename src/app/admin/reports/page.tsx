"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, TrendingUp, MessageSquare, DollarSign, Users } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4"];

interface ReportData {
  kpis: { totalLeads: number; convertedLeads: number; avgScore: number; activeConversations: number; mrr: number; totalClients: number };
  byStage: { name: string; value: number }[];
  leadsByClient: { name: string; value: number }[];
  weeklyLeads: { day: string; leads: number; converted: number }[];
  monthlyRevenue: { month: string; value: number }[];
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports").then(res => {
      if (res.status === 401) { router.push("/login"); return res; }
      return res;
    }).then(res => res.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [router]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
      <div className="spinner" />
    </div>
  );

  if (!data) return null;

  const { kpis, byStage, leadsByClient, weeklyLeads, monthlyRevenue } = data;
  const convRate = kpis.totalLeads > 0 ? ((kpis.convertedLeads / kpis.totalLeads) * 100).toFixed(1) : "0";

  const kpiCards = [
    { label: "Total de Leads", value: kpis.totalLeads, icon: Target, color: "var(--green)" },
    { label: "Leads Convertidos", value: `${convRate}%`, icon: TrendingUp, color: "var(--green)" },
    { label: "Score Médio", value: kpis.avgScore.toFixed(1), icon: Target, color: "var(--warning)" },
    { label: "Conversas Ativas", value: kpis.activeConversations, icon: MessageSquare, color: "var(--info)" },
    { label: "MRR", value: `R$ ${kpis.mrr.toLocaleString("pt-BR")}`, icon: DollarSign, color: "var(--green)" },
    { label: "Clientes Ativos", value: kpis.totalClients, icon: Users, color: "var(--green)" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Relatórios</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>Visão geral de todos os clientes</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {kpiCards.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} style={{ color: k.color }} />
              </div>
              <div>
                <p style={{ color: "var(--gray-500)", fontSize: "12px", fontWeight: 500 }}>{k.label}</p>
                <p style={{ color: "var(--gray-900)", fontSize: "22px", fontWeight: 800, lineHeight: 1.2 }}>{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Leads por estágio — PieChart */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Leads por Estágio</h3>
          {byStage.every(s => s.value === 0) ? (
            <p style={{ color: "var(--gray-400)", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>Nenhum lead ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStage.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {byStage.filter(s => s.value > 0).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leads por cliente — BarChart horizontal */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Leads por Cliente</h3>
          {leadsByClient.length === 0 ? (
            <p style={{ color: "var(--gray-400)", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>Nenhum dado ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadsByClient} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--gray-300)" />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} stroke="var(--gray-300)" />
                <Tooltip />
                <Bar dataKey="value" fill="var(--green)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Leads semanais */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Leads — Últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyLeads}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--gray-300)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--gray-300)" />
              <Tooltip />
              <Bar dataKey="leads" fill="var(--green)" radius={[4, 4, 0, 0]} name="Leads" />
              <Bar dataKey="converted" fill="var(--green-dim)" radius={[4, 4, 0, 0]} name="Convertidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MRR mensal */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>MRR — Últimos 4 meses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--gray-300)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--gray-300)" tickFormatter={(v: unknown) => `R$${((v as number) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [`R$ ${(v as number).toLocaleString("pt-BR")}`, "MRR"]} />
              <Area type="monotone" dataKey="value" stroke="var(--green)" fill="url(#mrrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
