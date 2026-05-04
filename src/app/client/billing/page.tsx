"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, ArrowRight, Download, Loader2 } from "lucide-react";

interface ClientData {
  company_name: string;
  plan_id: string | null;
  status: string;
  email: string;
}

const plans = [
  { id: "atendimento", name: "Atendimento IA", monthly: 249, implantation: 500, features: ["1 Agente IA", "WhatsApp", "Qualificação de leads", "Encaminhar p/ humano", "Relatórios básicos"] },
  { id: "vendas", name: "Vendas IA", monthly: 499, implantation: 700, features: ["3 Agentes IA", "WhatsApp + Instagram", "Todas as funcionalidades", "Agendamento Google", "CRM completo", "Relatórios avançados"] },
  { id: "operacao", name: "Operação IA", monthly: 889, implantation: 2000, features: ["Agentes ilimitados", "WhatsApp + Instagram + Website", "Todas as funcionalidades", "Multi-equipe", "API dedicada", "Suporte prioritário"] },
];

const planValues: Record<string, number> = { atendimento: 249, vendas: 499, operacao: 889 };

export default function ClientBillingPage() {
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch("/api/clients/me");
      if (res.status === 401) { router.push("/"); return; }
      if (res.ok) setClient(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  const handleStripePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planId }) });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === client?.plan_id);
  const currentValue = client?.plan_id ? planValues[client.plan_id] : null;

  // Estimated next billing (30 days from now)
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);
  const nextBillingStr = nextBillingDate.toLocaleDateString("pt-BR");

  return (
    <div>
      <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Assinatura</h2>

      {/* Current plan summary */}
      {currentPlan ? (
        <div className="card" style={{ padding: "24px", marginBottom: "24px", borderLeft: "3px solid var(--green)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: "8px" }}>Plano atual</span>
              <h3 style={{ color: "var(--gray-900)", fontSize: "22px", fontWeight: 800 }}>{currentPlan.name}</h3>
              <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "4px" }}>Próxima cobrança: {nextBillingStr}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "var(--gray-900)", fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>R$ {currentValue}</p>
              <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>/mês</p>
              <span className={`badge ${client?.status === "active" ? "badge-green" : client?.status === "trial" ? "badge-yellow" : "badge-gray"}`} style={{ marginTop: "8px" }}>
                {client?.status === "active" ? "Ativa" : client?.status === "trial" ? "Trial" : "Inativa"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "24px", marginBottom: "24px", borderLeft: "3px solid var(--warning)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Sem plano ativo</span>
              <h3 style={{ color: "var(--gray-900)", fontSize: "18px", fontWeight: 700 }}>Escolha um plano abaixo para começar</h3>
              <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "4px" }}>Acesso a todos os recursos após ativação</p>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Planos disponíveis</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {plans.map(plan => {
          const isCurrent = client?.plan_id === plan.id;
          return (
            <div key={plan.id} className="card" style={{ padding: "20px", borderTop: isCurrent ? "3px solid var(--green)" : "3px solid transparent" }}>
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
              <button
                className={isCurrent ? "btn-secondary" : "btn-primary"}
                style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                onClick={() => !isCurrent && handleUpgrade(plan.id)}
                disabled={isCurrent}
              >
                {isCurrent ? "Plano atual" : <><span>Selecionar</span> <ArrowRight size={14} /></>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment history — Stripe portal */}
      <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Histórico de pagamentos</h3>
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--gray-500)", fontSize: "14px", marginBottom: "16px" }}>
          O histórico de pagamentos e faturas está disponível no portal do cliente Stripe.
        </p>
        <button className="btn-primary" onClick={handleStripePortal} disabled={portalLoading}>
          {portalLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <><Download size={14} /> Ver faturas e histórico</>}
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button className="btn-secondary" onClick={handleStripePortal} disabled={portalLoading}>
          <CreditCard size={16} /> Atualizar cartão
        </button>
      </div>
    </div>
  );
}
