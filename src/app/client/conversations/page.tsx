"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, MessageSquare, Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  lead_name: string;
  lead_phone?: string;
  channel: string;
  status: string;
  score: number;
  last_message?: string;
  last_message_at: string;
  summary?: string;
}

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const channelLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  website: "Website",
};

export default function ClientConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.status === 401) { router.push("/"); return; }
      if (res.ok) setConversations(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const filtered = conversations.filter(c => {
    const matchSearch = !search
      || c.lead_name.toLowerCase().includes(search.toLowerCase())
      || c.last_message?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = conversations.filter(c => c.status === "active").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Conversas</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{activeCount} ativas · {conversations.length} total</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input className="input" placeholder="Buscar conversa..." style={{ paddingLeft: "36px" }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: "auto" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="active">Ativas</option>
          <option value="closed">Fechadas</option>
          <option value="transferred">Transferidas</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "64px", textAlign: "center" }}>
          <MessageSquare size={40} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>
            {conversations.length === 0
              ? "Nenhuma conversa ainda. Ative seus agentes para começar!"
              : "Nenhuma conversa encontrada."}
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {filtered.map((conv, i) => (
            <div key={conv.id} style={{
              display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--gray-50)" : "none",
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--gray-50)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div className="score-dot" style={{ background: scoreColor(conv.score), flexShrink: 0 }}>{conv.score}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{conv.lead_name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--gray-400)", flexShrink: 0 }}>
                    <Clock size={11} />
                    <span style={{ fontSize: "11px" }}>{timeAgo(conv.last_message_at)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                  <span style={{ color: "var(--gray-400)", fontSize: "11px", background: "var(--gray-100)", padding: "1px 6px", borderRadius: "3px" }}>
                    {channelLabel[conv.channel] || conv.channel}
                  </span>
                  <p style={{ color: "var(--gray-500)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.last_message || conv.summary || "Sem mensagens"}
                  </p>
                </div>
              </div>
              <span className={`badge ${conv.status === "active" ? "badge-green" : conv.status === "transferred" ? "badge-yellow" : "badge-gray"}`} style={{ flexShrink: 0 }}>
                {conv.status === "active" ? "Ativa" : conv.status === "transferred" ? "Transferida" : "Fechada"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
