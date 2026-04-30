import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atendimento IA — Dashboard",
  description: "Plataforma SaaS de Agentes IA para WhatsApp. Gerencie seus agentes, leads e conversas.",
  keywords: "atendimento ia, whatsapp, agente ia, saas, chatbot, automação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
