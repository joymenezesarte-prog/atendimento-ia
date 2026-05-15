"use client";

import { useEffect, useState } from "react";
import { AtSign, MessageCircle } from "lucide-react";

interface Conversation {
  id: number;
  contact_name: string;
  last_message: string;
  created_at: string;
  status: string;
}

export default function AtSignChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/instagram-chat")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setConversations(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => { setError("Erro ao carregar conversas"); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Chat AtSign</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "4px" }}>
            Mensagens recebidas via AtSign Direct
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", borderRadius: "8px" }}>
          <AtSign size={14} style={{ color: "white" }} />
          <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>AtSign DM</span>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>{error}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <AtSign size={36} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: 600 }}>Nenhuma conversa ainda</p>
          <p style={{ color: "var(--gray-400)", fontSize: "13px", marginTop: "6px" }}>
            As mensagens do AtSign Direct aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {conversations.map(conv => (
            <div key={conv.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AtSign size={18} style={{ color: "white" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{conv.contact_name}</span>
                  <span style={{
                    padding: "2px 7px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
                    background: conv.status === "open" ? "var(--green-50)" : "var(--gray-100)",
                    color: conv.status === "open" ? "var(--green)" : "var(--gray-500)",
                  }}>{conv.status === "open" ? "Aberta" : "Resolvida"}</span>
                </div>
                <p style={{ color: "var(--gray-500)", fontSize: "12px", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {conv.last_message || "Sem mensagens"}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ color: "var(--gray-400)", fontSize: "11px" }}>
                  {new Date(conv.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
