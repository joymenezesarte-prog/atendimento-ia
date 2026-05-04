"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, Plus, X as XIcon, Loader2 } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  service?: string;
  score: number;
  stage: string;
  notes?: string;
  created_at: string;
}

const stageLabels: Record<string, string> = {
  new: "Novo",
  quote_sent: "Orçamento",
  waiting_payment: "Aguard. Pgto",
  scheduled: "Agendado",
  done: "Concluído",
};

const stageBadge: Record<string, string> = {
  new: "badge-blue",
  quote_sent: "badge-yellow",
  waiting_payment: "badge-yellow",
  scheduled: "badge-green",
  done: "badge-gray",
};

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function ClientLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", service: "", score: 5, stage: "new", notes: "" });

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.status === 401) { router.push("/"); return; }
      if (res.ok) setLeads(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleCreate = async () => {
    if (!newLead.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      if (res.ok) {
        const created = await res.json();
        setLeads(prev => [created, ...prev]);
        setShowModal(false);
        setNewLead({ name: "", phone: "", email: "", service: "", score: 5, stage: "new", notes: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search
      || l.name.toLowerCase().includes(search.toLowerCase())
      || l.phone?.includes(search)
      || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Leads</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{leads.length} leads captados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input className="input" placeholder="Buscar lead..." style={{ paddingLeft: "36px" }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: "auto" }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(stageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "64px", textAlign: "center" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>
            {leads.length === 0 ? "Nenhum lead ainda. Seus agentes vão captar em breve!" : "Nenhum lead encontrado com esse filtro."}
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                {["Lead", "Serviço", "Score", "Status", "Data"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: "1px solid var(--gray-50)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--gray-50)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{lead.name}</p>
                    {lead.phone && (
                      <p style={{ color: "var(--gray-400)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <Phone size={10} /> {lead.phone}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-700)", fontSize: "13px" }}>{lead.service || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="score-dot" style={{ background: scoreColor(lead.score) }}>{lead.score}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${stageBadge[lead.stage] || "badge-gray"}`}>{stageLabels[lead.stage] || lead.stage}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "13px" }}>{timeAgo(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}>
          <div className="card animate-fade-up" style={{ width: "100%", maxWidth: "480px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>Novo Lead</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: "4px" }}><XIcon size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nome *</label>
                <input className="input" placeholder="Nome do lead" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Telefone</label>
                  <input className="input" placeholder="+55 11 99999-9999" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Email</label>
                  <input className="input" type="email" placeholder="email@exemplo.com" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Serviço</label>
                  <input className="input" placeholder="Ex: Limpeza dental" value={newLead.service} onChange={e => setNewLead(p => ({ ...p, service: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Score (0–10)</label>
                  <input className="input" type="number" min={0} max={10} value={newLead.score} onChange={e => setNewLead(p => ({ ...p, score: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Status</label>
                <select className="input" value={newLead.stage} onChange={e => setNewLead(p => ({ ...p, stage: e.target.value }))}>
                  {Object.entries(stageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Notas</label>
                <textarea className="input" rows={3} placeholder="Observações..." value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} style={{ resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
