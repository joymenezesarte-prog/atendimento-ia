"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", company: "", email: "", password: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            company_name: form.company,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Este email já está cadastrado. Faça login.");
        } else {
          setError(authError.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="card animate-fade-up" style={{ maxWidth: "400px", width: "100%", padding: "40px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: "28px" }}>✅</span>
          </div>
          <h2 style={{ color: "var(--gray-900)", fontWeight: 800, fontSize: "20px", marginBottom: "12px" }}>Conta criada!</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "14px", marginBottom: "28px", lineHeight: 1.6 }}>
            Enviamos um link de confirmação para <strong>{form.email}</strong>. Confirme seu email para acessar a plataforma.
          </p>
          <a href="/" className="btn-primary" style={{ display: "inline-flex", justifyContent: "center", padding: "12px 24px", textDecoration: "none" }}>
            Ir para o login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "24px" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, var(--gray-200) 1px, transparent 0)", backgroundSize: "40px 40px", opacity: 0.5, pointerEvents: "none" }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--gray-900)", letterSpacing: "-0.5px" }}>Atendimento</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green)", color: "white", fontSize: "12px", fontWeight: 800, width: "28px", height: "28px", borderRadius: "50% 50% 50% 8px" }}>IA</span>
          </div>
          <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Crie sua conta grátis</p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleCadastro}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", color: "var(--gray-700)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Nome completo</label>
                <div style={{ position: "relative" }}>
                  <User size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                  <input name="fullName" type="text" className="input" placeholder="Seu nome" value={form.fullName} onChange={handleChange} required style={{ paddingLeft: "30px", fontSize: "13px" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--gray-700)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Empresa</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                  <input name="company" type="text" className="input" placeholder="Sua empresa" value={form.company} onChange={handleChange} style={{ paddingLeft: "30px", fontSize: "13px" }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "var(--gray-700)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                <input name="email" type="email" className="input" placeholder="seu@email.com" value={form.email} onChange={handleChange} required style={{ paddingLeft: "30px", fontSize: "13px" }} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "var(--gray-700)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                <input name="password" type={showPassword ? "text" : "password"} className="input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} required style={{ paddingLeft: "30px", paddingRight: "36px", fontSize: "13px" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", padding: 0 }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "var(--gray-700)", fontSize: "12px", fontWeight: 500, marginBottom: "6px" }}>Confirmar senha</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                <input name="confirm" type="password" className="input" placeholder="Repita a senha" value={form.confirm} onChange={handleChange} required style={{ paddingLeft: "30px", fontSize: "13px" }} />
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: "16px", color: "var(--danger)", fontSize: "13px", textAlign: "center" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Criando conta...</> : <>Criar conta <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center", paddingTop: "16px", borderTop: "1px solid var(--gray-100)" }}>
            <p style={{ color: "var(--gray-500)", fontSize: "13px" }}>
              Já tem conta?{" "}
              <a href="/" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>Entrar</a>
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
