"use client";

const columns = [
  { title: "Novo Lead", items: [
    { name: "Pedro Santos", interest: "Reserva mesa 6 pessoas", score: 9, agent: "Julia", client: "Restaurante Sabor", time: "13:50" },
    { name: "Carla Dias", interest: "Consultoria trabalhista", score: 3, agent: "Marina", client: "Escritório Silva", time: "Ontem" },
  ]},
  { title: "Orçamento Enviado", items: [
    { name: "Ana Costa", interest: "Vestido festa", score: 5, agent: "Carlos", client: "Loja da Maria", time: "14:15" },
    { name: "Roberto Alves", interest: "Evento corporativo", score: 8, agent: "Julia", client: "Restaurante Sabor", time: "09:30" },
  ]},
  { title: "Aguardando Pagamento", items: [
    { name: "Lucas Oliveira", interest: "Clareamento", score: 7, agent: "Sofia", client: "Clínica Sorriso", time: "Ontem" },
  ]},
  { title: "Agendado", items: [
    { name: "João Silva", interest: "Limpeza dental", score: 8, agent: "Sofia", client: "Clínica Sorriso", time: "Hoje" },
  ]},
  { title: "Finalizado", items: [
    { name: "Marcos Lima", interest: "Consulta", score: 9, agent: "Sofia", client: "Clínica Sorriso", time: "25/04" },
  ]},
];

function scoreColor(s: number) { return s >= 7 ? "var(--green)" : s >= 4 ? "var(--warning)" : "var(--danger)"; }

export default function LeadsPage() {
  const total = columns.reduce((acc, c) => acc + c.items.length, 0);
  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>CRM de Leads</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{total} leads no funil</p>
      </div>
      <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px" }}>
        {columns.map(col => (
          <div key={col.title} style={{ minWidth: "260px", flex: "0 0 260px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "var(--gray-700)", fontSize: "13px", fontWeight: 700 }}>{col.title}</span>
              <span style={{ background: "var(--green-50)", color: "var(--green)", fontSize: "11px", fontWeight: 700, width: "22px", height: "22px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{col.items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {col.items.map((item, i) => (
                <div key={i} className="card" style={{ padding: "14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{item.name}</span>
                    <div className="score-dot" style={{ background: scoreColor(item.score), width: "24px", height: "24px", fontSize: "10px" }}>{item.score}</div>
                  </div>
                  <p style={{ color: "var(--gray-500)", fontSize: "12px", marginTop: "4px" }}>{item.interest}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                    <span style={{ color: "var(--gray-400)", fontSize: "11px" }}>{item.agent} · {item.client}</span>
                    <span style={{ color: "var(--gray-400)", fontSize: "11px" }}>{item.time}</span>
                  </div>
                  <div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: "var(--gray-100)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.score * 10}%`, borderRadius: "2px", background: scoreColor(item.score), transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
