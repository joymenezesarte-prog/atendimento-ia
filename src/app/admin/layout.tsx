"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MouseGlow from "@/components/MouseGlow";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard, Users, Bot, MessageSquare, Target,
  BarChart3, CreditCard, Settings, ChevronLeft, ChevronRight,
  Bell, LogOut
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { id: "clients",   label: "Clientes",  icon: Users,           path: "/admin/clients" },
  { id: "agents",    label: "Agentes",   icon: Bot,             path: "/admin/agents" },
  { id: "conversations", label: "Conversas", icon: MessageSquare, path: "/admin/conversations" },
  { id: "leads",     label: "Leads CRM", icon: Target,          path: "/admin/leads" },
  { id: "reports",   label: "Relatórios",icon: BarChart3,       path: "/admin/reports" },
  { id: "billing",   label: "Financeiro",icon: CreditCard,      path: "/admin/billing" },
  { id: "settings",  label: "Config.",   icon: Settings,        path: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>
      <MouseGlow />

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? "68px" : "220px",
        background: "var(--white)",
        borderRight: "1px solid var(--gray-200)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "20px 0" : "20px 16px", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, margin: collapsed ? "0 auto" : undefined }}>
            <Bot size={18} color="white" />
          </div>
          {!collapsed && (
            <div>
              <p style={{ color: "var(--gray-900)", fontSize: "13px", fontWeight: 800, lineHeight: 1 }}>Atendimento IA</p>
              <p style={{ color: "var(--green)", fontSize: "10px", fontWeight: 600, marginTop: "2px" }}>Admin</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "12px 8px", overflow: "hidden" }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: "var(--radius-sm)",
                  background: active ? "var(--green-50)" : "transparent",
                  color: active ? "var(--green)" : "var(--gray-500)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13px",
                  marginBottom: "2px",
                  transition: "all 0.15s",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--gray-100)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: "10px", padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: "var(--radius-sm)", background: "transparent",
              color: "var(--gray-400)", fontSize: "13px", fontWeight: 500,
              border: "none", cursor: "pointer",
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && "Sair"}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: "10px", padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: "var(--radius-sm)", background: "transparent",
              color: "var(--gray-400)", fontSize: "13px", fontWeight: 500,
              border: "none", cursor: "pointer", marginTop: "4px",
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && "Recolher"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: collapsed ? "68px" : "220px", flex: 1, padding: "32px", transition: "margin-left 0.2s ease" }}>
        {/* Topbar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "28px", gap: "12px" }}>
          <button style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--gray-200)", background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--gray-500)" }}>
            <Bell size={16} />
          </button>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 800 }}>
            A
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
