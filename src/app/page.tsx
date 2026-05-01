"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Confirme seu email antes de entrar.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (data.user.email === adminEmail) {
          router.push("/admin");
        } else {
          router.push("/client");
        }
      }
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--gray-50)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, var(--gray-200) 1px, transparent 0)",
        backgroundSize: "40px 40px",
        opacity: 0.5,
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        top: "-30%",
        right: "10%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="animate-fade-up" style={{
        width: "100%",
        maxWidth: "400px",
        padding: "0 24px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--gray-900)", letterSpacing: "-0.5px" }}>
              Atendimento
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "var(--green)", color: "white", fontSize: "13px", fontWeight: 800,
              width: "32px", height: "32px", borderRadius: "50% 50% 50% 8px",
            }}>
              IA
            </span>
          </div>
          <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Acesse sua plataforma</p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "var(--gray-700)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: "36px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "var(--gray-700)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: "36px", paddingRight: "40px" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", padding: 0,
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <a href="/esqueci-senha" style={{ fontSize: "13px", color: "var(--green)", textDecoration: "none", fontWeight: 500 }}>
                Esqueceu a senha?
              </a>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: "16px",
                color: "var(--danger)", fontSize: "13px", textAlign: "center",
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isLoading}
              style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? (
                <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Entrando...</>
              ) : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center", paddingTop: "20px", borderTop: "1px solid var(--gray-100)" }}>
            <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
              Não tem conta?{" "}
              <a href="/cadastro" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>
                Criar conta
              </a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "var(--gray-400)", fontSize: "12px", marginTop: "28px" }}>
          © 2026 Atendimento IA
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
