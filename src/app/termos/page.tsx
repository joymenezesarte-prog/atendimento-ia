import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço — Atendimento IA",
  description: "Termos de serviço da plataforma Atendimento IA.",
};

export default function TermosPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--gray-50, #f9fafb)",
      fontFamily: "Inter, -apple-system, sans-serif",
    }}>
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
          Termos de Serviço
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "40px" }}>
          Última atualização: maio de 2025
        </p>

        {[
          {
            title: "1. Aceitação dos termos",
            text: `Ao criar uma conta e utilizar a plataforma Atendimento IA, você concorda com estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não utilize o serviço.`,
          },
          {
            title: "2. Descrição do serviço",
            text: `O Atendimento IA é uma plataforma SaaS que permite a criação e gestão de agentes de inteligência artificial para atendimento automatizado via WhatsApp. O serviço inclui acesso ao painel de controle, configuração de agentes, gerenciamento de conversas e relatórios de desempenho.`,
          },
          {
            title: "3. Cadastro e conta",
            text: `Você é responsável por manter a confidencialidade das suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente caso suspeite de acesso não autorizado. Você deve fornecer informações verdadeiras e atualizadas no cadastro.`,
          },
          {
            title: "4. Planos e pagamentos",
            text: `O acesso ao serviço está condicionado à assinatura de um dos planos disponíveis. Os valores são cobrados mensalmente via cartão de crédito. Em caso de inadimplência, o acesso pode ser suspenso após notificação. Não realizamos reembolsos de períodos já utilizados.`,
          },
          {
            title: "5. Uso aceitável",
            text: `Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. É proibido: (a) usar o serviço para envio de spam ou mensagens não solicitadas; (b) violar direitos de terceiros; (c) tentar acessar sistemas não autorizados; (d) revender o serviço sem autorização prévia.`,
          },
          {
            title: "6. Responsabilidade pelo conteúdo",
            text: `Você é o único responsável pelo conteúdo das respostas configuradas nos seus agentes de IA e pelas mensagens enviadas aos seus clientes. O Atendimento IA não se responsabiliza por danos causados pelo uso inadequado da plataforma ou por conteúdo gerado pelos seus agentes.`,
          },
          {
            title: "7. Integração com WhatsApp",
            text: `O uso do WhatsApp Business API está sujeito às Políticas de Uso do WhatsApp e Meta. Você é responsável por cumprir todas as políticas da Meta ao usar o serviço, incluindo obter os devidos consentimentos dos seus usuários finais.`,
          },
          {
            title: "8. Disponibilidade do serviço",
            text: `Nos esforçamos para manter o serviço disponível 24/7, mas não garantimos disponibilidade ininterrupta. Podemos realizar manutenções programadas com aviso prévio. Não nos responsabilizamos por indisponibilidades causadas por terceiros (provedores de API, infraestrutura de nuvem, etc.).`,
          },
          {
            title: "9. Propriedade intelectual",
            text: `Todos os direitos sobre a plataforma, marca, código e materiais do Atendimento IA são de propriedade exclusiva da empresa. Você não pode copiar, modificar, distribuir ou criar obras derivadas sem autorização expressa.`,
          },
          {
            title: "10. Rescisão",
            text: `Você pode cancelar sua conta a qualquer momento pelo painel de controle. Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, com ou sem aviso prévio. Após o cancelamento, seus dados serão mantidos por até 90 dias antes da exclusão definitiva.`,
          },
          {
            title: "11. Limitação de responsabilidade",
            text: `Na máxima extensão permitida por lei, o Atendimento IA não será responsável por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso ou da impossibilidade de uso do serviço. Nossa responsabilidade total não excederá o valor pago por você nos últimos 3 meses.`,
          },
          {
            title: "12. Alterações nos termos",
            text: `Podemos atualizar estes termos periodicamente. Notificaremos você sobre mudanças significativas por e-mail com pelo menos 15 dias de antecedência. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.`,
          },
          {
            title: "13. Lei aplicável e foro",
            text: `Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão resolvidas no foro da comarca de Belo Horizonte, Minas Gerais, Brasil, renunciando as partes a qualquer outro, por mais privilegiado que seja.`,
          },
          {
            title: "14. Contato",
            text: `Para dúvidas sobre estes termos, entre em contato:\n\nAtendimento IA\nE-mail: contato@atendimentoia.cloud\nSite: https://app.atendimentoia.cloud`,
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
            Ao utilizar o Atendimento IA, você declara ter lido e concordado com estes Termos de Serviço e com nossa{" "}
            <Link href="/privacidade" style={{ color: "#059669", fontWeight: 600 }}>Política de Privacidade</Link>.
          </p>
        </div>
      </main>

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
