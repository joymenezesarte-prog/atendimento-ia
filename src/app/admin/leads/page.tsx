"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  { id: "new",             title: "Novo Lead" },
  { id: "quote_sent",      title: "Orçamento Enviado" },
  { id: "waiting_payment", title: "Aguard. Pagamento" },
  { id: "scheduled",       title: "Agendado" },
  { id: "done",            title: "Finalizado" },
];

interface Lead {
  id: string;
  name: string;
  service: string | null;
  score: number;
  stage: string;
  created_at: string;
  last_contact: string;
  agents: { name: string } | null;
  clients: { company_name: string } | null;
}

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/leads").then(res => {
      if (res.status === 401) { router.push("/login"); return res; }
      return res;
    }).then(res => res.json()).then(data => {
      setLeads(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [router]);

  const byStage = (stageId: string) => leads.filter(l => l.stage === stageId);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>CRM de Leads</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{leads.length} leads no funil</p>
      </div>
      <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px" }}>
        {STAGES.map(col => {
          const items = byStage(col.id);
          return (
            <div key={col.id} style={{ minWidth: "260px", flex: "0 0 260px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 700 }}>{col.title}</span>
                <span style={{ background: "var(--green-50)", color: "var(--green)", fontSize: "11px", fontWeight: 700, width: "22px", height: "22px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {items.length === 0 ? (
                  <div style={{ border: "1.5px dashed var(--gray-200)", borderRadius: "var(--radius)", padding: "20px", textAlign: "center" }}>
                    <p style={{ color: "var(--gray-300)", fontSize: "12px" }}>Vazio</p>
                  </div>
                ) : items.map(lead => (
                  <div key={lead.id} className="card" style={{ padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <span style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 700 }}>{lead.name}</span>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: scoreColor(lead.score) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: scoreColor(lead.score) }}>
                        {lead.score}
                      </div>
                    </div>
                    {lead.service && <p style={{ color: "var(--gray-500)", fontSize: "11px", marginBottom: "6px" }}>{lead.service}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--gray-400)", fontSize: "10px" }}>
                        {lead.agents?.name ?? "—"} · {lead.clients?.company_name ?? "—"}
                      </span>
                      <span style={{ color: "var(--gray-300)", fontSize: "10px" }}>{timeAgo(lead.last_contact)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
