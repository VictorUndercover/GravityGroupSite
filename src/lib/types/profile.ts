export interface InvestmentLevel {
  id: string;
  name: string;
  minValue: number;
  maxValue: number | null;
  icon: string;
  color: string;
  benefits: string[];
  description: string;
  nextGoal?: string;
}

export interface InvestmentCategory {
  id: number;
  name: string;
  color: string;
  minAmount: number;
  maxAmount: number | null;
  icon: string;
  description: string;
  examples: InvestmentExample[];
}

export interface InvestmentExample {
  id: number;
  name: string;
  description: string;
  riskLevel: number;
  expectedReturn: number;
  minInvestment: number;
  duration: string;
  tags: string[];
}

export const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  {
    id: 1,
    name: "Renda Fixa",
    color: "#3B82F6",
    minAmount: 0,
    maxAmount: 50000,
    icon: "💰",
    description: "Investimentos de baixo risco com retorno previsível",
    examples: [
      {
        id: 101,
        name: "Tesouro Direto",
        description: "Títulos públicos do governo federal",
        riskLevel: 1,
        expectedReturn: 8.5,
        minInvestment: 30,
        duration: "2-5 anos",
        tags: ["Segurança", "Liquidez média", "Garantia do Tesouro Nacional"]
      }
    ]
  },
  {
    id: 2,
    name: "Renda Variável",
    color: "#10B981",
    minAmount: 50000,
    maxAmount: 250000,
    icon: "📈",
    description: "Investimentos de maior risco com potencial de retorno elevado",
    examples: [
      {
        id: 201,
        name: "Ações",
        description: "Participação em empresas listadas na bolsa",
        riskLevel: 4,
        expectedReturn: 15,
        minInvestment: 100,
        duration: "5+ anos",
        tags: ["Alto risco", "Potencial de valorização", "Dividendos"]
      }
    ]
  }
];

export const investmentLevels: InvestmentLevel[] = [
  {
    id: 'mercury',
    name: 'Mercúrio',
    minValue: 0,
    maxValue: 50000,
    icon: '☄️',
    color: 'text-gray-400',
    benefits: [
      'Acesso à plataforma básica',
      'Suporte por email',
      'Relatórios mensais'
    ],
    description: 'O primeiro passo na sua jornada espacial.',
    nextGoal: 'Alcance R$50.000 para chegar a Vênus'
  },
  {
    id: 'venus',
    name: 'Vênus',
    minValue: 50000,
    maxValue: 150000,
    icon: '🌅',
    color: 'text-orange-400',
    benefits: [
      'Todos os benefícios anteriores',
      'Consultor dedicado',
      'Relatórios semanais',
      'Primeiro produto exclusivo'
    ],
    description: 'O planeta mais quente, assim como seus investimentos.',
    nextGoal: 'Alcance R$150.000 para chegar à Terra'
  },
  {
    id: 'earth',
    name: 'Terra',
    minValue: 150000,
    maxValue: 300000,
    icon: '🌍',
    color: 'text-blue-400',
    benefits: [
      'Todos os benefícios anteriores',
      'Análises personalizadas',
      'Acesso a eventos exclusivos',
      'Clube de investidores'
    ],
    description: 'Sua base de operações estabelecida.',
    nextGoal: 'Alcance R$300.000 para atravessar o Cinturão de Asteroides'
  },
  {
    id: 'asteroid-belt',
    name: 'Cinturão de Asteroides',
    minValue: 300000,
    maxValue: 500000,
    icon: '💫',
    color: 'text-yellow-300',
    benefits: [
      'Todos os benefícios anteriores',
      'Mineração de oportunidades',
      'Produtos diversificados',
      'Proteção patrimonial'
    ],
    description: 'Navegando por múltiplas oportunidades.',
    nextGoal: 'Alcance R$500.000 para chegar a Marte'
  },
  {
    id: 'mars',
    name: 'Marte',
    minValue: 500000,
    maxValue: 1000000,
    icon: '🔴',
    color: 'text-red-500',
    benefits: [
      'Todos os benefícios anteriores',
      'Equipe dedicada',
      'Produtos de alta rentabilidade',
      'Eventos VIP'
    ],
    description: 'Conquistando novos territórios.',
    nextGoal: 'Alcance R$1.000.000 para chegar a Júpiter'
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    minValue: 1000000,
    maxValue: 2500000,
    icon: '🌟',
    color: 'text-amber-500',
    benefits: [
      'Todos os benefícios anteriores',
      'Gestão de patrimônio personalizada',
      'Acesso a fundos restritos',
      'Encontros com CEOs'
    ],
    description: 'O maior dos planetas, para grandes investidores.',
    nextGoal: 'Alcance R$2.500.000 para chegar a Saturno'
  },
  {
    id: 'saturn',
    name: 'Saturno',
    minValue: 2500000,
    maxValue: 5000000,
    icon: '🪐',
    color: 'text-purple-400',
    benefits: [
      'Todos os benefícios anteriores',
      'Estratégias exclusivas',
      'Comitê de investimentos',
      'Eventos internacionais'
    ],
    description: 'Seu patrimônio brilha como os anéis de Saturno.',
    nextGoal: 'Alcance R$5.000.000 para chegar a Urano'
  },
  {
    id: 'uranus',
    name: 'Urano',
    minValue: 5000000,
    maxValue: 7500000,
    icon: '❄️',
    color: 'text-cyan-400',
    benefits: [
      'Todos os benefícios anteriores',
      'Produtos sob medida',
      'Equipe internacional',
      'Acesso à diretoria'
    ],
    description: 'Inovando além das fronteiras conhecidas.',
    nextGoal: 'Alcance R$7.500.000 para chegar a Netuno'
  },
  {
    id: 'neptune',
    name: 'Netuno',
    minValue: 7500000,
    maxValue: null,
    icon: '🌊',
    color: 'text-blue-600',
    benefits: [
      'Todos os benefícios anteriores',
      'Estruturação de produtos próprios',
      'Participação em decisões estratégicas',
      'Benefícios ilimitados',
      'Membro do conselho Gravity'
    ],
    description: 'O ápice do universo Gravity Group.',
    nextGoal: 'Você alcançou o nível máximo!'
  }
];

export interface AstronomicalLevel {
    id: number;
    name: string;
    icon: string;
    requiredAmount: number;
    mass: string;
    description: string;
    mission: string;
}

export interface UserProfile {
    currentAmount: number;
    currentLevel: AstronomicalLevel;
    nextLevel: AstronomicalLevel | null;
    progressToNext: number;
}

export const ASTRONOMICAL_LEVELS: AstronomicalLevel[] = [
    {
        id: 0,
        name: "Terra",
        icon: "🌍",
        requiredAmount: 0,
        mass: "5,97 × 10²⁴ kg",
        description: "Você está no berço da humanidade, um pequeno planeta azul. Aqui começam todos os investidores antes de expandirem sua influência financeira.",
        mission: "Iniciar sua jornada de investimentos."
    },
    {
        id: 1,
        name: "Lua",
        icon: "🌙",
        requiredAmount: 1000,
        mass: "7,35 × 10²² kg",
        description: "Você já deixou a Terra e chegou à Lua, um corpo 81 vezes menos massivo que a Terra. Seu capital ainda é pequeno, mas já começa a ganhar estrutura.",
        mission: "Estabelecer disciplina de aportes."
    },
    {
        id: 2,
        name: "Marte",
        icon: "🪐",
        requiredAmount: 10000,
        mass: "6,42 × 10²³ kg",
        description: "O primeiro planeta conquistado por investidores pioneiros. Menor que a Terra, mas sólido e promissor.",
        mission: "Aprender sobre diversificação inteligente."
    },
    {
        id: 3,
        name: "Cinturão de Asteroides",
        icon: "🌠",
        requiredAmount: 50000,
        mass: "3,0 × 10²¹ kg",
        description: "Agora você pode minerar oportunidades, como investidores que extraem riquezas de pequenos corpos espaciais.",
        mission: "Expandir horizontes de investimento e encontrar novas fontes de renda."
    },
    {
        id: 4,
        name: "Júpiter",
        icon: "🪐",
        requiredAmount: 100000,
        mass: "1,90 × 10²⁷ kg",
        description: "Seu patrimônio cresce rapidamente, e você agora representa um dos maiores planetas do Sistema Solar.",
        mission: "Dominar o mercado de renda variável e alternativas."
    },
    {
        id: 5,
        name: "Estrela Anã Vermelha",
        icon: "🌀",
        requiredAmount: 500000,
        mass: "1,99 × 10²⁹ kg",
        description: "Você deixou de ser um planeta e se tornou uma estrela! As anãs vermelhas representam investidores sólidos e resilientes.",
        mission: "Construir um portfólio à prova de crises."
    },
    {
        id: 6,
        name: "Sol",
        icon: "☀️",
        requiredAmount: 1000000,
        mass: "1,99 × 10³⁰ kg",
        description: "O Sol é o centro de um sistema próspero. Aqui, investidores têm influência real no mercado e geram calor e movimento.",
        mission: "Criar um ecossistema sustentável de investimentos."
    },
    {
        id: 7,
        name: "Estrela Gigante Azul",
        icon: "💥",
        requiredAmount: 5000000,
        mass: "1,99 × 10³² kg",
        description: "Agora você é uma estrela gigante, muito mais brilhante e poderosa que o Sol. Aqui, poucos investidores chegam.",
        mission: "Planejar sucessão patrimonial e expansão global."
    },
    {
        id: 8,
        name: "Galáxia",
        icon: "🌌",
        requiredAmount: 10000000,
        mass: "1,99 × 10⁴² kg",
        description: "Agora você deixou de ser uma única estrela e se tornou um sistema inteiro de oportunidades e patrimônio.",
        mission: "Tornar-se referência mundial em gestão e crescimento financeiro."
    },
    {
        id: 9,
        name: "Buraco Negro Supermassivo",
        icon: "🕳️",
        requiredAmount: 50000000,
        mass: "1,99 × 10⁴⁸ kg",
        description: "O ápice do conhecimento financeiro. Assim como um buraco negro dobra a realidade, você domina os mercados.",
        mission: "Criar um império imortal no mundo dos investimentos."
    }
]; 