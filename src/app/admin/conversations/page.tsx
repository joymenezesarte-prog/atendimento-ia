"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Conversation {
  id: string;
  lead_name: string;
  last_message: string | null;
  channel: string;
  status: string;
  score: number;
  last_message_at: string;
  agents: { name: string } | null;
  clients: { company_name: string } | null;
}

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export default function ConversationsPage() {
  const router = useRouter();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/conversations").then(res => {
      if (res.status === 401) { router.push("/login"); return res; }
      return res;
    }).then(res => res.json()).then(data => {
      setConvs(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [router]);

  const filtered = convs.filter(c => {
    const matchSearch = c.lead_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.agents?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.clients?.company_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "20px" }}>Conversas</h2>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
        <div style={{ position: "relative", maxWidth: "280px", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input className="input" placeholder="Buscar lead, agente ou cliente..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
        </div>
        {["all", "active", "closed", "transferred"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: filter === f ? "var(--green)" : "var(--white)",
              color: filter === f ? "white" : "var(--gray-500)",
              borderColor: filter === f ? "var(--green)" : "var(--gray-200)" }}
          >
            {f === "all" ? "Todas" : f === "active" ? "Ativas" : f === "closed" ? "Fechadas" : "Transferidas"}
          </button>
        ))}
        <span style={{ color: "var(--gray-400)", fontSize: "12px", marginLeft: "auto" }}>{filtered.length} resultados</span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Lead", "Agente", "Cliente", "Canal", "Score", "Status", "Última msg"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--gray-400)", fontSize: "13px" }}>Nenhuma conversa encontrada</td></tr>
            ) : filtered.map(conv => (
              <tr key={conv.id} style={{ borderBottom: "1px solid var(--gray-50)", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 16px" }}>
                  <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{conv.lead_name}</p>
                  {conv.last_message && (
                    <p style={{ color: "var(--gray-400)", fontSize: "11px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.last_message}</p>
                  )}
                </td>
                <td style={{ padding: "14px 16px", color: "var(--gray-600)", fontSize: "13px" }}>{conv.agents?.name ?? "—"}</td>
                <td style={{ padding: "14px 16px", color: "var(--gray-600)", fontSize: "13px" }}>{conv.clients?.company_name ?? "—"}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className="badge badge-green" style={{ textTransform: "capitalize" }}>{conv.channel}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: scoreColor(conv.score) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: scoreColor(conv.score) }}>{conv.score}</div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge ${conv.status === "active" ? "badge-green" : conv.status === "transferred" ? "badge-yellow" : "badge-red"}`}>
                    {conv.status === "active" ? "Ativa" : conv.status === "closed" ? "Fechada" : "Transferida"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "12px" }}>{timeAgo(conv.last_message_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
