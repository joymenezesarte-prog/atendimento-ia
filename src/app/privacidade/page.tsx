import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Atendimento IA",
  description: "Política de privacidade da plataforma Atendimento IA.",
};

export default function PrivacidadePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--gray-50, #f9fafb)",
      fontFamily: "Inter, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: "16px" }}>⚡</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>Atendimento IA</span>
        </div>
        <Link href="/login" style={{
          color: "#10b981",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          ← Voltar ao login
        </Link>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "48px 24px",
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: 800,
          color: "#111827",
          marginBottom: "8px",
        }}>
          Política de Privacidade
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "40px" }}>
          Última atualização: maio de 2025
        </p>

        {[
          {
            title: "1. Informações que coletamos",
            text: `Coletamos informações fornecidas diretamente por você ao criar uma conta, como nome, endereço de e-mail e dados de pagamento. Também coletamos dados de uso da plataforma, como mensagens processadas, configurações de agentes e registros de acesso, para garantir o funcionamento correto do serviço.`,
          },
          {
            title: "2. Como usamos suas informações",
            text: `Utilizamos seus dados para: (a) fornecer, manter e melhorar a plataforma Atendimento IA; (b) processar pagamentos e gerenciar sua assinatura; (c) enviar comunicações sobre o serviço, como atualizações e alertas de segurança; (d) cumprir obrigações legais e regulatórias.`,
          },
          {
            title: "3. Compartilhamento de dados",
            text: `Não vendemos seus dados pessoais. Podemos compartilhar informações com prestadores de serviço terceirizados (como processadores de pagamento e provedores de infraestrutura) estritamente para operar a plataforma. Esses parceiros estão contratualmente obrigados a proteger seus dados.`,
          },
          {
            title: "4. Dados de clientes finais (WhatsApp)",
            text: `As mensagens trocadas entre seus clientes e os agentes de IA são processadas em tempo real para gerar respostas automáticas. Armazenamos o histórico de conversas conforme configurado em sua conta. Você é responsável por informar seus próprios usuários sobre o uso de IA no atendimento.`,
          },
          {
            title: "5. Segurança",
            text: `Adotamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Os dados são armazenados em servidores com criptografia em trânsito (TLS) e em repouso.`,
          },
          {
            title: "6. Retenção de dados",
            text: `Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer o serviço. Após o encerramento da conta, podemos reter dados por até 90 dias antes da exclusão definitiva, salvo obrigação legal contrária.`,
          },
          {
            title: "7. Seus direitos",
            text: `Você tem direito de acessar, corrigir ou excluir seus dados pessoais. Para exercer esses direitos, entre em contato conosco pelo e-mail abaixo. Atenderemos sua solicitação dentro dos prazos previstos pela legislação aplicável (LGPD).`,
          },
          {
            title: "8. Cookies",
            text: `Utilizamos cookies essenciais para manter a sessão autenticada e garantir o funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade de terceiros.`,
          },
          {
            title: "9. Alterações nesta política",
            text: `Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças significativas por e-mail ou por aviso destacado na plataforma. O uso continuado do serviço após as alterações constitui aceitação da nova política.`,
          },
          {
            title: "10. Contato",
            text: `Para dúvidas, solicitações ou reclamações sobre privacidade, entre em contato:\n\nAtendimento IA\nE-mail: contato@atendimentoia.cloud\nSite: https://app.atendimentoia.cloud`,
          },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "10px",
            }}>
              {section.title}
            </h2>
            <p style={{
              color: "#374151",
              fontSize: "15px",
              lineHeight: "1.7",
              whiteSpace: "pre-line",
            }}>
              {section.text}
            </p>
          </section>
        ))}

        <div style={{
          marginTop: "48px",
          padding: "20px",
          background: "#f0fdf4",
          borderRadius: "12px",
          borderLeft: "4px solid #10b981",
        }}>
          <p style={{ color: "#065f46", fontSize: "14px", margin: 0 }}>
            Esta plataforma está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "24px",
        color: "#9ca3af",
        fontSize: "13px",
        borderTop: "1px solid #e5e7eb",
        marginTop: "40px",
      }}>
        © {new Date().getFullYear()} Atendimento IA. Todos os direitos reservados.
      </footer>
    </div>
  );
}
