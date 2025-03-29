<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import UnifiedLayout from '$lib/components/UnifiedLayout.svelte';
    import GravityCard from '$lib/components/GravityCard.svelte';
    import { auth } from '$lib/firebase/config';
    import { getTermsSignature, signTerms } from '$lib/firebase/terms';
    import { updateOnboardingStep, getOnboardingStatus, getNextOnboardingStep, skipOnboardingStep } from '$lib/firebase/onboarding';
    import type { TermsSignature } from '$lib/firebase/terms';
    import type { OnboardingStatus } from '$lib/firebase/onboarding';

    let loading = false;
    let lightMode = false;
    let signature: TermsSignature | null = null;
    let onboardingStatus: OnboardingStatus | null = null;
    const accentColor = '#3b82f6';
    const activeSection = 'terms';
    const version = '2025.03.20';
    const effectiveDate = '20/03/2025';

    function handleBack() {
        goto('/terms-history');
    }

    async function handleAcceptTerms() {
        if (!auth.currentUser) return;

        try {
            loading = true;
            await signTerms(auth.currentUser, version);
            await updateOnboardingStep(auth.currentUser, 'termsAccepted', true);
            signature = await getTermsSignature(auth.currentUser, version);
            onboardingStatus = await getOnboardingStatus(auth.currentUser);

            // Redireciona para o próximo passo do onboarding se necessário
            if (onboardingStatus?.steps.termsAccepted) {
                const nextStep = await getNextOnboardingStep(auth.currentUser);
                if (nextStep) {
                    goto(`/onboarding/${nextStep}`);
                } else {
                    goto('/dashboard');
                }
            }
            
            // Salva também em cookie para fácil acesso
            document.cookie = `terms_accepted=true;path=/;max-age=${60 * 60 * 24 * 365}`;
            document.cookie = `terms_version=${version};path=/;max-age=${60 * 60 * 24 * 365}`;
            document.cookie = `terms_acceptance_date=${new Date().toISOString()};path=/;max-age=${60 * 60 * 24 * 365}`;
            
            // Redireciona para a página principal
            goto('/hub');
        } catch (error) {
            console.error('Erro ao aceitar os termos:', error);
        } finally {
            loading = false;
        }
    }
    
    async function handleSkip() {
        if (!auth.currentUser) return;
        
        try {
            loading = true;
            // Apenas marca como tendo visto os termos, sem assinar
            if (onboardingStatus) {
                await skipOnboardingStep(auth.currentUser, 'termsAccepted');
                goto('/hub');
            } else {
                // Se não estiver no onboarding, volta para a página anterior
                history.back();
            }
        } catch (error) {
            console.error('Erro ao pular os termos:', error);
        } finally {
            loading = false;
        }
    }
    
    function formatDate(date: Date): string {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    onMount(async () => {
        if (!auth.currentUser) {
            goto('/login');
            return;
        }
        
        try {
            // Verifica se o usuário já assinou esta versão dos termos
            signature = await getTermsSignature(auth.currentUser, version);
            onboardingStatus = await getOnboardingStatus(auth.currentUser);
        } catch (error) {
            console.error('Erro ao verificar assinatura:', error);
        }
    });
</script>

<UnifiedLayout {activeSection} {lightMode} {accentColor}>
    <div class="container mx-auto p-6">
        <GravityCard title="Termos de Serviço - Gravity Group" {lightMode} {accentColor}>
            <div class="mb-4 flex justify-between items-center">
                <div class="flex items-center flex-wrap gap-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                        Nova Versão
                    </span>
                    <span class={lightMode ? "text-black/60" : "text-white/60"}>
                        Vigente a partir de: {effectiveDate}
                    </span>
                    {#if signature}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                            Assinado em {formatDate(signature.signedAt.toDate())}
                        </span>
                    {/if}
                </div>
                <button
                    on:click={handleBack}
                    class="px-4 py-2 rounded-lg text-center transition-colors"
                    style:background-color={`${accentColor}20`}
                    style:color={accentColor}
                    style:border={`1px solid ${accentColor}40`}
                >
                    Voltar
                </button>
            </div>

            <div class="terms-content" class:light-mode={lightMode}>
                <h2>TERMOS DE SERVIÇO DA PLATAFORMA GRAVITY GROUP</h2>
                <p class="version-date">Última atualização: {effectiveDate}</p>

                <h3 id="introducao">1. INTRODUÇÃO</h3>
                <p>Bem-vindo aos Termos de Serviço do Gravity Group. Este documento estabelece as regras e diretrizes para o uso de nossa plataforma de gestão de investimentos, serviços relacionados e funcionalidades disponíveis aos usuários.</p>
                <p>A utilização da plataforma implica na aceitação integral destes Termos de Serviço. Caso não concorde com os termos estabelecidos, o usuário não deverá acessar ou utilizar nossos serviços.</p>

                <h3 id="servicos">2. SERVIÇOS OFERECIDOS</h3>
                <p>O Gravity Group oferece uma plataforma inovadora voltada à gestão de investimentos, proporcionando:</p>
                <ul>
                    <li>Análise e monitoramento de investimentos</li>
                    <li>Gestão de carteira personalizada</li>
                    <li>Relatórios detalhados de performance</li>
                    <li>Consultoria especializada para investidores</li>
                    <li>Acesso a oportunidades exclusivas de investimento</li>
                    <li>Intermediação financeira, conforme aplicável e permitido por regulamentações vigentes</li>
                </ul>
                <p>A plataforma tem caráter informativo e operacional, não substituindo consultoria financeira individualizada.</p>

                <h3 id="responsabilidades">3. RESPONSABILIDADES DO USUÁRIO</h3>
                <p>Ao utilizar a plataforma, o usuário concorda em:</p>
                <ul>
                    <li><span class="highlight">Fornecer informações corretas, completas e atualizadas durante o cadastro e uso da plataforma</span></li>
                    <li><span class="highlight">Manter a confidencialidade de suas credenciais de acesso e não compartilhá-las com terceiros</span></li>
                    <li>Utilizar a plataforma dentro dos limites da legislação aplicável e das regulamentações financeiras pertinentes</li>
                    <li>Não praticar atividades que possam comprometer a segurança, integridade ou funcionamento da plataforma</li>
                </ul>
                <p>O Gravity Group se reserva o direito de suspender ou encerrar contas de usuários que violem estes Termos.</p>

                <h3 id="privacidade">4. PRIVACIDADE E SEGURANÇA</h3>
                <p>A privacidade e segurança dos dados dos usuários são prioridades do Gravity Group. Para garantir a proteção das informações:</p>
                <ul>
                    <li><span class="highlight">Utilizamos criptografia de ponta a ponta para dados sensíveis</span></li>
                    <li><span class="highlight">Seguimos todas as diretrizes estabelecidas pela Lei Geral de Proteção de Dados (LGPD)</span></li>
                    <li>Monitoramos continuamente a segurança da plataforma para evitar acessos não autorizados</li>
                </ul>
                <p>Os dados do usuário não serão compartilhados com terceiros sem seu consentimento, exceto em casos exigidos por lei ou reguladores.</p>
                <p>Para aprimorar a experiência e consolidar informações de investimentos, a plataforma pode integrar dados provenientes de instituições financeiras nas quais o usuário possui ativos, sempre mediante autorização prévia.</p>

                <h3 id="riscos">5. RISCOS E LIMITAÇÕES</h3>
                <p>Ao utilizar a plataforma Gravity Group, o usuário deve estar ciente dos seguintes aspectos:</p>
                <ul>
                    <li><span class="highlight">Todo investimento envolve riscos, e rentabilidades passadas não garantem resultados futuros</span></li>
                    <li>Os valores investidos podem sofrer oscilações e até mesmo perdas, dependendo das condições do mercado</li>
                    <li>As informações fornecidas pela plataforma são baseadas em dados disponíveis no momento, sem garantia de exatidão ou atualização em tempo real</li>
                    <li>O usuário é exclusivamente responsável por suas decisões de investimento</li>
                </ul>
                <p>O Gravity Group não se responsabiliza por decisões tomadas com base nas informações apresentadas na plataforma, nem por perdas financeiras decorrentes do uso dos serviços.</p>

                <h3 id="isencoes">6. ISENÇÕES DE RESPONSABILIDADE</h3>
                <p>O usuário reconhece e concorda que:</p>
                <ul>
                    <li>A utilização da plataforma se dá por sua conta e risco</li>
                    <li>O Gravity Group não pode ser responsabilizado por falhas técnicas, interrupções temporárias ou imprecisões nos dados fornecidos</li>
                    <li>A plataforma pode incluir integrações com serviços de terceiros, pelos quais o Gravity Group não se responsabiliza</li>
                    <li>O usuário se compromete a isentar o Gravity Group de qualquer reclamação ou ação legal decorrente do uso da plataforma</li>
                </ul>

                <h3 id="suporte">7. SUPORTE E COMUNICAÇÃO</h3>
                <p>Para garantir um atendimento de qualidade, o Gravity Group disponibiliza os seguintes canais de suporte:</p>
                <ul>
                    <li>Atendimento via chat</li>
                    <li>Suporte por e-mail para questões técnicas e administrativas</li>
                    <li>Consultoria personalizada mediante agendamento</li>
                    <li>Central de ajuda com documentação detalhada sobre a plataforma</li>
                </ul>
                <p>O usuário poderá entrar em contato por meio dos canais disponibilizados na plataforma para esclarecimento de dúvidas ou resolução de problemas técnicos.</p>

                <h3 id="alteracoes">8. ALTERAÇÕES NOS TERMOS E HISTÓRICO DE CONTRATOS</h3>
                <p>8.1. O Gravity Group poderá modificar estes Termos de Serviço a qualquer momento.</p>
                <p>8.2. No momento do login, o usuário será notificado sobre eventuais atualizações e precisará aceitar os novos termos para continuar utilizando a plataforma.</p>
                <p>8.3. A plataforma manterá um registro cronológico das versões dos Termos aceitos pelo usuário, garantindo transparência e rastreabilidade de todas as alterações contratuais.</p>

                <h3 id="disposicoes">9. DISPOSIÇÕES FINAIS</h3>
                <p>9.1. Estes Termos são regidos pelas leis brasileiras. Qualquer litígio será resolvido no foro da comarca de São Paulo/SP.</p>
                <p>9.2. Caso qualquer cláusula destes Termos seja considerada inválida ou inexequível, as demais permanecerão em pleno vigor e efeito.</p>
            </div>

            {#if !signature}
                <div class="mt-6 flex justify-end gap-4">
                    <button
                        on:click={handleSkip}
                        disabled={loading}
                        class="px-6 py-3 rounded-lg text-center transition-colors"
                        style:background-color={`${accentColor}20`}
                        style:color={accentColor}
                        style:border={`1px solid ${accentColor}40`}
                    >
                        {loading ? 'Processando...' : 'Pular'}
                    </button>
                    <button
                        on:click={handleAcceptTerms}
                        disabled={loading}
                        class="px-6 py-3 rounded-lg text-white font-medium transition-colors"
                        style:background-color={accentColor}
                        style:opacity={loading ? "0.7" : "1"}
                    >
                        {loading ? 'Processando...' : 'Aceitar Termos'}
                    </button>
                </div>
            {/if}

            <div class="mt-6 p-4 rounded-lg border" 
                 style:border-color={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
                 style:background-color={lightMode ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.1)"}>
                <div class="flex items-start">
                    <span class="mr-3 mt-1 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style:color={accentColor}>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    <div>
                        <p class="font-medium mb-1" style:color={accentColor}>Nova Versão</p>
                        <p class="text-sm" class:text-black={lightMode} class:text-white={!lightMode} style:opacity="0.7">
                            Esta é a nova versão dos termos de serviço que entrará em vigor em {effectiveDate}. Por favor, leia atentamente as mudanças antes de aceitar.
                        </p>
                    </div>
                </div>
            </div>
        </GravityCard>
    </div>
</UnifiedLayout>

<style>
    .terms-content {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        line-height: 1.7;
    }

    .terms-content.light-mode {
        color: rgba(0, 0, 0, 0.9);
    }

    .terms-content h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: white;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .terms-content.light-mode h2 {
        color: black;
        border-bottom-color: rgba(0, 0, 0, 0.1);
    }

    .terms-content .version-date {
        font-size: 0.9rem;
        color: #3b82f6;
        margin-bottom: 2rem;
        font-style: italic;
    }

    .terms-content h3 {
        font-size: 1.3rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: white;
        position: relative;
        padding-left: 1rem;
    }

    .terms-content.light-mode h3 {
        color: black;
    }

    .terms-content h3::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0.25rem;
        bottom: 0.25rem;
        width: 3px;
        background-color: #3b82f6;
        border-radius: 3px;
    }

    .terms-content p {
        margin-bottom: 1.2rem;
        text-align: justify;
    }

    .terms-content ul {
        list-style-type: none;
        padding-left: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .terms-content li {
        margin-bottom: 0.75rem;
        position: relative;
        padding-left: 1.5rem;
    }

    .terms-content li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: #3b82f6;
        font-weight: bold;
    }

    .terms-content .highlight {
        background-color: rgba(59, 130, 246, 0.15);
        padding: 0.15rem 0.3rem;
        border-radius: 0.25rem;
        font-weight: 500;
    }
</style> 