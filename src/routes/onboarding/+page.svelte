<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import { terms } from '$lib/stores/terms';
	import TermsOfService from '$lib/components/legal/TermsOfService.svelte';
	import { auth } from '$lib/firebase';
	import { updateOnboardingStep, getOnboardingStatus } from '$lib/firebase/onboarding';
	import { signTerms } from '$lib/firebase/terms';

	let currentStep = 1;
	let userName = '';
	let userRole = '';
	let userObjectives: string[] = [];
	let communicationPreferences: string[] = [];
	let loading = false;
	let showLogo = false;
	let termsAccepted = false;
	let showTerms = true;

	interface Option {
		value: string;
		label: string;
		icon: string;
	}

	const roleOptions: Option[] = [
		{ value: 'investor', label: 'Investidor', icon: '💼' },
		{ value: 'advisor', label: 'Assessor', icon: '👨‍💼' },
		{ value: 'both', label: 'Ambos', icon: '🔄' }
	];

	const objectiveOptions: Option[] = [
		{ value: 'manage', label: 'Gerenciar e acompanhar meus investimentos', icon: '📊' },
		{ value: 'learn', label: 'Aprender mais sobre investimentos', icon: '📚' },
		{ value: 'discover', label: 'Descobrir oportunidades financeiras exclusivas', icon: '🔍' },
		{ value: 'connect', label: 'Conectar-me com assessores e investidores', icon: '🤝' },
		{ value: 'other', label: 'Outro', icon: '✨' }
	];

	const communicationOptions: Option[] = [
		{ value: 'email', label: 'E-mail', icon: '📩' },
		{ value: 'whatsapp', label: 'WhatsApp', icon: '📱' },
		{ value: 'platform', label: 'Notificações na plataforma', icon: '🔔' },
		{ value: 'none', label: 'Não desejo receber notificações', icon: '❌' }
	];

	let otherObjective = '';

	const steps = [
		{
			title: 'Termos de Serviço',
			subtitle: 'Por favor, leia e aceite os termos para continuar'
		},
		{
			title: 'Suas Informações',
			subtitle: 'Conte-nos um pouco sobre você'
		},
		{
			title: 'Seus Objetivos',
			subtitle: 'O que você busca em nossa plataforma?'
		},
		{
			title: 'Preferências de Comunicação',
			subtitle: 'Como deseja receber atualizações e insights?'
		},
		{
			title: 'Bem-vindo ao Gravity Group!',
			subtitle: 'Sua jornada começa agora'
		}
	];

	onMount(async () => {
		setTimeout(() => {
			showLogo = true;
		}, 500);

		// Verifica se o usuário está autenticado
		if (!auth.currentUser) {
			goto('/login');
			return;
		}
		
		// Verifica o status atual do onboarding
		if (auth.currentUser) {
			try {
				const status = await getOnboardingStatus(auth.currentUser);
				if (status?.steps.termsAccepted) {
					termsAccepted = true;
					showTerms = false;
				}
			} catch (error) {
				console.error('Erro ao verificar status do onboarding:', error);
			}
		}
	});

	async function handleTermsAccept() {
		if (!auth.currentUser) return;
		
		try {
			loading = true;
			// Salva a assinatura do termo no Firebase
			await signTerms(auth.currentUser, terms.getCurrentVersion());
			// Atualiza o status do onboarding
			await updateOnboardingStep(auth.currentUser, 'termsAccepted', true);
			
			termsAccepted = true;
			showTerms = false;
		} catch (error) {
			console.error('Erro ao aceitar termos:', error);
			alert('Ocorreu um erro ao aceitar os termos. Por favor, tente novamente.');
		} finally {
			loading = false;
		}
	}

	function handleTermsReject() {
		goto('/terms-rejected');
	}

	function toggleObjective(value: string) {
		if (userObjectives.includes(value)) {
			userObjectives = userObjectives.filter(v => v !== value);
		} else {
			// Limite de 2 objetivos
			if (userObjectives.length < 2) {
				userObjectives = [...userObjectives, value];
			}
		}
	}

	function toggleCommunication(value: string) {
		if (value === 'none') {
			// Se escolher 'nenhum', limpar as outras opções
			if (communicationPreferences.includes('none')) {
				communicationPreferences = [];
			} else {
				communicationPreferences = ['none'];
			}
		} else {
			// Se escolher qualquer outra opção, remover 'nenhum' se estiver selecionado
			if (communicationPreferences.includes('none')) {
				communicationPreferences = [value];
			} else {
				if (communicationPreferences.includes(value)) {
					communicationPreferences = communicationPreferences.filter(v => v !== value);
				} else {
					communicationPreferences = [...communicationPreferences, value];
				}
			}
		}
	}

	async function nextStep() {
		if (currentStep < 5) {
			// Validar passo atual antes de avançar
			if (!canProceed()) return;

			if (currentStep === 1) {
				if (!termsAccepted && auth.currentUser) {
					// Aceitar os termos ao avançar caso ainda não estejam aceitos
					try {
						await signTerms(auth.currentUser, terms.getCurrentVersion());
						await updateOnboardingStep(auth.currentUser, 'termsAccepted', true);
					} catch (error) {
						console.error('Erro ao aceitar termos:', error);
					}
				}
				terms.accept();
			}

			if (currentStep === 2 && auth.currentUser) {
				// Atualiza o status do perfil no onboarding
				try {
					await updateOnboardingStep(auth.currentUser, 'profileCompleted', true);
				} catch (error) {
					console.error('Erro ao atualizar perfil:', error);
				}
			}

			if (currentStep === 3 && auth.currentUser) {
				// Atualiza as preferências no onboarding
				try {
					await updateOnboardingStep(auth.currentUser, 'preferencesSet', true);
				} catch (error) {
					console.error('Erro ao atualizar preferências:', error);
				}
			}

			if (currentStep === 4) {
				loading = true;
				if (auth.currentUser) {
					// Marca o tutorial como assistido
					try {
						await updateOnboardingStep(auth.currentUser, 'tutorialWatched', true);
					} catch (error) {
						console.error('Erro ao atualizar tutorial:', error);
					}
				}
				await new Promise(resolve => setTimeout(resolve, 1500)); // Simulação de carregamento
				loading = false;
			}
			currentStep++;
		} else {
			loading = true;
			try {
				const finalObjectives = userObjectives.includes('other') 
					? [...userObjectives.filter(o => o !== 'other'), otherObjective] 
					: userObjectives;

				const response = await fetch('/api/complete-onboarding', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						userName,
						userRole,
						objectives: finalObjectives,
						communicationPreferences
					})
				});

				if (response.ok) {
					// Marcar onboarding como concluído
					document.cookie = `onboarding_completed=true;path=/;max-age=${60 * 60 * 24 * 365}`;
					goto('/hub');
				} else {
					throw new Error('Falha ao salvar dados do onboarding');
				}
			} catch (error) {
				console.error('Erro ao completar onboarding:', error);
				alert('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.');
			} finally {
				loading = false;
			}
		}
	}

	function canProceed(): boolean {
		switch (currentStep) {
			case 1:
				return termsAccepted;
			case 2:
				return userName.length >= 2 && userRole !== '';
			case 3:
				return userObjectives.length > 0 && 
					(userObjectives.includes('other') ? otherObjective.trim().length > 0 : true);
			case 4:
				return communicationPreferences.length > 0;
			case 5:
				return true;
			default:
				return false;
		}
	}

	function getWelcomeMessage(): string {
		if (userRole === 'advisor') {
			return `Bem-vindo, ${userName}! Agora você tem acesso a ferramentas poderosas para gerenciar seus clientes e impulsionar seu trabalho como assessor.`;
		} else if (userRole === 'both') {
			return `Bem-vindo, ${userName}! Sua conta está pronta para gerenciar tanto seus investimentos pessoais quanto sua carteira de clientes.`;
		}
		return `Bem-vindo, ${userName}! Agora você tem acesso a ferramentas poderosas para potencializar seus investimentos.`;
	}
</script>

<div class="min-h-screen bg-black text-white flex items-center justify-center p-4 cosmic-background">
	{#if currentStep === 1 && showTerms}
		<TermsOfService 
			{showTerms}
			on:accept={handleTermsAccept}
			on:reject={handleTermsReject}
		/>
	{:else}
		<div class="w-full max-w-2xl bg-gray-900/30 backdrop-blur-lg rounded-xl border border-purple-500/30 p-8 relative overflow-hidden glass-panel">
			<!-- Background Animation -->
			<div class="absolute inset-0 overflow-hidden">
				<div class="stars absolute inset-0"></div>
				<div class="planets">
					<div class="planet planet-1"></div>
					<div class="planet planet-2"></div>
					<div class="nebula"></div>
				</div>
				{#if currentStep === 5}
					<div class="shooting-stars"></div>
					<div class="cosmic-pulse"></div>
				{/if}
			</div>

			<!-- Progress Indicator animado com temática gravitacional -->
			<div class="relative z-10 flex justify-between mb-12 mt-2">
				{#each Array(5) as _, i}
					<div class="flex items-center">
						<div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 orbit-indicator
							{i + 1 <= currentStep ? 'active-step' : 'inactive-step'}">
							{#if i + 1 < currentStep}
								<span class="text-white">✓</span>
							{:else}
								<span class="text-gray-400">{i + 1}</span>
							{/if}
							{#if i + 1 === currentStep}
								<div class="pulse-ring"></div>
							{/if}
						</div>
						{#if i < 4}
							<div class="h-1 w-full mx-2 rounded-full cosmic-path
								{i + 1 < currentStep ? 'cosmic-path-active' : 'cosmic-path-inactive'}"></div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Content com novos efeitos -->
			<div class="relative z-10">
				{#if currentStep === 1}
					<div in:fly={{ y: 50, duration: 800 }} out:fade={{ duration: 300 }} class="fade-in">
						<h2 class="text-3xl font-bold text-center mb-4 cosmic-title">{steps[0].title}</h2>
						<p class="text-center text-blue-200 mb-6">{steps[0].subtitle}</p>
						
						<div class="flex justify-center mb-8">
							<div class="w-20 h-20 rounded-full flex items-center justify-center document-icon">
								<span class="text-4xl">📜</span>
							</div>
						</div>
						
						<p class="text-center text-blue-100 mb-6 leading-relaxed">
							Você aceitou os Termos de Serviço da Plataforma Gravity Group. Agora podemos prosseguir com a personalização da sua experiência.
						</p>
					</div>
				{:else if currentStep === 2}
					<div in:fly={{ y: 50, duration: 800 }} out:fade={{ duration: 300 }} class="fade-in">
						<h2 class="text-3xl font-bold text-center mb-4 cosmic-title">{steps[1].title}</h2>
						<p class="text-center text-blue-200 mb-8">{steps[1].subtitle}</p>
						
						<div class="space-y-8">
							<div class="gravitational-field">
								<label class="block text-sm font-medium text-blue-300 mb-3">
									Como gostaria de ser chamado?
								</label>
								<input
									type="text"
									bind:value={userName}
									class="w-full px-4 py-3 bg-black/40 border border-blue-500/30 rounded-lg focus:outline-none focus:border-blue-400 text-white cosmic-input"
									placeholder="Seu nome"
								/>
							</div>
							
							<div class="gravitational-field">
								<label class="block text-sm font-medium text-blue-300 mb-3">
									Qual sua relação com o mercado?
								</label>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									{#each roleOptions as option}
										<button
											class="p-4 border rounded-lg transition-all duration-300 flex items-center gap-2 option-button
												{userRole === option.value ? 'active-option' : 'inactive-option'}"
											on:click={() => userRole = option.value}
										>
											<span class="text-xl option-icon">{option.icon}</span>
											<span>{option.label}</span>
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{:else if currentStep === 3}
					<div in:fly={{ y: 50, duration: 800 }} out:fade={{ duration: 300 }} class="fade-in">
						<h2 class="text-3xl font-bold text-center mb-4 cosmic-title">{steps[2].title}</h2>
						<p class="text-center text-blue-200 mb-6">{steps[2].subtitle}</p>
						
						<div class="gravitational-field">
							<label class="block text-sm font-medium text-blue-300 mb-3">
								Quais seus principais objetivos na plataforma? (Selecione até 2 opções)
							</label>
							<div class="grid gap-3">
								{#each objectiveOptions as option}
									<button
										class="p-4 border rounded-lg text-left transition-all duration-300 flex items-start gap-3 objective-option
											{userObjectives.includes(option.value) ? 'active-option' : 'inactive-option'}"
										on:click={() => toggleObjective(option.value)}
									>
										<span class="text-xl mt-0.5 option-icon">{option.icon}</span>
										<span>{option.label}</span>
									</button>
								{/each}
							</div>
							
							{#if userObjectives.includes('other')}
								<div class="mt-6 gravitational-field-alt">
									<label class="block text-sm font-medium text-blue-300 mb-3">
										Por favor, descreva seu objetivo:
									</label>
									<textarea
										bind:value={otherObjective}
										class="w-full px-4 py-3 bg-black/40 border border-blue-500/30 rounded-lg focus:outline-none focus:border-blue-400 text-white cosmic-input"
										placeholder="Descreva seu objetivo..."
										rows="3"
									></textarea>
								</div>
							{/if}
							
							<div class="mt-3 text-sm text-blue-300 selection-counter">
								{#if userObjectives.length === 0}
									Selecione pelo menos uma opção
								{:else if userObjectives.length < 2}
									Você pode selecionar mais {2 - userObjectives.length} opção
								{:else}
									Você selecionou o máximo de opções
								{/if}
							</div>
						</div>
					</div>
				{:else if currentStep === 4}
					<div in:fly={{ y: 50, duration: 800 }} out:fade={{ duration: 300 }} class="fade-in">
						<h2 class="text-3xl font-bold text-center mb-4 cosmic-title">{steps[3].title}</h2>
						<p class="text-center text-blue-200 mb-6">{steps[3].subtitle}</p>
						
						<div class="gravitational-field">
							<label class="block text-sm font-medium text-blue-300 mb-3">
								Como deseja receber atualizações e insights? (Selecione uma ou mais opções)
							</label>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each communicationOptions as option}
									<button
										class="p-4 border rounded-lg text-left transition-all duration-300 flex items-center gap-3 comms-option
											{communicationPreferences.includes(option.value) ? 'active-option' : 'inactive-option'}"
										on:click={() => toggleCommunication(option.value)}
									>
										<span class="text-xl option-icon">{option.icon}</span>
										<span>{option.label}</span>
									</button>
								{/each}
							</div>
							
							<div class="mt-3 text-sm text-blue-300">
								Selecione pelo menos uma opção de comunicação
							</div>
						</div>
					</div>
				{:else if currentStep === 5}
					<div in:fly={{ y: 50, duration: 800 }} out:fade={{ duration: 300 }} class="fade-in text-center">
						<div class="flex justify-center mb-8">
							<div class="cosmic-welcome">
								<span class="text-5xl">🚀</span>
							</div>
						</div>
						
						<h2 class="text-3xl font-bold mb-4 cosmic-title">{steps[4].title}</h2>
						
						{#if loading}
							<div class="flex flex-col items-center space-y-4">
								<div class="cosmic-loader"></div>
								<p class="text-blue-200">Preparando sua experiência personalizada...</p>
							</div>
						{:else}
							<p class="text-xl text-blue-100 mb-6 welcome-message">{getWelcomeMessage()}</p>
							<p class="text-blue-300 mb-8 welcome-details">
								Agora você tem acesso a todas as funcionalidades da plataforma. 
								Explore e comece a maximizar seu potencial financeiro!
							</p>
						{/if}
					</div>
				{/if}

				<!-- Navigation -->
				<div class="mt-8 flex justify-end">
					<button
						on:click={nextStep}
						disabled={!canProceed() || loading}
						class="px-8 py-3 rounded-lg font-semibold next-button
							   disabled:opacity-50 disabled:cursor-not-allowed
							   transition duration-300 ease-in-out"
					>
						{currentStep === 5 ? 'Acessar Plataforma' : 'Avançar'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Background cósmico aprimorado */
	.cosmic-background {
		background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
		overflow: hidden;
	}
	
	/* Efeito de vidro aperfeiçoado */
	.glass-panel {
		box-shadow: 0 0 30px rgba(76, 29, 149, 0.15);
		animation: pulse-glow 6s infinite;
	}
	
	@keyframes pulse-glow {
		0% { box-shadow: 0 0 20px rgba(76, 29, 149, 0.15); }
		50% { box-shadow: 0 0 40px rgba(124, 58, 237, 0.3); }
		100% { box-shadow: 0 0 20px rgba(76, 29, 149, 0.15); }
	}
	
	/* Sistema de estrelas melhorado */
	.stars {
		background-image: 
			radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
			radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
			radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0)),
			radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
			radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)),
			radial-gradient(1px 1px at 160px 120px, #fff, rgba(0,0,0,0)),
			radial-gradient(2px 2px at 200px 30px, #fff, rgba(0,0,0,0)),
			radial-gradient(2px 2px at 300px 70px, #fff, rgba(0,0,0,0)),
			radial-gradient(1px 1px at 400px 100px, #fff, rgba(0,0,0,0));
		background-repeat: repeat;
		background-size: 500px 500px;
		animation: twinkle 4s infinite;
	}

	@keyframes twinkle {
		0% { opacity: 0.3; }
		50% { opacity: 0.6; }
		100% { opacity: 0.3; }
	}
	
	/* Planetas flutuantes */
	.planets {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	
	.planet {
		position: absolute;
		border-radius: 50%;
		opacity: 0.6;
	}
	
	.planet-1 {
		width: 120px;
		height: 120px;
		bottom: -40px;
		left: -50px;
		background: radial-gradient(circle at 30% 30%, #8B5CF6, #3B0764);
		animation: float-planet1 25s infinite ease-in-out;
	}
	
	.planet-2 {
		width: 80px;
		height: 80px;
		top: -20px;
		right: -20px;
		background: radial-gradient(circle at 40% 40%, #34D399, #065F46);
		animation: float-planet2 20s infinite ease-in-out;
	}
	
	.nebula {
		position: absolute;
		width: 200px;
		height: 200px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
		filter: blur(20px);
		opacity: 0.3;
		animation: nebula-pulse 15s infinite ease-in-out;
	}
	
	@keyframes float-planet1 {
		0% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(180deg); }
		100% { transform: translateY(0) rotate(360deg); }
	}
	
	@keyframes float-planet2 {
		0% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(15px) rotate(-180deg); }
		100% { transform: translateY(0) rotate(-360deg); }
	}
	
	@keyframes nebula-pulse {
		0% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
		50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.5); }
		100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
	}

	/* Estrelas cadentes aperfeiçoadas */
	.shooting-stars {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.shooting-stars::before,
	.shooting-stars::after {
		content: "";
		position: absolute;
		width: 150px;
		height: 2px;
		background: linear-gradient(90deg, #8B5CF6, transparent);
		animation: shooting 6s infinite linear;
		border-radius: 100px;
		box-shadow: 0 0 10px #8B5CF6;
	}

	.shooting-stars::before {
		top: 30%;
		left: 0;
		transform: rotate(-45deg);
	}

	.shooting-stars::after {
		top: 60%;
		left: 30%;
		animation-delay: 3s;
		width: 100px;
		transform: rotate(-35deg);
	}

	@keyframes shooting {
		0% {
			transform: translateX(-100px) translateY(-100px) rotate(-45deg);
			opacity: 1;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translateX(500px) translateY(500px) rotate(-45deg);
			opacity: 0;
		}
	}
	
	/* Efeito de pulso cósmico */
	.cosmic-pulse {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 1px;
		height: 1px;
		box-shadow: 0 0 150px 100px rgba(124, 58, 237, 0.2);
		border-radius: 50%;
		animation: pulse 4s infinite ease-in-out;
	}
	
	@keyframes pulse {
		0% { box-shadow: 0 0 100px 50px rgba(124, 58, 237, 0.1); }
		50% { box-shadow: 0 0 150px 100px rgba(124, 58, 237, 0.2); }
		100% { box-shadow: 0 0 100px 50px rgba(124, 58, 237, 0.1); }
	}
	
	/* Indicadores de progresso com estilo de órbita */
	.orbit-indicator {
		position: relative;
		z-index: 1;
		transition: all 0.5s ease;
	}
	
	.active-step {
		border: 2px solid #8B5CF6;
		background: rgba(139, 92, 246, 0.2);
		box-shadow: 0 0 15px #8B5CF6;
	}
	
	.inactive-step {
		border: 2px solid rgba(255, 255, 255, 0.2);
		background: rgba(0, 0, 0, 0.3);
	}
	
	.pulse-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 2px solid #8B5CF6;
		animation: pulse-ring 2s infinite;
	}
	
	@keyframes pulse-ring {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}
	
	.cosmic-path {
		height: 3px;
		position: relative;
		overflow: hidden;
	}
	
	.cosmic-path-active {
		background: linear-gradient(90deg, #8B5CF6, #C4B5FD);
	}
	
	.cosmic-path-inactive {
		background: rgba(255, 255, 255, 0.1);
	}
	
	.cosmic-path-active::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
		animation: shimmering 2s infinite;
	}
	
	@keyframes shimmering {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	
	/* Elementos de texto com efeito cósmico */
	.cosmic-title {
		background: linear-gradient(90deg, #8B5CF6, #C4B5FD);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
	}
	
	.fade-in {
		animation: fadeIn 0.8s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	/* Campos com efeito de campo gravitacional */
	.gravitational-field {
		position: relative;
		transition: all 0.3s ease;
	}
	
	.gravitational-field:hover {
		transform: translateY(-2px);
	}
	
	.gravitational-field-alt {
		position: relative;
		animation: float 5s infinite ease-in-out;
	}
	
	@keyframes float {
		0% { transform: translateY(0); }
		50% { transform: translateY(-3px); }
		100% { transform: translateY(0); }
	}
	
	.cosmic-input {
		transition: all 0.3s ease;
	}
	
	.cosmic-input:focus {
		box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
	}
	
	/* Botões de opção com efeito gravitacional */
	.option-button, .objective-option, .comms-option {
		transition: all 0.3s ease;
		overflow: hidden;
		position: relative;
	}
	
	.active-option {
		border-color: #8B5CF6;
		background: rgba(139, 92, 246, 0.2);
		box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
	}
	
	.inactive-option {
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(0, 0, 0, 0.3);
	}
	
	.option-button:hover, .objective-option:hover, .comms-option:hover {
		transform: translateY(-2px);
		border-color: rgba(139, 92, 246, 0.6);
	}
	
	.option-icon {
		background: rgba(139, 92, 246, 0.1);
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
	}
	
	.active-option .option-icon {
		background: rgba(139, 92, 246, 0.3);
		box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
	}
	
	/* Boas-vindas com estilo cósmico */
	.cosmic-welcome {
		width: 100px;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4), rgba(36, 0, 70, 0.8));
		box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
		animation: pulse-welcome 4s infinite;
	}
	
	@keyframes pulse-welcome {
		0% { transform: scale(1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); }
		50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
		100% { transform: scale(1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); }
	}
	
	.welcome-message {
		line-height: 1.6;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
	}
	
	.welcome-details {
		animation: float-text 5s infinite ease-in-out;
	}
	
	@keyframes float-text {
		0% { transform: translateY(0); }
		50% { transform: translateY(-5px); }
		100% { transform: translateY(0); }
	}
	
	/* Botão de avançar com efeito de gravidade */
	.next-button {
		background: linear-gradient(to right, #8B5CF6, #6D28D9);
		color: white;
		position: relative;
		overflow: hidden;
		box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
	}
	
	.next-button::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transform: translateX(-100%);
	}
	
	.next-button:hover::after {
		animation: shimmer 1s infinite;
	}
	
	.next-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 20px rgba(139, 92, 246, 0.6);
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	
	/* Loader cósmico */
	.cosmic-loader {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 4px solid transparent;
		border-top-color: #8B5CF6;
		border-left-color: #8B5CF6;
		animation: cosmic-spin 1.5s linear infinite;
		position: relative;
	}
	
	.cosmic-loader::before, .cosmic-loader::after {
		content: '';
		position: absolute;
		border-radius: 50%;
		border: 4px solid transparent;
	}
	
	.cosmic-loader::before {
		top: 5px;
		left: 5px;
		right: 5px;
		bottom: 5px;
		border-top-color: #A78BFA;
		animation: cosmic-spin 2s linear infinite reverse;
	}
	
	.cosmic-loader::after {
		top: 15px;
		left: 15px;
		right: 15px;
		bottom: 15px;
		border-top-color: #C4B5FD;
		animation: cosmic-spin 1s linear infinite;
	}
	
	@keyframes cosmic-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	/* Ícone de documento com animação */
	.document-icon {
		background: radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4), rgba(36, 0, 70, 0.8));
		box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
		animation: float-doc 4s infinite ease-in-out;
	}
	
	@keyframes float-doc {
		0% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-5px) rotate(5deg); }
		100% { transform: translateY(0) rotate(0deg); }
	}
</style> 