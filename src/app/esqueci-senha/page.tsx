"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/redefinir-senha`,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, var(--gray-200) 1px, transparent 0)", backgroundSize: "40px 40px", opacity: 0.5, pointerEvents: "none" }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--gray-900)" }}>Atendimento</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green)", color: "white", fontSize: "12px", fontWeight: 800, width: "28px", height: "28px", borderRadius: "50% 50% 50% 8px" }}>IA</span>
          </div>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📧</div>
              <h3 style={{ color: "var(--gray-900)", fontWeight: 700, marginBottom: "8px" }}>Email enviado!</h3>
              <p style={{ color: "var(--gray-500)", fontSize: "13px", lineHeight: 1.6, marginBottom: "24px" }}>
                Enviamos um link para <strong>{email}</strong>. Verifique sua caixa de entrada.
              </p>
              <a href="/" style={{ color: "var(--green)", fontSize: "13px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ArrowLeft size={14} /> Voltar ao login
              </a>
            </div>
          ) : (
            <>
              <h3 style={{ color: "var(--gray-900)", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Recuperar senha</h3>
              <p style={{ color: "var(--gray-500)", fontSize: "13px", marginBottom: "24px" }}>
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", color: "var(--gray-700)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Email</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                    <input type="email" className="input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: "36px" }} />
                  </div>
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: "16px", color: "var(--danger)", fontSize: "13px" }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Enviando...</> : <>Enviar link <ArrowRight size={16} /></>}
                </button>
              </form>
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <a href="/" style={{ color: "var(--gray-400)", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <ArrowLeft size={13} /> Voltar ao login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
