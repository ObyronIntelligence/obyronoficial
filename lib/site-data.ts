export type Plan = {
  id: "starter" | "pro" | "ultimate";
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  highlighted?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Software com automacoes basicas",
    price: "R$ 1.490",
    priceSuffix: "/mes",
    features: [
      "Site institucional moderno",
      "Hospedagem e dominio configurados",
      "Automacoes basicas",
      "Integracao com WhatsApp",
      "Suporte por e-mail",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Software + automacoes detalhadas",
    price: "R$ 3.490",
    priceSuffix: "/mes",
    highlighted: true,
    features: [
      "Tudo do Starter",
      "Automacoes avancadas multi-etapas",
      "Integracoes com CRM, ERP e pagamentos",
      "Painel de administracao customizado",
      "Workflows com regras condicionais",
      "Suporte prioritario",
    ],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    tagline: "Tudo + Inteligencia Artificial",
    price: "R$ 6.990",
    priceSuffix: "/mes",
    features: [
      "Tudo do Pro",
      "Acesso completo a ObyronAI",
      "Agentes de IA personalizados",
      "Atendimento automatizado com IA",
      "Analise preditiva e relatorios",
      "Treinamento com seus dados",
      "Suporte dedicado 24/7",
    ],
  },
];
