"use client";

import { DollarSign, AlertCircle, Smartphone, ArrowUpRight, Download } from "lucide-react";

const stats = [
  { label: "Receita Mensal (MRR)", value: "R$ 4.490", change: "+R$ 749", icon: DollarSign },
  { label: "Pagamentos Pendentes", value: "R$ 889", change: "1 fatura", icon: AlertCircle, warning: true },
  { label: "Custo WhatsApp", value: "R$ 67", change: "~340 msgs", icon: Smartphone },
];

const invoices = [
  { client: "Clínica Sorriso", plan: "Vendas IA", type: "Mensalidade", amount: "R$ 499", status: "paid", date: "29/04/2026" },
  { client: "Loja da Maria", plan: "Atendimento IA", type: "Mensalidade", amount: "R$ 249", status: "paid", date: "29/04/2026" },
  { client: "Restaurante Sabor", plan: "Atendimento IA", type: "Mensalidade", amount: "R$ 249", status: "paid", date: "28/04/2026" },
  { client: "Escritório Silva", plan: "Operação IA", type: "Mensalidade", amount: "R$ 889", status: "pending", date: "30/04/2026" },
];

export default function BillingPage() {
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
                <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: s.warning ? "rgba(239,68,68,0.06)" : "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: s.warning ? "var(--danger)" : "var(--green)" }} />
                </div>
              </div>
              <p style={{ color: "var(--gray-900)", fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>{s.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                <ArrowUpRight size={12} style={{ color: s.warning ? "var(--danger)" : "var(--green)" }} />
                <span style={{ color: s.warning ? "var(--danger)" : "var(--green)", fontSize: "11px", fontWeight: 600 }}>{s.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Faturas</h3>
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Cliente", "Plano", "Tipo", "Valor", "Status", "Data", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{inv.client}</td>
                <td style={{ padding: "14px 16px" }}><span className="badge badge-green">{inv.plan}</span></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-500)", fontSize: "13px" }}>{inv.type}</td>
                <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{inv.amount}</td>
                <td style={{ padding: "14px 16px" }}><span className={`badge ${inv.status === "paid" ? "badge-green" : "badge-yellow"}`}>{inv.status === "paid" ? "Pago" : "Pendente"}</span></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "13px" }}>{inv.date}</td>
                <td style={{ padding: "14px 16px" }}><button className="btn-ghost" style={{ padding: "4px" }}><Download size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
