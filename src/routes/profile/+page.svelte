<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/firebase';
  import { goto } from '$app/navigation';
  import ApexCharts from 'apexcharts';
  import { browser } from '$app/environment';
  import type { User } from 'firebase/auth';
  import { investmentLevels } from '$lib/types/profile';
  import type { InvestmentLevel } from '$lib/types/profile';
  import { user } from '$lib/stores/auth';
  import AstronomicalLevel from '$lib/components/AstronomicalLevel.svelte';
  import { profile } from '$lib/stores/profile';
  import UnifiedLayout from '$lib/components/UnifiedLayout.svelte';
  import GravityCard from '$lib/components/GravityCard.svelte';
  import { hasSignedLatestTerms, getTermsSignature } from '$lib/firebase/terms';

  let loading = true;
  let charts: ApexCharts[] = [];
  let currentValue = 750000; // Exemplo - isso viria do banco de dados
  let currentLevel: InvestmentLevel;
  let nextLevel: InvestmentLevel;
  let progress = 0;
  let showOnboardingButton = false;
  let showTermsButton = false;
  let activeSection = 'profile';
  
  // Define se usamos o tema claro ou escuro (false = escuro)
  let lightMode = false;
  
  // Cor de destaque da aplicação
  const accentColor = '#3b82f6'; // Azul

  interface Nivel {
    valor: number;
    nome: string;
    icon: string;
    cor: string;
    desc: string;
    distancia: string;
    velocidade: string;
  }

  const META = 10000000; // 10MM
  const niveis: Nivel[] = [
    { 
      valor: 100000, 
      nome: 'Órbita Terrestre', 
      icon: '🛰️', 
      cor: '#22c55e',
      desc: 'Primeira missão espacial iniciada',
      distancia: '400 km da Terra',
      velocidade: '27.000 km/h'
    },
    { 
      valor: 500000, 
      nome: 'Estação Lunar', 
      icon: '🌙', 
      cor: '#3b82f6',
      desc: 'Base estabelecida na Lua',
      distancia: '384.400 km da Terra',
      velocidade: '40.000 km/h'
    },
    { 
      valor: 1000000, 
      nome: 'Colonizador de Marte', 
      icon: '🔴', 
      cor: '#ef4444',
      desc: 'Conquista do Planeta Vermelho',
      distancia: '225M km da Terra',
      velocidade: '100.000 km/h'
    },
    { 
      valor: 5000000, 
      nome: 'Explorador de Júpiter', 
      icon: '🌟', 
      cor: '#8b5cf6',
      desc: 'Dominando o Sistema Solar',
      distancia: '778M km da Terra',
      velocidade: '250.000 km/h'
    },
    { 
      valor: 10000000, 
      nome: 'Viajante Interestelar', 
      icon: '🌌', 
      cor: '#f59e0b',
      desc: 'Além dos limites conhecidos',
      distancia: '4.2 anos-luz',
      velocidade: '500.000 km/h'
    }
  ];

  // Dados fictícios do progresso do usuário
  let historicoInvestimentos = [
    { data: '2023-06', valor: 50000 },
    { data: '2023-07', valor: 75000 },
    { data: '2023-08', valor: 120000 },
    { data: '2023-09', valor: 180000 },
    { data: '2023-10', valor: 250000 },
    { data: '2023-11', valor: 350000 },
    { data: '2023-12', valor: 450000 },
    { data: '2024-01', valor: 600000 },
    { data: '2024-02', valor: 680000 },
    { data: '2024-03', valor: 750000 }
  ];

  function getNivelAtual(valor: number): Nivel {
    for (let i = niveis.length - 1; i >= 0; i--) {
      if (valor >= niveis[i].valor) return niveis[i];
    }
    return {
      valor: 0,
      nome: 'Iniciante',
      icon: '🌱',
      cor: '#22c55e',
      desc: 'Começando a jornada',
      distancia: '0 km da Terra',
      velocidade: '0 km/h'
    };
  }

  function getProximoNivel(valor: number): Nivel {
    for (let nivel of niveis) {
      if (valor < nivel.valor) return nivel;
    }
    return niveis[niveis.length - 1];
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function initializeCharts() {
    if (!browser) return;
    
    // Aguarda o elemento estar disponível no DOM
    setTimeout(() => {
      const element = document.querySelector('#progress-chart');
      if (!element) return;

      const options = {
        series: [{
          name: 'Patrimônio',
          data: historicoInvestimentos.map(h => h.valor)
        }],
        chart: {
          type: 'area',
          height: 350,
          toolbar: { show: false },
          animations: { enabled: true },
          background: 'transparent',
          fontFamily: 'inherit'
        },
        colors: [accentColor], // Usa a cor do tema
        stroke: {
          curve: 'smooth',
          width: 2,
          colors: [accentColor]
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
                color: accentColor,
                opacity: 0.4
              },
              {
                offset: 100,
                color: accentColor,
                opacity: 0.1
              }
            ]
          }
        },
        grid: {
          borderColor: lightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          strokeDashArray: 4,
          xaxis: {
            lines: { show: true }
          }
        },
        xaxis: {
          categories: historicoInvestimentos.map(h => h.data),
          labels: {
            style: { 
              colors: lightMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              fontFamily: 'inherit'
            }
          },
          axisBorder: {
            color: lightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
          },
          axisTicks: {
            color: lightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
          }
        },
        yaxis: {
          labels: {
            formatter: (value: number) => formatCurrency(value),
            style: { 
              colors: lightMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              fontFamily: 'inherit'
            }
          }
        },
        theme: { mode: lightMode ? 'light' : 'dark' },
        tooltip: {
          theme: lightMode ? 'light' : 'dark',
          y: {
            formatter: (value: number) => formatCurrency(value)
          }
        }
      };

      if (charts.length === 0) {
        const chart = new ApexCharts(element, options);
        chart.render();
        charts.push(chart);
      }
    }, 100);
  }

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        goto('/login');
      } else {
        loading = false;
        initializeCharts();
      }
    });

    return () => {
      charts.forEach(chart => chart.destroy());
      charts = [];
      unsubscribe();
    };
  });

  $: {
    currentLevel = investmentLevels.find(
      level => currentValue >= level.minValue && 
      (level.maxValue === null || currentValue < level.maxValue)
    ) || investmentLevels[0];

    nextLevel = investmentLevels[investmentLevels.indexOf(currentLevel) + 1];

    if (nextLevel) {
      progress = ((currentValue - currentLevel.minValue) / 
        (nextLevel.minValue - currentLevel.minValue)) * 100;
    } else {
      progress = 100;
    }
  }

  let termsStatus = {
    accepted: false,
    version: '',
    date: null as Date | null,
    loading: true
  };

  onMount(async () => {
    // Verificar status dos termos no Firebase
    if (auth.currentUser) {
      try {
        // Verifica se assinou a versão mais recente dos termos
        const hasSigned = await hasSignedLatestTerms(auth.currentUser);
        
        // Busca a assinatura mais recente para exibir detalhes
        const latestVersion = '2025.03.20'; // Versão mais recente dos termos
        const signature = await getTermsSignature(auth.currentUser, latestVersion);
        
        if (signature) {
          termsStatus = {
            accepted: true,
            version: signature.version,
            date: signature.signedAt.toDate(),
            loading: false
          };
        } else {
          termsStatus = {
            accepted: false,
            version: '',
            date: null,
            loading: false
          };
        }
      } catch (error) {
        console.error('Erro ao verificar status dos termos:', error);
        termsStatus.loading = false;
      }
    }

    // Verificar cookies
    const termsAccepted = document.cookie.includes('terms_accepted=true');
    const onboardingCompleted = document.cookie.includes('onboarding_completed=true');
    const termsAcceptanceDate = document.cookie.includes('terms_acceptance_date') 
        ? new Date(decodeURIComponent(document.cookie.split('terms_acceptance_date=')[1]?.split(';')[0] || '')).toLocaleDateString('pt-BR')
        : null;

    showTermsButton = termsAccepted;
    showOnboardingButton = onboardingCompleted;

    // Simular um valor para teste (remover em produção)
    profile.updateAmount(100000);
  });

  function handleViewTerms() {
    goto('/terms-history');
  }

  function handleRedoOnboarding() {
    goto('/onboarding');
  }
  
  function handleGoToTerms() {
    goto('/terms/2025-03-20');
  }
</script>

<UnifiedLayout {activeSection} {lightMode} {accentColor}>
  <div class="container mx-auto p-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Coluna 1: Informações do usuário -->
      <div class="space-y-6">
        <!-- Card de Perfil -->
        <GravityCard
          title="Perfil do Investidor"
          {lightMode}
          {accentColor}
        >
          <div class="flex items-center mb-6">
            <div class="w-24 h-24 rounded-full flex items-center justify-center text-4xl" 
                 style:background-color={`${accentColor}20`}
                 style:color={accentColor}>
              {$profile?.currentLevel?.icon || '👤'}
            </div>
            <div class="ml-4">
              <h3 class="text-xl font-bold">{$profile?.currentLevel?.name || 'Investidor'}</h3>
              <p class={lightMode ? "text-black/60" : "text-white/60"}>
                {formatCurrency($profile?.currentAmount || 750000)}
              </p>
            </div>
          </div>
          
          <!-- Progresso para o próximo nível -->
          {#if $profile?.nextLevel}
            <div class="space-y-2 mb-6">
              <div class="flex justify-between text-sm">
                <span class={lightMode ? "text-black/60" : "text-white/60"}>Próximo Nível:</span>
                <span style:color={accentColor}>{$profile.nextLevel.name}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class={lightMode ? "text-black/60" : "text-white/60"}>Faltam:</span>
                <span>{formatCurrency(($profile.nextLevel.minValue - $profile.currentAmount))}</span>
              </div>
              <div class="h-2 rounded-full overflow-hidden" 
                   style:background-color={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}>
                <div class="h-full transition-all duration-1000"
                     style:background-color={accentColor}
                     style:width={`${$profile.progressToNext}%`}>
                </div>
              </div>
              <div class="text-xs text-right" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                {formatPercentage($profile.progressToNext)}
              </div>
            </div>
          {/if}
          
          <!-- Informações adicionais -->
          <div class="space-y-3 pt-4 border-t" 
               style:border-color={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}>
            <div class="flex justify-between">
              <span class={lightMode ? "text-black/60" : "text-white/60"}>Data de registro</span>
              <span>01/06/2023</span>
            </div>
            <div class="flex justify-between">
              <span class={lightMode ? "text-black/60" : "text-white/60"}>Estratégia</span>
              <span>Crescimento</span>
            </div>
            <div class="flex justify-between">
              <span class={lightMode ? "text-black/60" : "text-white/60"}>Perfil de risco</span>
              <span class="text-amber-500">Moderado</span>
            </div>
          </div>
        </GravityCard>
        
        <!-- Card de Níveis -->
        <GravityCard
          title="Escala de Níveis"
          {lightMode}
          {accentColor}
        >
          <div class="space-y-4">
            {#each investmentLevels as level, i}
              <div class="flex items-center p-3 rounded-lg transition-colors" 
                   style:background-color={$profile?.currentLevel?.name === level.name 
                     ? `${accentColor}20` 
                     : (lightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}
                   style:border-left={$profile?.currentLevel?.name === level.name 
                     ? `3px solid ${accentColor}` 
                     : 'none'}>
                <div class="text-3xl mr-3">{level.icon}</div>
                <div>
                  <div class="font-medium">{level.name}</div>
                  <div class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                    {i === investmentLevels.length - 1 
                      ? `Acima de ${formatCurrency(level.minValue)}` 
                      : `${formatCurrency(level.minValue)} - ${formatCurrency(level.maxValue || 0)}`}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </GravityCard>
        
        <!-- Card de Termos de Serviço -->
        <GravityCard
          title="Termos de Serviço"
          {lightMode}
          {accentColor}
        >
          {#if termsStatus.loading}
            <div class="flex justify-center py-4">
              <div class="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            </div>
          {:else if termsStatus.accepted}
            <div class="flex items-start mb-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/20 text-green-500 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="font-medium">Termos aceitos</p>
                <p class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                  Versão {termsStatus.version} aceita em {termsStatus.date ? termsStatus.date.toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
            </div>
            <button
              on:click={handleViewTerms}
              class="w-full px-4 py-2 rounded-lg text-center transition-colors"
              style:background-color={`${accentColor}20`}
              style:color={accentColor}
              style:border={`1px solid ${accentColor}40`}
            >
              Ver histórico dos termos
            </button>
          {:else}
            <div class="flex items-start mb-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500/20 text-yellow-500 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p class="font-medium">Termos pendentes</p>
                <p class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                  É necessário aceitar os novos termos de serviço
                </p>
              </div>
            </div>
            <button
              on:click={handleGoToTerms}
              class="w-full px-4 py-2 rounded-lg text-white text-center transition-colors"
              style:background-color={accentColor}
            >
              Revisar e aceitar termos
            </button>
          {/if}
        </GravityCard>
      </div>
      
      <!-- Coluna 2 e 3: Gráficos e Estatísticas -->
      <div class="col-span-2 space-y-6">
        <!-- Evolução do Patrimônio -->
        <GravityCard
          title="Evolução do Patrimônio"
          {lightMode}
          {accentColor}
        >
          <div id="progress-chart" class="h-80"></div>
        </GravityCard>
        
        <!-- Estatísticas -->
        <div class="grid grid-cols-3 gap-6">
          <GravityCard
            {lightMode}
            {accentColor}
          >
            <div class="text-center">
              <div class="text-3xl mb-2" style:color={accentColor}>+15.2%</div>
              <div class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                Rentabilidade total
              </div>
            </div>
          </GravityCard>
          
          <GravityCard
            {lightMode}
            {accentColor}
          >
            <div class="text-center">
              <div class="text-3xl mb-2" style:color={accentColor}>42</div>
              <div class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                Ativos na carteira
              </div>
            </div>
          </GravityCard>
          
          <GravityCard
            {lightMode}
            {accentColor}
          >
            <div class="text-center">
              <div class="text-3xl mb-2" style:color={accentColor}>7</div>
              <div class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.6">
                Meses de atividade
              </div>
            </div>
          </GravityCard>
        </div>
        
        <!-- Metas -->
        <GravityCard
          title="Metas Anuais"
          {lightMode}
          {accentColor}
        >
          <div class="space-y-6">
            <div>
              <div class="flex justify-between mb-2">
                <div>
                  <span class="font-medium">Meta de Patrimônio</span>
                </div>
                <div>
                  <span class={lightMode ? "text-black/60" : "text-white/60"}>65%</span>
                  <span class="mx-2">•</span>
                  <span>{formatCurrency(750000)} / {formatCurrency(1200000)}</span>
                </div>
              </div>
              <div class="h-2 rounded-full overflow-hidden" 
                   style:background-color={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}>
                <div class="h-full" style:background-color={accentColor} style:width="65%"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between mb-2">
                <div>
                  <span class="font-medium">Meta de Rentabilidade</span>
                </div>
                <div>
                  <span class={lightMode ? "text-black/60" : "text-white/60"}>80%</span>
                  <span class="mx-2">•</span>
                  <span>12% / 15%</span>
                </div>
              </div>
              <div class="h-2 rounded-full overflow-hidden" 
                   style:background-color={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}>
                <div class="h-full" style:background-color={accentColor} style:width="80%"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between mb-2">
                <div>
                  <span class="font-medium">Meta de Diversificação</span>
                </div>
                <div>
                  <span class={lightMode ? "text-black/60" : "text-white/60"}>90%</span>
                  <span class="mx-2">•</span>
                  <span>9 / 10 classes de ativos</span>
                </div>
              </div>
              <div class="h-2 rounded-full overflow-hidden" 
                   style:background-color={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}>
                <div class="h-full" style:background-color={accentColor} style:width="90%"></div>
              </div>
            </div>
          </div>
        </GravityCard>
      </div>
    </div>
  </div>
</UnifiedLayout>

<style>
  .stars {
    background-image: 
      radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.8), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.8), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 50px 160px, rgba(255, 255, 255, 0.8), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 90px 40px, rgba(255, 255, 255, 0.8), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 130px 80px, rgba(255, 255, 255, 0.8), rgba(0,0,0,0)),
      radial-gradient(2px 2px at 160px 120px, rgba(255, 255, 255, 0.8), rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: twinkle 4s infinite;
  }

  @keyframes twinkle {
    0% { opacity: 0.3; }
    50% { opacity: 0.6; }
    100% { opacity: 0.3; }
  }

  :global(body) {
    margin: 0;
    overflow-x: hidden;
    background: black;
  }
</style> 