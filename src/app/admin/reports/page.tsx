"use client";

import { Target, TrendingUp, MessageSquare, Zap, ArrowUpRight } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, AreaChart, Area
} from "recharts";

const leadsByClient = [
  { name: "Clínica Sorriso", value: 45 },
  { name: "Loja da Maria", value: 23 },
  { name: "Restaurante Sabor", value: 67 },
  { name: "Escritório Silva", value: 31 },
];

const weeklyLeads = [
  { day: "Seg", leads: 12, converted: 4 },
  { day: "Ter", leads: 18, converted: 7 },
  { day: "Qua", leads: 15, converted: 5 },
  { day: "Qui", leads: 22, converted: 9 },
  { day: "Sex", leads: 28, converted: 11 },
  { day: "Sáb", leads: 10, converted: 3 },
  { day: "Dom", leads: 5, converted: 2 },
];

const monthlyRevenue = [
  { month: "Jan", value: 1800 },
  { month: "Fev", value: 2200 },
  { month: "Mar", value: 2990 },
  { month: "Abr", value: 4490 },
];

const agentPerformance = [
  { name: "Sofia", conversations: 87, converted: 32, score: 8.1 },
  { name: "Carlos", conversations: 52, converted: 18, score: 7.4 },
  { name: "Julia", conversations: 34, converted: 14, score: 8.5 },
  { name: "Marina", conversations: 14, converted: 3, score: 6.2 },
];

const channelDistribution = [
  { name: "WhatsApp", value: 78 },
  { name: "Instagram", value: 15 },
  { name: "Website", value: 7 },
];

const COLORS = ["#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0"];
const CHANNEL_COLORS = ["#22C55E", "#F59E0B", "#3B82F6"];

const stats = [
  { label: "Leads este mês", value: "156", change: "+23%", icon: Target },
  { label: "Taxa de conversão", value: "34%", change: "+5%", icon: TrendingUp },
  { label: "Conversas totais", value: "187", change: "+18%", icon: MessageSquare },
  { label: "Tempo médio", value: "1.2s", change: "-0.3s", icon: Zap },
];

export default function ReportsPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Relatórios</h2>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: "var(--gray-500)", fontSize: "12px", fontWeight: 500 }}>{s.label}</p>
                <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={14} style={{ color: "var(--green)" }} />
                </div>
              </div>
              <p style={{ color: "var(--gray-900)", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{s.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "4px" }}>
                <ArrowUpRight size={12} style={{ color: "var(--green)" }} />
                <span style={{ color: "var(--green)", fontSize: "11px", fontWeight: 600 }}>{s.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 1: Bar chart + Pie chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Weekly Leads Bar Chart */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Leads por dia da semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyLeads} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "13px", boxShadow: "var(--shadow-md)" }}
                cursor={{ fill: "rgba(34,197,94,0.04)" }}
              />
              <Bar dataKey="leads" name="Leads" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name="Convertidos" fill="#BBF7D0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Client Pie */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Leads por cliente</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={leadsByClient} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                {leadsByClient.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "13px", boxShadow: "var(--shadow-md)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {leadsByClient.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--gray-500)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS[i] }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Revenue Area + Channel Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Revenue Area Chart */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Evolução MRR</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `R$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "13px", boxShadow: "var(--shadow-md)" }} formatter={(v: unknown) => [`R$ ${(v as number)?.toLocaleString() ?? 0}`, "MRR"]} />
              <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2.5} fill="url(#greenGrad)" dot={{ fill: "#22C55E", strokeWidth: 0, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Distribution */}
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Distribuição por canal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelDistribution} cx="50%" cy="50%" outerRadius={75} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100).toFixed(0))}%`} labelLine={false}>
                {channelDistribution.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "13px", boxShadow: "var(--shadow-md)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "4px" }}>
            {channelDistribution.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--gray-600)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: CHANNEL_COLORS[i] }} />
                {item.name}: {item.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Agent performance */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Desempenho dos Agentes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={agentPerformance} layout="vertical" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#374151", fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "13px", boxShadow: "var(--shadow-md)" }} />
            <Bar dataKey="conversations" name="Conversas" fill="#22C55E" radius={[0, 4, 4, 0]} barSize={14} />
            <Bar dataKey="converted" name="Convertidos" fill="#BBF7D0" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
