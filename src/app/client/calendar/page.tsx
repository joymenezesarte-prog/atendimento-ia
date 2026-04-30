"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Phone, FileText, RefreshCw, X as XIcon, Send } from "lucide-react";

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const appointments = [
  { id: "1", date: "2026-04-29", time: "09:00", endTime: "10:00", name: "Maria Santos", service: "Limpeza", phone: "+55 11 99900-1234", status: "confirmed", notes: "Paciente com sensibilidade" },
  { id: "2", date: "2026-04-29", time: "10:30", endTime: "12:00", name: "Carlos Oliveira", service: "Clareamento", phone: "+55 11 98800-5678", status: "confirmed", notes: "" },
  { id: "3", date: "2026-04-29", time: "14:30", endTime: "15:30", name: "Ana Lima", service: "Avaliação", phone: "+55 11 97700-9012", status: "pending", notes: "Primeira consulta" },
  { id: "4", date: "2026-04-29", time: "16:00", endTime: "17:30", name: "Roberto Dias", service: "Implante", phone: "+55 11 96600-3456", status: "confirmed", notes: "Retorno" },
  { id: "5", date: "2026-04-30", time: "08:00", endTime: "09:00", name: "Juliana Souza", service: "Limpeza", phone: "+55 11 95500-7890", status: "confirmed", notes: "" },
  { id: "6", date: "2026-05-02", time: "09:00", endTime: "10:00", name: "Patrícia Lima", service: "Ortodontia", phone: "+55 11 93300-5678", status: "confirmed", notes: "" },
];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState("2026-04-29");
  const [currentMonth, setCurrentMonth] = useState(3);
  const [currentYear] = useState(2026);
  const [showModal, setShowModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<typeof appointments[0] | null>(null);
  const [action, setAction] = useState<"reschedule" | "cancel" | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const todayApts = appointments.filter(a => a.date === selectedDate);
  const hasApt = (day: number) => appointments.some(a => a.date === `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800 }}>Calendário de Agendamentos</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "13px", marginTop: "2px" }}>Sincronizado com Google Calendar</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setCurrentMonth(m => m > 0 ? m - 1 : 11)}><ChevronLeft size={16} /></button>
            <span style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700 }}>{months[currentMonth]} {currentYear}</span>
            <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setCurrentMonth(m => m < 11 ? m + 1 : 0)}><ChevronRight size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
            {daysOfWeek.map(d => <div key={d} style={{ textAlign: "center", color: "var(--gray-400)", fontSize: "11px", fontWeight: 600, padding: "4px" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const sel = dateStr === selectedDate;
              const has = hasApt(day);
              const today = day === 29 && currentMonth === 3;
              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)} style={{
                  width: "38px", height: "38px", borderRadius: "var(--radius-sm)",
                  border: today && !sel ? "1.5px solid var(--green)" : "none",
                  background: sel ? "var(--green)" : "transparent",
                  color: sel ? "white" : "var(--gray-700)", fontWeight: sel || today ? 700 : 400,
                  fontSize: "13px", cursor: "pointer", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
                }}
                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "var(--gray-50)"; }}
                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                >
                  {day}
                  {has && !sel && <span style={{ position: "absolute", bottom: "3px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--green)" }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ color: "var(--gray-900)", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
            {selectedDate.split("-").reverse().join("/")} · {todayApts.length} agendamentos
          </h3>
          {todayApts.length === 0 ? (
            <div className="card" style={{ padding: "48px", textAlign: "center" }}>
              <Calendar size={40} style={{ color: "var(--gray-300)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>Nenhum agendamento neste dia</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {todayApts.map(apt => (
                <div key={apt.id} className="card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      <div style={{ minWidth: "52px", textAlign: "center", padding: "8px 10px", borderRadius: "var(--radius-sm)", background: apt.status === "confirmed" ? "var(--green-50)" : "rgba(245,158,11,0.06)" }}>
                        <p style={{ color: apt.status === "confirmed" ? "var(--green)" : "var(--warning)", fontSize: "15px", fontWeight: 700 }}>{apt.time}</p>
                        <p style={{ color: "var(--gray-400)", fontSize: "10px" }}>{apt.endTime}</p>
                      </div>
                      <div>
                        <p style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 600 }}>{apt.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", color: "var(--gray-400)", fontSize: "12px" }}>
                          <span>{apt.service}</span> · <Phone size={11} /> <span>{apt.phone}</span>
                        </div>
                        {apt.notes && <p style={{ color: "var(--gray-400)", fontSize: "12px", marginTop: "4px", fontStyle: "italic", display: "flex", alignItems: "center", gap: "4px" }}><FileText size={11} /> {apt.notes}</p>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className={`badge ${apt.status === "confirmed" ? "badge-green" : "badge-yellow"}`}>
                        {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                      </span>
                      <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => { setSelectedApt(apt); setAction("reschedule"); setShowModal(true); }}><RefreshCw size={14} /></button>
                      <button className="btn-ghost" style={{ padding: "4px", color: "var(--danger)" }} onClick={() => { setSelectedApt(apt); setAction("cancel"); setShowModal(true); }}><XIcon size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedApt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-up" style={{ width: "100%", maxWidth: "440px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>
                {action === "cancel" ? "Cancelar Agendamento" : "Reagendar"}
              </h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: "4px" }}><XIcon size={16} /></button>
            </div>
            <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "20px" }}>
              {selectedApt.name} · {selectedApt.service} · {selectedApt.date} às {selectedApt.time}
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
                Notificação automática será enviada via WhatsApp para {selectedApt.name}.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Voltar</button>
              <button className="btn-primary" style={{ background: action === "cancel" ? "var(--danger)" : "var(--green)" }}>
                {action === "cancel" ? "Cancelar" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
