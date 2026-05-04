"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X as XIcon, Shield, Eye, Headphones, BarChart3, Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const roles = [
  { id: "admin",     label: "Admin",        desc: "Acesso completo",                  icon: Shield,    color: "var(--danger)"  },
  { id: "manager",   label: "Gerente",       desc: "Relatórios + leads + conversas",   icon: BarChart3, color: "var(--warning)" },
  { id: "attendant", label: "Atendente",     desc: "Conversas do agente",              icon: Headphones,color: "var(--info)"    },
  { id: "viewer",    label: "Visualizador",  desc: "Apenas relatórios",                icon: Eye,       color: "var(--purple)"  },
];

const roleMap: Record<string, typeof roles[0]> = Object.fromEntries(roles.map(r => [r.id, r]));

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "attendant" });

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (res.status === 401) { router.push("/"); return; }
      if (res.ok) setTeam(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleCreate = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        const created = await res.json();
        setTeam(prev => [...prev, created]);
        setShowModal(false);
        setNewMember({ name: "", email: "", role: "attendant" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este membro da equipe?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    setTeam(prev => prev.filter(m => m.id !== id));
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

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : team.length === 0 ? (
        <div className="card" style={{ padding: "64px", textAlign: "center" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>Nenhum membro adicionado ainda.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                {["Membro", "Acesso", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--gray-500)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map(member => {
                const role = roleMap[member.role] || roles[3];
                const Icon = role.icon;
                return (
                  <tr key={member.id} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `${role.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: role.color, fontWeight: 700, fontSize: "13px" }}>{member.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600 }}>{member.name}</p>
                          <p style={{ color: "var(--gray-400)", fontSize: "12px" }}>{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "20px", background: `${role.color}08`, fontSize: "12px", fontWeight: 500, color: role.color }}>
                        <Icon size={12} /> {role.label}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`badge ${member.status === "active" ? "badge-green" : member.status === "pending" ? "badge-yellow" : "badge-gray"}`}>
                        {member.status === "active" ? "Ativo" : member.status === "pending" ? "Pendente" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "2px" }}>
                        <button className="btn-ghost" style={{ padding: "6px" }}><Pencil size={14} /></button>
                        {member.role !== "admin" && (
                          <button className="btn-ghost" style={{ padding: "6px", color: "var(--danger)" }} onClick={() => handleDelete(member.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}>
          <div className="card animate-fade-up" style={{ width: "100%", maxWidth: "440px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>Adicionar membro</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: "4px" }}><XIcon size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nome *</label>
                <input className="input" placeholder="Nome completo" value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Email *</label>
                <input className="input" type="email" placeholder="email@empresa.com" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nível de acesso</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {roles.map(role => {
                    const Icon = role.icon;
                    return (
                      <button key={role.id} onClick={() => setNewMember(p => ({ ...p, role: role.id }))} style={{
                        padding: "10px", borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "left",
                        fontFamily: "'Inter', sans-serif",
                        border: newMember.role === role.id ? `1.5px solid ${role.color}` : "1px solid var(--gray-200)",
                        background: newMember.role === role.id ? `${role.color}06` : "var(--white)",
                        display: "flex", alignItems: "center", gap: "8px",
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
              <button className="btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
