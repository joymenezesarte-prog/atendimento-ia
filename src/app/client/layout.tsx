"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import MouseGlow from "@/components/MouseGlow";
import {
  LayoutDashboard, MessageSquare, Target, Calendar,
  BarChart3, CreditCard, Users, ChevronLeft, ChevronRight,
  Bell, LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface ClientInfo {
  company_name: string;
  contact_name: string;
  plan_id: string | null;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/client" },
  { id: "conversations", label: "Conversas", icon: MessageSquare, path: "/client/conversations" },
  { id: "leads", label: "Leads", icon: Target, path: "/client/leads" },
  { id: "calendar", label: "Agendamentos", icon: Calendar, path: "/client/calendar" },
  { id: "reports", label: "Relatórios", icon: BarChart3, path: "/client/reports" },
  { id: "billing", label: "Assinatura", icon: CreditCard, path: "/client/billing" },
  { id: "team", label: "Equipe", icon: Users, path: "/client/team" },
];

const planLabels: Record<string, string> = {
  atendimento: "Atendimento IA",
  vendas: "Vendas IA",
  operacao: "Operação IA",
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  const isActive = (path: string) => path === "/client" ? pathname === "/client" : pathname.startsWith(path);

  useEffect(() => {
    async function loadInfo() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const initial = user.email?.charAt(0).toUpperCase() || "U";
          setUserInitial(initial);
        }
        const res = await fetch("/api/clients/me");
        if (res.ok) setClientInfo(await res.json());
      } catch (e) {
        console.error(e);
      }
    }
    loadInfo();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const companyName = clientInfo?.company_name || "Minha Empresa";
  const planLabel = clientInfo?.plan_id ? planLabels[clientInfo.plan_id] : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>
      <aside style={{
        width: collapsed ? "68px" : "240px",
        background: "var(--white)",
        borderRight: "1px solid var(--gray-200)",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, overflow: "hidden",
      }}>
        <div style={{
          padding: collapsed ? "20px 14px" : "20px 20px",
          borderBottom: "1px solid var(--gray-100)",
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", minHeight: "64px",
        }}>
          {!collapsed ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "17px", fontWeight: 800, color: "var(--gray-900)", letterSpacing: "-0.3px" }}>Atendimento</span>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green)", color: "white", fontSize: "9px", fontWeight: 800, width: "22px", height: "22px", borderRadius: "50% 50% 50% 4px" }}>IA</span>
            </div>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green)", color: "white", fontSize: "10px", fontWeight: 800, width: "28px", height: "28px", borderRadius: "50% 50% 50% 5px" }}>IA</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="btn-ghost" style={{ padding: "4px", display: collapsed ? "none" : "flex" }}><ChevronLeft size={16} /></button>
        </div>

        {!collapsed && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gray-100)" }}>
            <p style={{ color: "var(--gray-400)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Empresa</p>
            <p style={{ color: "var(--gray-900)", fontSize: "14px", fontWeight: 700, marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{companyName}</p>
            {planLabel && <span className="badge badge-green" style={{ marginTop: "6px" }}>{planLabel}</span>}
          </div>
        )}

        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button key={item.id} onClick={() => router.push(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: collapsed ? "10px" : "10px 12px",
                  borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? "var(--green-50)" : "transparent",
                  color: active ? "var(--green-dim)" : "var(--gray-500)",
                  fontSize: "13px", fontWeight: active ? 600 : 500,
                  fontFamily: "'Inter', sans-serif", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--gray-50)"; e.currentTarget.style.color = "var(--gray-700)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gray-500)"; } }}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {collapsed && (
          <div style={{ padding: "8px", borderTop: "1px solid var(--gray-100)" }}>
            <button onClick={() => setCollapsed(false)} className="btn-ghost" style={{ width: "100%", justifyContent: "center", padding: "8px" }}><ChevronRight size={16} /></button>
          </div>
        )}

        <div style={{ padding: collapsed ? "12px 8px" : "12px 16px", borderTop: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "10px", justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
            {userInitial}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{clientInfo?.contact_name || companyName}</div>
                <div style={{ color: "var(--gray-400)", fontSize: "11px" }}>{planLabel || "Sem plano"}</div>
              </div>
              <button onClick={handleLogout} className="btn-ghost" style={{ padding: "4px" }}><LogOut size={16} /></button>
            </>
          )}
        </div>
      </aside>

      <MouseGlow />

      <main style={{ flex: 1, marginLeft: collapsed ? "68px" : "240px", transition: "margin-left 0.2s ease", position: "relative", zIndex: 1 }}>
        <header style={{
          height: "64px", borderBottom: "1px solid var(--gray-100)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", background: "var(--white)", position: "sticky", top: 0, zIndex: 40,
        }}>
          <h1 style={{ color: "var(--gray-900)", fontSize: "16px", fontWeight: 700 }}>
            {menuItems.find(i => isActive(i.path))?.label || "Dashboard"}
          </h1>
          <button className="btn-ghost" style={{ position: "relative" }}>
            <Bell size={18} />
            <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)", border: "2px solid var(--white)" }} />
          </button>
        </header>
        <div style={{ padding: "28px" }}>{children}</div>
      </main>
    </div>
  );
}
