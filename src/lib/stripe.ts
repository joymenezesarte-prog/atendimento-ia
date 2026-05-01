import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

// Planos do SaaS com IDs reais do Stripe
export const PLANS = {
  atendimento: {
    id: 'atendimento',
    name: 'Atendimento IA',
    description: 'Agente IA no WhatsApp para atendimento e captação de leads',
    monthly: 24900,
    implantation: 50000,
    trial_days: 30,
    product_id: 'prod_URCUxFr2FqAUty',
    monthly_price_id: 'price_1TSK5CHm9nRXYdRY5a5WqQCK',
    implantation_price_id: 'price_1TSK5DHm9nRXYdRYxKnA6vbA',
    features: [
      'Agente IA no WhatsApp',
      'Área exclusiva do cliente',
      'Histórico das conversas',
      'CRM com leads coletados',
      'Dashboard de acompanhamento',
      'Encaminhamento para humano',
    ],
  },
  vendas: {
    id: 'vendas',
    name: 'Vendas IA',
    description: 'Agente IA completo com funil de vendas e agendamento',
    monthly: 49900,
    implantation: 70000,
    trial_days: 30,
    product_id: 'prod_URCUyamj7rX1ba',
    monthly_price_id: 'price_1TSK5DHm9nRXYdRYbtGtTD6R',
    implantation_price_id: 'price_1TSK5EHm9nRXYdRYjoDTkTaD',
    features: [
      'Tudo do Atendimento IA',
      'Qualificação automática dos leads',
      'Pontuação do lead de 0 a 10',
      'Recuperação automática de leads frios',
      'Integração com Google Agenda',
      'Marcar, reagendar e cancelar horários',
      'Lembretes automáticos para cliente e empresa',
      'Links de pagamento configuráveis',
      'Ação automática após pagamento',
      'Dashboard completo e relatórios de conversão',
    ],
  },
  operacao: {
    id: 'operacao',
    name: 'Operação IA',
    description: 'Operação completa com múltiplos agentes e canais',
    monthly: 88900,
    implantation: 200000,
    trial_days: 30,
    product_id: 'prod_URCUPeNOLQN1Gp',
    monthly_price_id: 'price_1TSK5FHm9nRXYdRYH0NiJWJs',
    implantation_price_id: 'price_1TSK5FHm9nRXYdRY4yQ9Ne0D',
    features: [
      'Tudo do Vendas IA',
      'Múltiplos agentes por setor',
      'Até 2 WhatsApps, 1 Instagram e 1 site',
      'Funis diferentes por serviço',
      'CRM personalizado',
      'Notificações por WhatsApp, e-mail, Telegram ou Slack',
      'Relatórios avançados',
      'Permissões por usuário/equipe',
      'Automações personalizadas',
      'Dashboard executivo e banco de dados próprio',
      'Pós-venda automático e recuperação avançada de leads',
    ],
  },
}

export type PlanId = keyof typeof PLANS
