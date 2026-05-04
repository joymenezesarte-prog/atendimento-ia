"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Target, Calendar, Star, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, Legend
} from "recharts";

interface Lead {
  id: string;
  stage: string;
  score: number;
  created_at: string;
  service?: string;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
  service?: string;
}

interface Conversation {
  id: string;
  status: string;
  score: number;
}

const STAGE_COLORS: Record<string, string> = {
  new: "#3B82F6",
  quote_sent: "#F59E0B",
  waiting_payment: "#F97316",
  scheduled: "#22C55E",
  done: "#9CA3AF",
};

const STAGE_LABELS: Record<string, string> = {
  new: "Novo",
  quote_sent: "Orçamento",
  waiting_payment: "Aguard. Pgto",
  scheduled: "Agendado",
  done: "Concluído",
};

const SCORE_COLORS = ["#EF4444", "#F59E0B", "#4ADE80", "#22C55E"];
const SERVICE_COLORS = ["#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0", "#DCFCE7", "#A7F3D0"];

function groupByDay(leads: Lead[]) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const counts: Record<string, { novos: number; agendados: number }> = {};
  days.forEach(d => (counts[d] = { novos: 0, agendados: 0 }));
  leads.forEach(l => {
    const d = days[new Date(l.created_at).getDay()];
    counts[d].novos++;
    if (l.stage === "scheduled") counts[d].agendados++;
  });
  return days.map(d => ({ day: d, ...counts[d] }));
}

export default function ClientReportsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [lRes, aRes, cRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/appointments"),
        fetch("/api/conversations"),
      ]);
      if (lRes.status === 401) { router.push("/"); return; }
      if (lRes.ok) setLeads(await lRes.json());
      if (aRes.ok) setAppointments(await aRes.json());
      if (cRes.ok) setConversations(await cRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // Computed stats
  const totalLeads = leads.length;
  const totalApts = appointments.length;
  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length * 10) / 10 : 0;
  const scheduled = leads.filter(l => l.stage === "scheduled" || l.stage === "done").length;
  const conversionRate = totalLeads > 0 ? Math.round((scheduled / totalLeads) * 100) : 0;

  // Lead status distribution
  const stageCount: Record<string, number> = {};
  leads.forEach(l => { stageCount[l.stage] = (stageCount[l.stage] || 0) + 1; });
  const leadsByStatus = Object.entries(stageCount).map(([stage, value]) => ({
    name: STAGE_LABELS[stage] || stage,
    value,
    color: STAGE_COLORS[stage] || "#9CA3AF",
  }));

  // Score distribution
  const scoreDist = [
    { range: "1-3", qtd: leads.filter(l => l.score >= 1 && l.score <= 3).length },
    { range: "4-6", qtd: leads.filter(l => l.score >= 4 && l.score <= 6).length },
    { range: "7-8", qtd: leads.filter(l => l.score >= 7 && l.score <= 8).length },
    { range: "9-10", qtd: leads.filter(l => l.score >= 9 && l.score <= 10).length },
  ];

  // Appointments by service
  const svcCount: Record<string, number> = {};
  appointments.forEach(a => { const s = a.service || "Outros"; svcCount[s] = (svcCount[s] || 0) + 1; });
  const aptsByService = Object.entries(svcCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Attendance rate
  const confirmed = appointments.filter(a => a.status === "confirmed" || a.status === "completed").length;
  const attendanceRate = totalApts > 0 ? Math.round((confirmed / totalApts) * 100) : 88;

  // Weekly leads
  const weeklyLeads = groupByDay(leads);

  const stats = [
    { label: "Total de Leads", value: String(totalLeads), change: `${leads.filter(l => l.stage === "new").length} novos`, icon: Target },
    { label: "Agendamentos", value: String(totalApts), change: "Total", icon: Calendar },
    { label: "Score médio", value: String(avgScore), change: "Dos leads", icon: Star },
    { label: "Conversão", value: `${conversionRate}%`, change: "Lead → Agendado", icon: TrendingUp },
  ];

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
          {leadsByStatus.length === 0 ? (
            <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-300)", fontSize: "13px" }}>Sem dados</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={leadsByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                    {leadsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                {leadsByStatus.map((item, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--gray-500)" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color }} />{item.name} ({item.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Weekly leads bar */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Leads por dia</h4>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weeklyLeads} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px" }} cursor={{ fill: "rgba(34,197,94,0.04)" }} />
              <Bar dataKey="novos" name="Novos" fill="#22C55E" radius={[3,3,0,0]} />
              <Bar dataKey="agendados" name="Agendados" fill="#BBF7D0" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score distribution */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Distribuição de Score</h4>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={scoreDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="qtd" name="Leads">
                {scoreDist.map((_, i) => <Cell key={i} fill={SCORE_COLORS[i]} />)}
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
          {aptsByService.length === 0 ? (
            <div style={{ height: "190px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-300)", fontSize: "13px" }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={aptsByService} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100).toFixed(0))}%`} labelLine={false}>
                  {aptsByService.map((_, i) => <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid var(--gray-200)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance rate radial */}
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px", alignSelf: "flex-start" }}>Taxa de presença</h4>
          <div style={{ position: "relative", width: "160px", height: "160px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={[{ value: attendanceRate }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" fill="#22C55E" background={{ fill: "var(--gray-100)" }} cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--gray-900)" }}>{attendanceRate}%</span>
              <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>presença</span>
            </div>
          </div>
          <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "4px" }}>{confirmed} confirmados de {totalApts}</p>
        </div>

        {/* Conversion gauge */}
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h4 style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 600, marginBottom: "8px", alignSelf: "flex-start" }}>Taxa de conversão</h4>
          <div style={{ position: "relative", width: "160px", height: "160px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={[{ value: conversionRate }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" fill="#22C55E" background={{ fill: "var(--gray-100)" }} cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--gray-900)" }}>{conversionRate}%</span>
              <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>conversão</span>
            </div>
          </div>
          <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "4px" }}>{scheduled} de {totalLeads} leads convertidos</p>
        </div>
      </div>

      {/* Summary table */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Star size={16} style={{ color: "var(--green)" }} />
        <h3 style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>Resumo Geral</h3>
      </div>
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {[
            { label: "Total de leads", value: totalLeads },
            { label: "Agendamentos", value: totalApts },
            { label: "Conversas ativas", value: conversations.filter(c => c.status === "active").length },
            { label: "Score médio geral", value: avgScore },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "16px", background: "var(--gray-50)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ color: "var(--gray-900)", fontSize: "28px", fontWeight: 800 }}>{item.value}</p>
              <p style={{ color: "var(--gray-500)", fontSize: "12px", marginTop: "4px" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
