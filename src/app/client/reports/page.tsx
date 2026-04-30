"use client";

import { Target, Calendar, Star, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, Legend
} from "recharts";

/* ===== DATA ===== */
const stats = [
  { label: "Leads este mês", value: "45", change: "+8 esta semana", icon: Target },
  { label: "Agendamentos", value: "34", change: "+12 vs mês passado", icon: Calendar },
  { label: "Score médio", value: "7.2", change: "+0.5", icon: Star },
  { label: "Conversão", value: "34%", change: "+5%", icon: TrendingUp },
];

const leadsByStatus = [
  { name: "Agendado", value: 28, color: "#22C55E" },
  { name: "Orçamento", value: 8, color: "#F59E0B" },
  { name: "Novo", value: 5, color: "#3B82F6" },
  { name: "Frio", value: 4, color: "#9CA3AF" },
];

const weeklyLeads = [
  { day: "Seg", novos: 5, agendados: 3 },
  { day: "Ter", novos: 8, agendados: 5 },
  { day: "Qua", novos: 6, agendados: 4 },
  { day: "Qui", novos: 10, agendados: 7 },
  { day: "Sex", novos: 12, agendados: 8 },
  { day: "Sáb", novos: 4, agendados: 2 },
  { day: "Dom", novos: 2, agendados: 1 },
];

const scoreDistribution = [
  { range: "1-3", qtd: 5 },
  { range: "4-6", qtd: 12 },
  { range: "7-8", qtd: 18 },
  { range: "9-10", qtd: 10 },
];
const SCORE_COLORS = ["#EF4444", "#F59E0B", "#4ADE80", "#22C55E"];

const noShowRate = [{ name: "Presentes", value: 88, fill: "#22C55E" }, { name: "No-show", value: 12, fill: "#E5E7EB" }];

const appointmentsByService = [
  { name: "Limpeza", value: 12 },
  { name: "Clareamento", value: 8 },
  { name: "Avaliação", value: 6 },
  { name: "Implante", value: 4 },
  { name: "Ortodontia", value: 4 },
];
const SERVICE_COLORS = ["#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0", "#DCFCE7"];

const reviewsOverTime = [
  { semana: "Sem 1", pedidas: 4, recebidas: 3 },
  { semana: "Sem 2", pedidas: 5, recebidas: 4 },
  { semana: "Sem 3", pedidas: 6, recebidas: 3 },
  { semana: "Sem 4", pedidas: 3, recebidas: 2 },
];

const conversionRadial = [
  { name: "Conversão", value: 34, fill: "#22C55E" },
];

/* ===== COMPONENT ===== */
export default function ClientReportsPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Relatórios</h2>

      {/* Stats */}
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

      {/* Section: Leads */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Target size={16} style={{ color: "var(--green)" }} />
        <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Qualificação de Leads</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "28px" }}>
        {/* Lead status pie */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Status dos leads</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={leadsByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                {leadsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px", boxShadow: "var(--shadow-md)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
            {leadsByStatus.map((item, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--gray-500)" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color }} />{item.name} ({item.value})
              </span>
            ))}
          </div>
        </div>

        {/* Weekly leads bar */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Leads por dia</h4>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weeklyLeads} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px", boxShadow: "var(--shadow-md)" }} cursor={{ fill: "rgba(34,197,94,0.04)" }} />
              <Bar dataKey="novos" name="Novos" fill="#22C55E" radius={[3, 3, 0, 0]} />
              <Bar dataKey="agendados" name="Agendados" fill="#BBF7D0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score distribution */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Distribuição de Score</h4>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px", boxShadow: "var(--shadow-md)" }} />
              <Bar dataKey="qtd" name="Leads">
                {scoreDistribution.map((_, i) => <Cell key={i} fill={SCORE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section: Agendamentos */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Calendar size={16} style={{ color: "var(--green)" }} />
        <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Agendamentos</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "28px" }}>
        {/* Services pie */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Por serviço</h4>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={appointmentsByService} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {appointmentsByService.map((_, i) => <Cell key={i} fill={SERVICE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px", boxShadow: "var(--shadow-md)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* No-show radial */}
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px", alignSelf: "flex-start" }}>Taxa de presença</h4>
          <div style={{ position: "relative", width: "160px", height: "160px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={[{ value: 88 }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" fill="#22C55E" background={{ fill: "var(--gray-100)" }} cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--gray-900)" }}>88%</span>
              <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>presença</span>
            </div>
          </div>
          <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "4px" }}>12% no-show · 4 faltas este mês</p>
        </div>

        {/* Conversion gauge */}
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px", alignSelf: "flex-start" }}>Taxa de conversão</h4>
          <div style={{ position: "relative", width: "160px", height: "160px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={conversionRadial} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" fill="#22C55E" background={{ fill: "var(--gray-100)" }} cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--gray-900)" }}>34%</span>
              <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>conversão</span>
            </div>
          </div>
          <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "4px" }}>+5% vs mês passado</p>
        </div>
      </div>

      {/* Section: Avaliações Google */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Star size={16} style={{ color: "var(--green)" }} />
        <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Avaliações Google</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px" }}>
        {/* Reviews area chart */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Avaliações por semana</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={reviewsOverTime}>
              <defs>
                <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="semana" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px", boxShadow: "var(--shadow-md)" }} />
              <Area type="monotone" dataKey="pedidas" name="Pedidas" stroke="#22C55E" strokeWidth={2} fill="url(#greenArea)" dot={{ fill: "#22C55E", r: 3, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="recebidas" name="Recebidas" stroke="#4ADE80" strokeWidth={2} fill="transparent" dot={{ fill: "#4ADE80", r: 3, strokeWidth: 0 }} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rating summary */}
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "16px", alignSelf: "flex-start" }}>Nota média</h4>
          <div style={{ position: "relative", width: "140px", height: "140px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" data={[{ value: 96 }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" fill="#22C55E" background={{ fill: "var(--gray-100)" }} cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--gray-900)" }}>4.8</span>
              <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>de 5.0</span>
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--gray-500)" }}>Avaliações pedidas</span>
              <span style={{ color: "var(--gray-900)", fontWeight: 700 }}>18</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--gray-500)" }}>Avaliações recebidas</span>
              <span style={{ color: "var(--gray-900)", fontWeight: 700 }}>12</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--gray-500)" }}>Taxa de resposta</span>
              <span style={{ color: "var(--green)", fontWeight: 700 }}>67%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
