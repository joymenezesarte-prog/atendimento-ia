"use client";

import { Check, CreditCard, ArrowRight, Download } from "lucide-react";

const plans = [
  { id: "atendimento", name: "Atendimento IA", monthly: 249, implantation: 500, features: ["1 Agente IA", "WhatsApp", "Qualificação de leads", "Encaminhar p/ humano", "Relatórios básicos"] },
  { id: "vendas", name: "Vendas IA", monthly: 499, implantation: 700, features: ["3 Agentes IA", "WhatsApp + Instagram", "Todas as funcionalidades", "Agendamento Google", "CRM completo", "Relatórios avançados"], current: true },
  { id: "operacao", name: "Operação IA", monthly: 889, implantation: 2000, features: ["Agentes ilimitados", "WhatsApp + Instagram + Website", "Todas as funcionalidades", "Multi-equipe", "API dedicada", "Suporte prioritário"] },
];

const invoices = [
  { date: "29/04/2026", type: "Mensalidade", amount: "R$ 499", status: "paid", method: "Cartão ****4532" },
  { date: "29/03/2026", type: "Mensalidade", amount: "R$ 499", status: "paid", method: "Cartão ****4532" },
  { date: "01/03/2026", type: "Implantação", amount: "R$ 700", status: "paid", method: "Pix" },
];

export default function ClientBillingPage() {
  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Assinatura</h2>

      <div className="card" style={{ padding: "24px", marginBottom: "24px", borderLeft: "3px solid var(--green)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: "8px" }}>Plano atual</span>
            <h3 style={{ color: "var(--gray-900)", fontSize: "22px", fontWeight: 800 }}>Vendas IA</h3>
            <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "4px" }}>Próxima cobrança: 29/05/2026</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "var(--gray-900)", fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>R$ 499</p>
            <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>/mês</p>
            <span className="badge badge-green" style={{ marginTop: "8px" }}>Ativa</span>
          </div>
        </div>
      </div>

      <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Planos disponíveis</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {plans.map(plan => (
          <div key={plan.id} className="card" style={{ padding: "20px", borderTop: plan.current ? "3px solid var(--green)" : "3px solid transparent" }}>
            <h4 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>{plan.name}</h4>
            <p style={{ color: "var(--gray-900)", fontSize: "26px", fontWeight: 800, marginTop: "4px" }}>
              R$ {plan.monthly}<span style={{ fontSize: "13px", color: "var(--gray-400)", fontWeight: 400 }}>/mês</span>
            </p>
            <p style={{ color: "var(--gray-400)", fontSize: "11px", marginBottom: "14px" }}>Implantação: R$ {plan.implantation}</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "16px" }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 0", color: "var(--gray-600)", fontSize: "13px" }}>
                  <Check size={14} style={{ color: "var(--green)" }} /> {f}
                </li>
              ))}
            </ul>
            <button className={plan.current ? "btn-secondary" : "btn-primary"} style={{ width: "100%", justifyContent: "center", padding: "10px" }}>
              {plan.current ? "Plano atual" : <><span>Upgrade</span> <ArrowRight size={14} /></>}
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Histórico de pagamentos</h3>
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Data", "Tipo", "Valor", "Status", "Método", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "13px" }}>{inv.date}</td>
                <td style={{ padding: "14px 16px", color: "var(--gray-500)", fontSize: "13px" }}>{inv.type}</td>
                <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{inv.amount}</td>
                <td style={{ padding: "14px 16px" }}><span className="badge badge-green">Pago</span></td>
                <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "12px" }}>{inv.method}</td>
                <td style={{ padding: "14px 16px" }}>
                  <button className="btn-ghost" style={{ padding: "4px" }}><Download size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button className="btn-secondary"><CreditCard size={16} /> Atualizar cartão</button>
      </div>
    </div>
  );
}
