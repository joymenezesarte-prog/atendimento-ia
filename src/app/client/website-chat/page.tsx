"use client";

import { useEffect, useState } from "react";
import { Globe, Copy, CheckCircle, Code2, ExternalLink } from "lucide-react";

interface AgentWidget {
  id: string;
  name: string;
  chatwoot_website_token: string;
}

function buildScript(token: string): string {
  const base = process.env.NEXT_PUBLIC_CHATWOOT_URL || "https://chatwoot.atendimentoia.cloud";
  return `<script>
  (function(d,t) {
    var BASE_URL="${base}";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.defer=true; g.async=true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: '${token}',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>`;
}

export default function WebsiteChatPage() {
  const [agents, setAgents] = useState<AgentWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/website-chat")
      .then(r => r.json())
      .then(d => { setAgents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function copy(token: string) {
    navigator.clipboard.writeText(buildScript(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: "720px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Chat no Site</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "4px" }}>
          Cole o script abaixo no seu site para ativar o chat com IA direto na sua página.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <Globe size={36} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: 600 }}>Widget ainda não configurado</p>
          <p style={{ color: "var(--gray-400)", fontSize: "13px", marginTop: "6px" }}>
            Entre em contato com o suporte para ativar o chat no seu site.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Instruções */}
          <div className="card" style={{ padding: "20px", background: "var(--green-50)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <p style={{ color: "var(--gray-800)", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Como instalar:</p>
            <ol style={{ color: "var(--gray-600)", fontSize: "13px", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>Copie o script do seu agente abaixo</li>
              <li>Cole antes do fechamento da tag <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: "4px" }}>&lt;/body&gt;</code> no seu site</li>
              <li>O chat aparecerá automaticamente no canto inferior direito</li>
            </ol>
          </div>

          {/* Agentes com widget */}
          {agents.map(agent => (
            <div key={agent.id} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Globe size={18} style={{ color: "var(--green)" }} />
                </div>
                <div>
                  <p style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{agent.name}</p>
                  <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>Widget ativo</p>
                </div>
                <span className="badge badge-green" style={{ marginLeft: "auto" }}>✓ Configurado</span>
              </div>

              <div style={{ position: "relative" }}>
                <pre style={{
                  background: "var(--gray-900)", color: "#e2e8f0",
                  padding: "16px", borderRadius: "var(--radius-sm)",
                  fontSize: "11px", lineHeight: "1.6", overflow: "auto",
                  margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {buildScript(agent.chatwoot_website_token)}
                </pre>
                <button
                  onClick={() => copy(agent.chatwoot_website_token)}
                  style={{
                    position: "absolute", top: "10px", right: "10px",
                    display: "flex", alignItems: "center", gap: "5px",
                    background: copied === agent.chatwoot_website_token ? "var(--green)" : "rgba(255,255,255,0.1)",
                    color: "white", border: "none", borderRadius: "6px",
                    padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {copied === agent.chatwoot_website_token
                    ? <><CheckCircle size={12} /> Copiado!</>
                    : <><Copy size={12} /> Copiar</>}
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <div style={{ flex: 1, padding: "10px 14px", background: "var(--gray-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-100)" }}>
                  <p style={{ color: "var(--gray-500)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>Token do Widget</p>
                  <p style={{ color: "var(--gray-700)", fontSize: "12px", fontFamily: "monospace", marginTop: "2px" }}>{agent.chatwoot_website_token}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
