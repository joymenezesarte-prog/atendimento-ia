"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X as XIcon, Shield, Eye, Headphones, BarChart3 } from "lucide-react";

const roles = [
  { id: "admin", label: "Admin", desc: "Acesso completo", icon: Shield, color: "var(--danger)" },
  { id: "gerente", label: "Gerente", desc: "Relatórios + leads + conversas", icon: BarChart3, color: "var(--warning)" },
  { id: "atendente", label: "Atendente", desc: "Conversas do agente", icon: Headphones, color: "var(--info)" },
  { id: "visualizador", label: "Visualizador", desc: "Apenas relatórios", icon: Eye, color: "var(--purple)" },
];

const initialTeam = [
  { id: "1", name: "Dr. João Silva", email: "joao@clinicasorriso.com", role: "admin", lastAccess: "Hoje 14:32" },
  { id: "2", name: "Maria Secretária", email: "maria@clinicasorriso.com", role: "atendente", lastAccess: "Hoje 10:15" },
  { id: "3", name: "Ana Gerente", email: "ana@clinicasorriso.com", role: "gerente", lastAccess: "Ontem 18:00" },
];

export default function TeamPage() {
  const [team, setTeam] = useState(initialTeam);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "atendente" });

  const getRole = (id: string) => roles.find(r => r.id === id);

  const handleCreate = () => {
    if (!newMember.name || !newMember.email) return;
    setTeam([...team, { id: String(Date.now()), ...newMember, lastAccess: "Nunca" }]);
    setShowModal(false);
    setNewMember({ name: "", email: "", role: "atendente" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Equipe</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>Gerencie quem tem acesso ao dashboard</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Adicionar</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {roles.map(role => {
          const Icon = role.icon;
          return (
            <div key={role.id} className="card-flat" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon size={14} style={{ color: role.color }} />
              <div>
                <p style={{ color: "var(--gray-700)", fontSize: "12px", fontWeight: 600 }}>{role.label}</p>
                <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>{role.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
              {["Membro", "Acesso", "Último acesso", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map(member => {
              const role = getRole(member.role);
              const Icon = role?.icon || Shield;
              return (
                <tr key={member.id} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `${role?.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: role?.color, fontWeight: 700, fontSize: "13px" }}>{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{member.name}</p>
                        <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "20px", background: `${role?.color}08`, fontSize: "12px", fontWeight: 500, color: role?.color }}>
                      <Icon size={12} /> {role?.label}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray-400)", fontSize: "13px" }}>{member.lastAccess}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button className="btn-ghost" style={{ padding: "6px" }}><Pencil size={14} /></button>
                      {member.role !== "admin" && <button className="btn-ghost" style={{ padding: "6px", color: "var(--danger)" }}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-up" style={{ width: "100%", maxWidth: "440px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>Adicionar membro</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: "4px" }}><XIcon size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nome</label>
                <input className="input" placeholder="Nome completo" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Email</label>
                <input className="input" placeholder="email@empresa.com" type="email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nível de acesso</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {roles.map(role => {
                    const Icon = role.icon;
                    return (
                      <button key={role.id} onClick={() => setNewMember({ ...newMember, role: role.id })} style={{
                        padding: "10px", borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif",
                        border: newMember.role === role.id ? `1.5px solid ${role.color}` : "1px solid var(--gray-200)",
                        background: newMember.role === role.id ? `${role.color}06` : "var(--white)", display: "flex", alignItems: "center", gap: "8px",
                      }}>
                        <Icon size={14} style={{ color: role.color }} />
                        <div>
                          <p style={{ color: "var(--gray-900)", fontSize: "12px", fontWeight: 600 }}>{role.label}</p>
                          <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>{role.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreate}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
