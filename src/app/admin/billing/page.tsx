"use client";

import { useEffect, useState } from "react";
import { DollarSign, AlertCircle, Smartphone, ArrowUpRight, Download } from "lucide-react";

interface Invoice {
  client: string;
  email: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
}

interface BillingData {
  mrr: number;
  pendingTotal: number;
  pendingCount: number;
  invoices: Invoice[];
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
        <p style={{ color: "var(--gray-400)" }}>Carregando...</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Receita Mensal (MRR)",
      value: fmt(data?.mrr ?? 0),
      change: `${data?.invoices.filter(i => i.status === "paid").length ?? 0} clientes ativos`,
      icon: DollarSign,
      warning: false,
    },
    {
      label: "Pagamentos Pendentes",
      value: fmt(data?.pendingTotal ?? 0),
      change: `${data?.pendingCount ?? 0} ${data?.pendingCount === 1 ? "fatura" : "faturas"}`,
      icon: AlertCircle,
      warning: (data?.pendingCount ?? 0) > 0,
    },
    {
      label: "Custo por Mensagem",
      value: "R$ 0,00",
      change: "Integracao WhatsApp pendente",
      icon: Smartphone,
      warning: false,
    },
  ];

  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Financeiro</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: "var(--gray-500)", fontSize: "12px", fontWeight: 500 }}>{s.label}</p>
                <div style={{
                  width: "32px", height: "32px",
                  borderRadius: "var(--radius-sm)",
                  background: s.warning ? "rgba(239,68,68,0.06)" : "var(--green-50)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon size={16} style={{ color: s.warning ? "var(--danger)" : "var(--green)" }} />
                </div>
              </div>
              <p style={{ color: "var(--gray-900)", fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>
                {s.value}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                <ArrowUpRight size={12} style={{ color: s.warning ? "var(--danger)" : "var(--green)" }} />
                <span style={{ color: s.warning ? "var(--danger)" : "var(--green)", fontSize: "11px", fontWeight: 600 }}>
                  {s.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
        Clientes com Plano
      </h3>
      <div className="card" style={{ overflow: "hidden" }}>
        {!data?.invoices.length ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--gray-400)" }}>
            Nenhum cliente com plano ativo ainda.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                {["Cliente", "Email", "Plano", "Valor/mes", "Status", "Desde", ""].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "var(--gray-500)",
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                  <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>
                    {inv.client}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-500)", fontSize: "13px" }}>
                    {inv.email}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="badge badge-green">{inv.plan}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>
                    {fmt(inv.amount)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${inv.status === "paid" ? "badge-green" : "badge-yellow"}`}>
                      {inv.status === "paid" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "13px" }}>
                    {inv.date}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button className="btn-ghost" style={{ padding: "4px" }}>
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
