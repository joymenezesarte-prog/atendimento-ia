"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Supabase envia o token via hash fragment — o SDK trata automaticamente
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Token válido, usuário pode redefinir a senha
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      setSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <CheckCircle size={48} style={{ color: "var(--green)", margin: "0 auto 16px" }} />
        <h2 style={{ color: "var(--gray-900)", fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Senha redefinida!</h2>
        <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", color: "var(--gray-600)", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Nova senha</label>
        <div style={{ position: "relative" }}>
          <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            style={{ paddingLeft: "42px", paddingRight: "42px" }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label style={{ display: "block", color: "var(--gray-600)", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Confirmar nova senha</label>
        <div style={{ position: "relative" }}>
          <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
            required
            style={{ paddingLeft: "42px" }}
          />
        </div>
      </div>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--danger)", fontSize: "13px" }}>
          {error}
        </div>
      )}
      <button className="btn-primary" type="submit" disabled={isLoading} style={{ marginTop: "4px" }}>
        {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}
        {isLoading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "36px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ color: "var(--gray-900)", fontSize: "22px", fontWeight: 800, marginBottom: "6px" }}>Redefinir senha</h1>
          <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Escolha uma nova senha para sua conta.</p>
        </div>
        <Suspense fallback={<div className="spinner" style={{ margin: "0 auto" }} />}>
          <RedefinirSenhaForm />
        </Suspense>
      </div>
    </div>
  );
}
