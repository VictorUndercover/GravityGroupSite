<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/firebase';
  import { goto } from '$app/navigation';
  import { animationStartTime } from '$lib/stores/animation';
  import * as THREE from 'three';
  import { browser } from '$app/environment';
  import ApexCharts from 'apexcharts';
  import type { User } from 'firebase/auth';
  import type { Investment, ChartOptions } from '$lib/types';

  let user: User | null = null;
  let container: HTMLElement;
  let globeGroup: THREE.Group;
  let stars: THREE.Points;
  let showProfileModal = false;
  let loadingCharts = true;
  let initialized = false;
  let charts: ApexCharts[] = [];
  let activeTab = 'dashboard';
  let loading = true;

  // Dados dos investimentos
  let investments = [
    {
      partner: 'Dominion',
      initialAmount: 750000,
      currentAmount: 1012500,
      startDate: '2023-06-15',
      returns: [
        { date: '2023-07', value: 780000 },
        { date: '2023-08', value: 825000 },
        { date: '2023-09', value: 870000 },
        { date: '2023-10', value: 930000 },
        { date: '2023-11', value: 975000 },
        { date: '2023-12', value: 1012500 }
      ],
      roi: 35,
      term: '36 meses',
      nextPayment: '2024-02-15',
      risk: 'Moderado',
      category: 'Renda Fixa Internacional'
    },
    {
      partner: 'Fictor',
      initialAmount: 600000,
      currentAmount: 900000,
      startDate: '2023-05-20',
      returns: [
        { date: '2023-07', value: 660000 },
        { date: '2023-08', value: 720000 },
        { date: '2023-09', value: 780000 },
        { date: '2023-10', value: 840000 },
        { date: '2023-11', value: 870000 },
        { date: '2023-12', value: 900000 }
      ],
      roi: 50,
      term: '48 meses',
      nextPayment: '2024-02-20',
      risk: 'Alto',
      category: 'Private Equity'
    },
    // Adicionar Hurst
    {
      partner: 'Hurst',
      initialAmount: 500000,
      currentAmount: 800000,
      startDate: '2023-08-01',
      returns: [
        { date: '2023-09', value: 575000 },
        { date: '2023-10', value: 650000 },
        { date: '2023-11', value: 725000 },
        { date: '2023-12', value: 800000 }
      ],
      roi: 60,
      term: '36 meses',
      nextPayment: '2024-02-10',
      risk: 'Alto',
      category: 'Ativos Alternativos'
    },
    // Adicionar Ademicon
    {
      partner: 'Ademicon',
      initialAmount: 450000,
      currentAmount: 540000,
      startDate: '2023-07-15',
      returns: [
        { date: '2023-08', value: 465000 },
        { date: '2023-09', value: 480000 },
        { date: '2023-10', value: 495000 },
        { date: '2023-11', value: 515000 },
        { date: '2023-12', value: 540000 }
      ],
      roi: 20,
      term: '60 meses',
      nextPayment: '2024-02-15',
      risk: 'Moderado',
      category: 'Consórcios Estruturados'
    },
    // Novo investimento XP
    {
      partner: 'XP Investimentos',
      initialAmount: 800000,
      currentAmount: 1120000,
      startDate: '2023-07-01',
      returns: [
        { date: '2023-08', value: 880000 },
        { date: '2023-09', value: 960000 },
        { date: '2023-10', value: 1040000 },
        { date: '2023-11', value: 1080000 },
        { date: '2023-12', value: 1120000 }
      ],
      roi: 40,
      term: '24 meses',
      nextPayment: '2024-02-01',
      risk: 'Moderado',
      category: 'Fundos de Investimento'
    }
  ];

  let selectedInvestments = investments.map(inv => inv.partner); // Inicialmente todos selecionados

  let partnerships = [
    {
      name: 'Dominion',
      logo: '/images/partners/adominion-logo.png',
      description: 'Soluções de investimento global com foco em gestão de patrimônio.',
      highlight: 'Mais de 40 anos de experiência em mercados internacionais',
      url: 'https://dominion-cs.com/pt'
    },
    {
      name: 'Fictor',
      logo: '/images/partners/fictor-logo.jpg',
      description: 'Holding de participações especializada em gestão empresarial.',
      highlight: 'R$ 2Bi em faturamento em 2023',
      url: 'https://fictor.com.br'
    },
    {
      name: 'Hurst',
      logo: '/images/partners/hurst-logo.png',
      description: 'Plataforma líder em ativos alternativos na América Latina.',
      highlight: 'Rendimentos acima de 21.1% ao ano',
      url: 'https://hurst.capital'
    },
    {
      name: 'Ademicon',
      logo: '/images/partners/ademicon-logo.png',
      description: 'Maior administradora independente de consórcio do Brasil.',
      highlight: 'Mais de R$ 120.9Bi em créditos comercializados',
      url: 'https://ademicon.com.br'
    },
    {
      name: 'XP Investimentos',
      logo: '/images/partners/xp-logo.png',
      description: 'Maior plataforma de investimentos do Brasil, oferecendo uma ampla gama de produtos financeiros.',
      highlight: 'Mais de R$ 1 Trilhão sob custódia',
      url: 'https://xp.com.br'
    }
  ];

  // Função para agregar os dados dos investimentos selecionados
  function getAggregatedData() {
    // Pegar todas as datas únicas
    const allDates = [...new Set(investments.flatMap(inv => inv.returns.map(r => r.date)))].sort();
    
    // Criar um único array de dados somando os valores dos investimentos selecionados
    const aggregatedData = allDates.map(date => {
      const sum = selectedInvestments.reduce((total, partnerName) => {
        const investment = investments.find(inv => inv.partner === partnerName);
        const returnData = investment?.returns.find(r => r.date === date);
        return total + (returnData?.value || 0);
      }, 0);
      return sum;
    });

    // Retornar uma única série com os dados agregados
    return {
      dates: allDates,
      series: [{
        name: `Total Investido (${selectedInvestments.length} parceiros)`,
        data: aggregatedData
      }]
    };
  }

  // Função para alternar seleção de investimento
  function toggleInvestmentSelection(partnerName: string) {
    if (selectedInvestments.includes(partnerName)) {
      selectedInvestments = selectedInvestments.filter(p => p !== partnerName);
    } else {
      selectedInvestments = [...selectedInvestments, partnerName];
    }
  }

  // Observar mudanças na aba ativa
  $: if (activeTab === 'dashboard' && browser && !loadingCharts) {
    if (!initialized) {
      initializeCharts();
    }
  }

  // Observar mudanças na seleção de investimentos
  $: if (selectedInvestments && browser && activeTab === 'dashboard') {
    if (selectedInvestments.length > 0) {
      initialized = false; // Forçar reinicialização
      initializeCharts();
    }
  }

  // Função para inicializar os gráficos
  function initializeCharts() {
    if (!browser || !investments.length || !selectedInvestments.length) return;
    
    loadingCharts = true;
    charts.forEach(chart => chart.destroy());
    charts = [];

    // Pequeno delay para garantir que o elemento existe no DOM
    setTimeout(() => {
      const element = document.querySelector('#aggregated-chart');
      if (!element) return;

      const { dates, series } = getAggregatedData();
      
      const options = {
        series,
        chart: {
          type: 'area',
          height: 400,
          toolbar: {
            show: false
          },
          animations: {
            enabled: true
          },
          background: 'transparent',
        },
        grid: {
          show: true,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          strokeDashArray: 3,
          position: 'back',
          xaxis: {
            lines: {
              show: true,
              opacity: 0.1
            }
          },
          yaxis: {
            lines: {
              show: true,
              opacity: 0.1
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [0, 100],
            colorStops: [
              {
                offset: 0,
                color: '#22c55e',
                opacity: 0.4
              },
              {
                offset: 100,
                color: '#22c55e',
                opacity: 0.1
              }
            ]
          }
        },
        theme: {
          mode: 'dark',
          palette: 'palette1'
        },
        colors: ['#22c55e'],
        xaxis: {
          categories: dates,
          labels: {
            show: true,
            style: {
              colors: 'rgba(255, 255, 255, 0.6)'
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            show: true,
            formatter: (value: number) => formatCurrency(value),
            style: {
              colors: 'rgba(255, 255, 255, 0.6)'
            }
          }
        },
        tooltip: {
          theme: 'dark',
          y: {
            formatter: (value: number) => formatCurrency(value)
          },
          x: {
            show: true
          },
          custom: ({ series, seriesIndex, dataPointIndex, w }: {
            series: number[][],
            seriesIndex: number,
            dataPointIndex: number,
            w: any
          }) => {
            const date = w.globals.categoryLabels[dataPointIndex];
            const value = series[seriesIndex][dataPointIndex];
            const parceiros = selectedInvestments.map(partner => {
              const inv = investments.find(i => i.partner === partner);
              if (!inv) return { name: partner, value: 0 };
              
              const returnData = inv.returns.find(r => r.date === date);
              return {
                name: partner,
                value: returnData?.value || 0
              };
            });

            return `
              <div class="p-3 bg-gray-900 rounded-lg shadow-lg">
                <div class="font-bold text-white mb-2">${date}</div>
                <div class="text-green-400 font-bold mb-2">${formatCurrency(value)}</div>
                <div class="text-xs text-gray-400">Composição:</div>
                ${parceiros.map(p => `
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-300">${p.name}:</span>
                    <span class="text-green-400 ml-4">${formatCurrency(p.value)}</span>
                  </div>
                `).join('')}
              </div>
            `;
          }
        }
      };

      try {
        const chart = new ApexCharts(element, options);
        chart.render();
        charts.push(chart);
        initialized = true;
      } catch (error) {
        console.error('Erro ao renderizar gráfico:', error);
      }
      loadingCharts = false;
    }, 100);
  }

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        goto('/login');
      } else {
        user = currentUser;
        loading = false;
        if (!initialized) {
          initializeCharts();
        }
      }
    });

    return () => {
      // Limpa os gráficos quando o componente é destruído
      charts.forEach(chart => chart.destroy());
      charts = [];
      initialized = false;
      unsubscribe();
    };
  });

  async function handleLogout() {
    try {
      await auth.signOut();
      goto('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  function toggleProfileModal() {
    showProfileModal = !showProfileModal;
  }

  async function updateProfile(event: Event) {
    event.preventDefault();
    // Implementar atualização do perfil
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  function calculateTotalInvestment() {
    return investments.reduce((total, inv) => total + inv.currentAmount, 0);
  }

  function calculateTotalReturn() {
    return investments.reduce((total, inv) => total + (inv.currentAmount - inv.initialAmount), 0);
  }

  // Função para obter URL da imagem com fallback
  function getPartnerLogo(partnerName: string): string {
    const logoMap: Record<string, string> = {
      'Dominion': 'adominion-logo.png',
      'Fictor': 'fictor-logo.jpg',
      'Hurst': 'hurst-logo.png',
      'Ademicon': 'ademicon-logo.png',
      'XP Investimentos': 'xp-logo.png'
    };
    return `/images/partners/${logoMap[partnerName]}`;
  }

  // Controle de abas
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'partners', name: 'Parceiros', icon: '🤝' },
    { id: 'suggestions', name: 'Sugestões', icon: '💡' }
  ];

  // Dados para sugestões de Orion
  let suggestions = [
    {
      title: 'Oportunidade em Renda Fixa Internacional',
      partner: 'Dominion',
      expectedReturn: 18.5,
      risk: 'Moderado',
      minimumInvestment: 500000,
      description: 'Carteira diversificada em bonds corporativos americanos com hedge cambial.',
      deadline: '2024-03-15',
      orionComment: 'Esta oportunidade apresenta uma excelente relação risco-retorno considerando o cenário macroeconômico atual.'
    },
    {
      title: 'Fundo de Private Equity - Tecnologia',
      partner: 'Fictor',
      expectedReturn: 25,
      risk: 'Alto',
      minimumInvestment: 1000000,
      description: 'Investimento em empresas de tecnologia em estágio de crescimento.',
      deadline: '2024-02-28',
      orionComment: 'O setor de tecnologia mostra forte potencial de valorização nos próximos anos.'
    }
  ];

  // Adicionar tipos para os formatters
  function formatCurrencyValue(value: number): string {
    return formatCurrency(value);
  }
</script>

{#if loading}
  <div class="min-h-screen bg-black flex items-center justify-center">
    <div class="text-white text-center">
      <div class="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
      <p>Carregando...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-black text-white overflow-auto">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <!-- Navegação das abas -->
      <div class="bg-black/80 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <nav class="flex space-x-8 overflow-x-auto scrollbar-none border-b border-white/10">
          {#each tabs as tab}
            <button
              class="px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                {activeTab === tab.id 
                  ? 'border-green-500 text-green-500' 
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}"
              on:click={() => activeTab = tab.id}
            >
              <span class="flex items-center space-x-2">
                <span class="text-xl">{tab.icon}</span>
                <span>{tab.name}</span>
              </span>
            </button>
          {/each}
        </nav>
      </div>

      <!-- Conteúdo das abas -->
      {#if activeTab === 'dashboard'}
        <div class="space-y-8">
          <!-- Cards de resumo em grid responsivo -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="col-span-2 lg:col-span-1 bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 class="text-gray-400 text-sm mb-2">Capital Total Investido</h3>
              <p class="text-3xl font-bold">{formatCurrency(calculateTotalInvestment())}</p>
              <div class="mt-2 text-sm text-gray-400">
                {investments.length} investimentos ativos
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 class="text-gray-400 text-sm mb-2">Retorno Total</h3>
              <p class="text-3xl font-bold text-green-500">
                +{formatCurrency(calculateTotalReturn())}
              </p>
              <div class="mt-2 text-sm text-green-400">
                +{((calculateTotalReturn() / (calculateTotalInvestment() - calculateTotalReturn())) * 100).toFixed(1)}% total
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 class="text-gray-400 text-sm mb-2">Próximo Pagamento</h3>
              <p class="text-3xl font-bold">{formatDate(investments[0].nextPayment)}</p>
              <div class="mt-2 text-sm text-blue-400">
                Em {Math.ceil((new Date(investments[0].nextPayment).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 class="text-gray-400 text-sm mb-2">Performance Média</h3>
              <p class="text-3xl font-bold text-purple-400">
                {(investments.reduce((total, inv) => total + inv.roi, 0) / investments.length).toFixed(1)}%
              </p>
              <div class="mt-2 text-sm text-purple-400">
                ROI médio anual
              </div>
            </div>
          </div>

          <!-- Detalhes dos Investimentos -->
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold">Detalhes dos Investimentos</h2>
              <div class="flex space-x-2">
                <button class="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  Filtrar
                </button>
                <button class="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  Ordenar
                </button>
              </div>
            </div>

            <!-- Filtros de investimentos -->
            <div class="flex flex-wrap gap-3">
              {#each investments as investment}
                <button
                  class="px-4 py-2 rounded-lg transition-colors {selectedInvestments.includes(investment.partner) 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/5 text-gray-400 border border-white/10'}"
                  on:click={() => toggleInvestmentSelection(investment.partner)}
                >
                  <div class="flex items-center space-x-2">
                    <div class="relative group">
                      <div class="w-6 h-6 rounded-full overflow-hidden border {selectedInvestments.includes(investment.partner) 
                        ? 'border-green-500/30' 
                        : 'border-white/10'}">
                        <img 
                          src={getPartnerLogo(investment.partner)}
                          alt={investment.partner}
                          class="w-full h-full object-cover"
                        >
                      </div>
                    </div>
                    <span>{investment.partner}</span>
                  </div>
                </button>
              {/each}
            </div>

            <!-- Adicione um botão para selecionar/deselecionar todos -->
            <div class="mt-2">
              <button
                class="text-sm text-gray-400 hover:text-white transition-colors"
                on:click={() => {
                  if (selectedInvestments.length === investments.length) {
                    selectedInvestments = [];
                  } else {
                    selectedInvestments = investments.map(inv => inv.partner);
                  }
                }}
              >
                {selectedInvestments.length === investments.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <!-- Gráfico agregado -->
            <div class="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div class="h-[400px] relative">
                <div id="aggregated-chart" class="w-full h-full">
                  {#if loadingCharts}
                    <div class="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div class="text-center">
                        <svg class="animate-spin h-6 w-6 text-green-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-gray-500 text-sm">Carregando gráfico...</span>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Cards de investimentos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {#each investments as investment}
                <div class="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                  <!-- Cabeçalho do card -->
                  <div class="p-6 border-b border-white/5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-6">
                        <!-- Logo redesenhado -->
                        <div class="relative group">
                          <div class="absolute -inset-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 -z-10"></div>
                          <div class="relative w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-full border border-white/10 shadow-lg transform group-hover:scale-105 transition-all duration-300 overflow-hidden">
                            <img 
                              src={getPartnerLogo(investment.partner)}
                              alt={investment.partner}
                              class="w-full h-full object-cover"
                            >
                          </div>
                        </div>
                        <div>
                          <h3 class="text-xl font-semibold">{investment.partner}</h3>
                          <div class="flex items-center space-x-2">
                            <p class="text-sm text-gray-400">{investment.category}</p>
                            <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <p class="text-sm text-gray-400">Ativo</p>
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="bg-green-500/10 px-4 py-2 rounded-lg">
                          <p class="text-2xl font-bold text-green-500">+{investment.roi}%</p>
                          <p class="text-sm text-green-400">Retorno</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Corpo do card -->
                  <div class="p-6 space-y-6">
                    <!-- Informações em grid -->
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-white/5 rounded-lg p-4">
                        <p class="text-sm text-gray-400">Investimento Inicial</p>
                        <p class="text-lg font-semibold">{formatCurrency(investment.initialAmount)}</p>
                      </div>
                      <div class="bg-white/5 rounded-lg p-4">
                        <p class="text-sm text-gray-400">Valor Atual</p>
                        <p class="text-lg font-semibold">{formatCurrency(investment.currentAmount)}</p>
                      </div>
                    </div>

                    <!-- Informações adicionais -->
                    <div class="flex items-center justify-between text-sm">
                      <div class="space-y-2">
                        <div class="text-gray-400">
                          Início: <span class="text-white">{formatDate(investment.startDate)}</span>
                        </div>
                        <div class="text-gray-400">
                          Prazo: <span class="text-white">{investment.term}</span>
                        </div>
                      </div>
                      <div class="space-y-2 text-right">
                        <div class="text-gray-400">
                          Risco: <span class={investment.risk === 'Alto' ? 'text-red-400' : 'text-yellow-400'}>
                            {investment.risk}
                          </span>
                        </div>
                        <div class="text-gray-400">
                          Próximo Pagamento: <span class="text-white">{formatDate(investment.nextPayment)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else if activeTab === 'partners'}
        <div class="space-y-8">
          <h2 class="text-2xl font-bold">Nossos Parceiros</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each partnerships as partner}
              <div class="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <div class="flex items-start space-x-6">
                  <!-- Logo atualizado para ser redondo -->
                  <div class="relative group">
                    <div class="absolute -inset-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 -z-10"></div>
                    <div class="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-black rounded-full border border-white/10 shadow-lg transform group-hover:scale-105 transition-all duration-300 overflow-hidden">
                      <img 
                        src={partner.logo} 
                        alt={partner.name}
                        class="w-full h-full object-cover"
                      >
                    </div>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-xl font-semibold mb-2">{partner.name}</h3>
                    <p class="text-gray-400 mb-4">{partner.description}</p>
                    <div class="bg-white/5 rounded-lg p-4">
                      <p class="text-sm text-blue-400">{partner.highlight}</p>
                    </div>
                    <a 
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Visitar site <span class="ml-2">→</span>
                    </a>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'suggestions'}
        <div class="space-y-8">
          <h2 class="text-2xl font-bold">Sugestões de Investimento</h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {#each suggestions as suggestion}
              <div class="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-semibold">{suggestion.title}</h3>
                  <span class="text-sm px-3 py-1 rounded-full bg-green-500/10 text-green-500">
                    {suggestion.partner}
                  </span>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p class="text-sm text-gray-400">Retorno Esperado</p>
                    <p class="text-lg font-semibold text-green-500">+{suggestion.expectedReturn}%</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-400">Risco</p>
                    <p class="text-lg font-semibold {suggestion.risk === 'Alto' ? 'text-red-400' : 'text-yellow-400'}">
                      {suggestion.risk}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-400">Investimento Mínimo</p>
                    <p class="text-lg font-semibold">{formatCurrency(suggestion.minimumInvestment)}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-400">Prazo Final</p>
                    <p class="text-lg font-semibold">{formatDate(suggestion.deadline)}</p>
                  </div>
                </div>

                <p class="text-gray-400 mb-6">{suggestion.description}</p>

                <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div class="flex items-start space-x-3">
                    <span class="text-2xl">🤖</span>
                    <div>
                      <p class="text-sm font-medium text-blue-400 mb-1">Análise de Orion</p>
                      <p class="text-sm text-gray-300">{suggestion.orionComment}</p>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </main>

    <!-- Modal de Perfil -->
    {#if showProfileModal}
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-black/90 border border-white/10 rounded-lg p-8 max-w-md w-full">
          <h2 class="text-xl font-bold mb-6">Editar Perfil</h2>
          <form on:submit|preventDefault={updateProfile} class="space-y-4">
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-300">Nome</label>
              <input
                id="displayName"
                type="text"
                class="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white"
                value={user?.displayName || ''}
              >
            </div>
            <div>
              <label for="userEmail" class="block text-sm font-medium text-gray-300">Email</label>
              <input
                id="userEmail"
                type="email"
                class="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white"
                value={user?.email}
                disabled
              >
            </div>
            <div class="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                on:click={toggleProfileModal}
                class="px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Manter apenas os estilos que estão sendo usados */
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
</style> 