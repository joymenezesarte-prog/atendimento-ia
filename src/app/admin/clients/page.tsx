"use client";

import { useState } from "react";
import { Search, Plus, Pencil, Bot, Key, X } from "lucide-react";

const plans = [
  { id: "atendimento", name: "Atendimento IA", implantation: 500, monthly: 249 },
  { id: "vendas", name: "Vendas IA", implantation: 700, monthly: 499 },
  { id: "operacao", name: "Operação IA", implantation: 2000, monthly: 889 },
];

const initialClients = [
  { id: "1", name: "Clínica Sorriso", email: "contato@clinicasorriso.com", plan: "vendas", agents: 2, leads: 45, paymentStatus: "paid", geminiKey: "AIza...xxx", createdAt: "15/03/2026" },
  { id: "2", name: "Loja da Maria", email: "maria@lojadamaria.com", plan: "atendimento", agents: 1, leads: 23, paymentStatus: "paid", geminiKey: "AIza...yyy", createdAt: "01/04/2026" },
  { id: "3", name: "Restaurante Sabor", email: "sabor@restaurante.com", plan: "atendimento", agents: 1, leads: 67, paymentStatus: "paid", geminiKey: "AIza...zzz", createdAt: "10/04/2026" },
  { id: "4", name: "Escritório Silva", email: "silva@advocacia.com", plan: "operacao", agents: 3, leads: 31, paymentStatus: "pending", geminiKey: "", createdAt: "20/04/2026" },
];

export default function ClientsPage() {
  const [clients] = useState(initialClients);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", plan: "atendimento", geminiKey: "" });

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const getPlan = (id: string) => plans.find(p => p.id === id);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Clientes</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{clients.length} cadastrados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Novo Cliente</button>
      </div>

      <div style={{ marginBottom: "20px", position: "relative", maxWidth: "320px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
        <input className="input" placeholder="Buscar por nome ou email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: "36px" }} />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Cliente", "Plano", "Agentes", "Leads", "Pagamento", "API Key", "Ações"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(client => {
              const plan = getPlan(client.plan);
              return (
                <tr key={client.id} style={{ borderBottom: "1px solid var(--gray-50)", transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", fontWeight: 700, fontSize: "14px" }}>
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{client.name}</p>
                        <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="badge badge-green">{plan?.name}</span>
                    <p style={{ color: "var(--gray-400)", fontSize: "11px", marginTop: "4px" }}>R$ {plan?.monthly}/mês</p>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{client.agents}</td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{client.leads}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${client.paymentStatus === "paid" ? "badge-green" : "badge-yellow"}`}>
                      {client.paymentStatus === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${client.geminiKey ? "badge-green" : "badge-red"}`}>
                      {client.geminiKey ? "Configurada" : "Faltando"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button className="btn-ghost" style={{ padding: "6px" }}><Pencil size={14} /></button>
                      <button className="btn-ghost" style={{ padding: "6px" }}><Bot size={14} /></button>
                      <button className="btn-ghost" style={{ padding: "6px" }}><Key size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}>
          <div className="card animate-fade-up" style={{ width: "100%", maxWidth: "480px", padding: "28px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "18px", fontWeight: 700 }}>Novo Cliente</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: "4px" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Nome da Empresa</label>
                <input className="input" placeholder="Ex: Clínica Sorriso" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Email</label>
                <input className="input" type="email" placeholder="contato@empresa.com" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Plano</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {plans.map(plan => (
                    <button key={plan.id} onClick={() => setNewClient({ ...newClient, plan: plan.id })}
                      style={{
                        flex: 1, padding: "12px 8px", borderRadius: "var(--radius-sm)", textAlign: "center", fontFamily: "'Inter', sans-serif",
                        cursor: "pointer", transition: "all 0.15s",
                        border: newClient.plan === plan.id ? "2px solid var(--green)" : "1px solid var(--gray-200)",
                        background: newClient.plan === plan.id ? "var(--green-50)" : "var(--white)",
                      }}>
                      <p style={{ color: "var(--gray-900)", fontSize: "12px", fontWeight: 600 }}>{plan.name}</p>
                      <p style={{ color: "var(--green)", fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>R$ {plan.monthly}</p>
                      <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>/mês</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary">Criar Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
