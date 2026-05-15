"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Search, Filter } from "lucide-react";

interface Submission {
  id: string;
  source: string;
  data: Record<string, any>;
  created_at: string;
  agents: { name: string } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  webhook: "Site",
  sheets: "Google Sheets",
  forms: "Google Forms",
};

export default function FormsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");

  useEffect(() => {
    fetch("/api/client/forms")
      .then(r => r.json())
      .then(d => { setSubmissions(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = submissions.filter(s => {
    const matchSource = filterSource === "all" || s.source === filterSource;
    const matchSearch = !search || JSON.stringify(s.data).toLowerCase().includes(search.toLowerCase());
    return matchSource && matchSearch;
  });

  function exportCSV() {
    if (!filtered.length) return;
    const allKeys = Array.from(new Set(filtered.flatMap(s => Object.keys(s.data))));
    const header = ["Data", "Fonte", "Agente", ...allKeys].join(",");
    const rows = filtered.map(s => [
      new Date(s.created_at).toLocaleString("pt-BR"),
      SOURCE_LABELS[s.source] || s.source,
      s.agents?.name || "",
      ...allKeys.map(k => `"${(s.data[k] || "").toString().replace(/"/g, '""')}"`)
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "formularios.csv"; a.click();
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="spinner" /></div>;

  const allKeys = Array.from(new Set(filtered.flatMap(s => Object.keys(s.data)))).slice(0, 6);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Formulários</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "4px" }}>
            {submissions.length} respostas recebidas
          </p>
        </div>
        <button className="btn-ghost" onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input
            className="input"
            placeholder="Buscar em todas as respostas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: "32px" }}
          />
        </div>
        <select className="input" style={{ width: "180px" }} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="all">Todas as fontes</option>
          <option value="webhook">Site</option>
          <option value="sheets">Google Sheets</option>
          <option value="forms">Google Forms</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <FileText size={36} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: 600 }}>Nenhuma resposta ainda</p>
          <p style={{ color: "var(--gray-400)", fontSize: "13px", marginTop: "6px" }}>
            Configure o webhook no seu formulário para começar a receber dados.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>Data</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Fonte</th>
                  {allKeys.map(k => (
                    <th key={k} style={{ padding: "10px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {k.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--gray-50)", background: i % 2 === 0 ? "white" : "var(--gray-50)" }}>
                    <td style={{ padding: "10px 16px", color: "var(--gray-500)", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {new Date(s.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: s.source === "sheets" ? "#e8f5e9" : s.source === "forms" ? "#e3f2fd" : "var(--green-50)",
                        color: s.source === "sheets" ? "#2e7d32" : s.source === "forms" ? "#1565c0" : "var(--green)",
                      }}>
                        {SOURCE_LABELS[s.source] || s.source}
                      </span>
                    </td>
                    {allKeys.map(k => (
                      <td key={k} style={{ padding: "10px 16px", color: "var(--gray-800)", fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.data[k] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
