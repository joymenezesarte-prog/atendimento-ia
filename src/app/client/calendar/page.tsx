"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Phone, FileText, RefreshCw, X as XIcon, Send, Calendar, Plus, Loader2 } from "lucide-react";

interface Appointment {
  id: string;
  lead_name: string;
  lead_phone?: string;
  service?: string;
  date: string;
  start_time: string;
  end_time?: string;
  status: string;
  notes?: string;
}

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const daysOfWeek = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [action, setAction] = useState<"reschedule" | "cancel" | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [newApt, setNewApt] = useState({
    lead_name: "", lead_phone: "", service: "",
    date: today.toISOString().split("T")[0],
    start_time: "09:00", end_time: "10:00", notes: "", status: "pending"
  });

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.status === 401) { router.push("/"); return; }
      if (res.ok) setAppointments(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const todayApts = appointments
    .filter(a => a.date === selectedDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const hasApt = (day: number) =>
    appointments.some(a => a.date === `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
  const isToday = (day: number) =>
    today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;

  const handleCancel = async () => {
    if (!selectedApt) return;
    setSaving(true);
    try {
      await fetch(`/api/appointments/${selectedApt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setAppointments(prev => prev.map(a => a.id === selectedApt.id ? { ...a, status: "cancelled" } : a));
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newApt.lead_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApt),
      });
      if (res.ok) {
        const created = await res.json();
        setAppointments(prev => [...prev, created]);
        setShowModal(false);
        setSelectedDate(newApt.date);
      }
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const openNew = () => {
    setAction("new");
    setNewApt(p => ({ ...p, date: selectedDate }));
    setShowModal(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Calendário de Agendamentos</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>{appointments.length} agendamentos no total</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
          <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={prevMonth}><ChevronLeft size={16} /></button>
              <span style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{months[currentMonth]} {currentYear}</span>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={nextMonth}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
              {daysOfWeek.map(d => (
                <div key={d} style={{ textAlign: "center", color: "var(--gray-400)", fontSize: "11px", fontWeight: 600, padding: "4px" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const sel = dateStr === selectedDate;
                const has = hasApt(day);
                const tod = isToday(day);
                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)} style={{
                    width: "38px", height: "38px", borderRadius: "var(--radius-sm)",
                    border: tod && !sel ? "1.5px solid var(--green)" : "none",
                    background: sel ? "var(--green)" : "transparent",
                    color: sel ? "white" : "var(--gray-700)",
                    fontWeight: sel || tod ? 700 : 400,
                    fontSize: "13px", cursor: "pointer", position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--gray-50)"; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                  >
                    {day}
                    {has && !sel && (
                      <span style={{ position: "absolute", bottom: "3px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--green)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              {" · "}{todayApts.length} agendamento{todayApts.length !== 1 ? "s" : ""}
            </h3>
            {todayApts.length === 0 ? (
              <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                <Calendar size={40} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
                <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>Nenhum agendamento neste dia</p>
                <button className="btn-primary" style={{ marginTop: "16px" }} onClick={openNew}>
                  <Plus size={14} /> Agendar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {todayApts.map(apt => (
                  <div key={apt.id} className="card" style={{ padding: "16px", opacity: apt.status === "cancelled" ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <div style={{
                          minWidth: "52px", textAlign: "center", padding: "8px 10px", borderRadius: "var(--radius-sm)",
                          background: apt.status === "confirmed" ? "var(--green-50)" : apt.status === "cancelled" ? "var(--gray-100)" : "rgba(245,158,11,0.06)"
                        }}>
                          <p style={{ color: apt.status === "confirmed" ? "var(--green)" : apt.status === "cancelled" ? "var(--gray-400)" : "var(--warning)", fontSize: "15px", fontWeight: 700 }}>
                            {apt.start_time?.slice(0, 5)}
                          </p>
                          {apt.end_time && <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>{apt.end_time?.slice(0, 5)}</p>}
                        </div>
                        <div>
                          <p style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 600 }}>{apt.lead_name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", color: "var(--gray-400)", fontSize: "12px" }}>
                            {apt.service && <span>{apt.service}</span>}
                            {apt.lead_phone && <><span>·</span><Phone size={11} /><span>{apt.lead_phone}</span></>}
                          </div>
                          {apt.notes && (
                            <p style={{ color: "var(--gray-400)", fontSize: "12px", marginTop: "4px", fontStyle: "italic", display: "flex", alignItems: "center", gap: "4px" }}>
                              <FileText size={11} /> {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className={`badge ${apt.status === "confirmed" ? "badge-green" : apt.status === "cancelled" ? "badge-gray" : "badge-yellow"}`}>
                          {apt.status === "confirmed" ? "Confirmado" : apt.status === "cancelled" ? "Cancelado" : "Pendente"}
                        </span>
                        {apt.status !== "cancelled" && (
                          <>
                            <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => { setSelectedApt(apt); setAction("reschedule"); setShowModal(true); }}>
                              <RefreshCw size={14} />
                            </button>
                            <button className="btn-ghost" style={{ padding: "4px", color: "var(--danger)" }} onClick={() => { setSelectedApt(apt); setAction("cancel"); setShowModal(true); }}>
                              <XIcon size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}>
          <div className="card animate-fade-up" style={{ width: "100%", maxWidth: "480px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>
                {action === "new" ? "Novo Agendamento" : action === "cancel" ? "Cancelar Agendamento" : "Reagendar"}
              </h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: "4px" }}><XIcon size={16} /></button>
            </div>

            {action === "new" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nome do paciente *</label>
                  <input className="input" placeholder="Nome completo" value={newApt.lead_name} onChange={e => setNewApt(p => ({ ...p, lead_name: e.target.value }))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Telefone</label>
                    <input className="input" placeholder="+55 11 99999-9999" value={newApt.lead_phone} onChange={e => setNewApt(p => ({ ...p, lead_phone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Serviço</label>
                    <input className="input" placeholder="Ex: Limpeza" value={newApt.service} onChange={e => setNewApt(p => ({ ...p, service: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Data</label>
                    <input className="input" type="date" value={newApt.date} onChange={e => setNewApt(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Início</label>
                    <input className="input" type="time" value={newApt.start_time} onChange={e => setNewApt(p => ({ ...p, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Fim</label>
                    <input className="input" type="time" value={newApt.end_time} onChange={e => setNewApt(p => ({ ...p, end_time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Observações</label>
                  <textarea className="input" rows={2} value={newApt.notes} onChange={e => setNewApt(p => ({ ...p, notes: e.target.value }))} style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleCreate} disabled={saving}>
                    {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Agendar"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "20px" }}>
                  {selectedApt?.lead_name} · {selectedApt?.service} · {selectedApt?.date} às {selectedApt?.start_time?.slice(0, 5)}
                </p>
                {action === "reschedule" && (
                  <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nova data</label>
                      <input type="date" className="input" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", color: "var(--gray-600)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Horário</label>
                      <input type="time" className="input" />
                    </div>
                  </div>
                )}
                <div style={{ background: "var(--green-50)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-sm)", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <Send size={14} style={{ color: "var(--green)", marginTop: "2px", flexShrink: 0 }} />
                  <p style={{ color: "var(--gray-600)", fontSize: "12px", lineHeight: 1.5 }}>
                    Notificação automática será enviada via WhatsApp para {selectedApt?.lead_name}.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>Voltar</button>
                  <button className="btn-primary" style={{ background: action === "cancel" ? "var(--danger)" : "var(--green)" }}
                    onClick={action === "cancel" ? handleCancel : () => setShowModal(false)} disabled={saving}>
                    {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : action === "cancel" ? "Cancelar" : "Confirmar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
