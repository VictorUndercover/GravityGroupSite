<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { enhance } from '$app/forms';
  import { auth } from '$lib/firebase';
  import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
  import type { User } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { setSessionCookie } from '$lib/session';
  import { getOnboardingStatus, createOnboardingStatus } from '$lib/firebase/onboarding';
  import { hasSignedLatestTerms } from '$lib/firebase/terms';
  
  let loading = false;
  let error = '';

  let container: HTMLElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let blackHole: THREE.Object3D;
  let particleSystem: THREE.Points;
  let gridPoints: THREE.Points[] = [];
  let animationFrame: number;
  let isLoggingIn = false;
  
  // Variáveis para controle de rotação baseada no movimento do mouse
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationX = 0;
  let targetRotationY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let velocityX = 0;
  let velocityY = 0;
  
  // Configurações do sistema de partículas
  const GRID_SIZE = 100;
  const GRID_RESOLUTION = 70;
  const PARTICLE_COUNT = GRID_RESOLUTION * GRID_RESOLUTION;
  const BLACK_HOLE_RADIUS = 8;
  const MAX_DISTANCE = Math.sqrt(GRID_SIZE * GRID_SIZE * 2);
  const GRID_SPACING = 2.5;
  
  onMount(() => {
    // Verifica se já está autenticado
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        goto('/hub2');
      }
    });

    initScene();
    createBlackHole();
    createParticleGrid();
    animate();

    // Responsividade
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);
    
    // Adiciona listener para movimento do mouse
    function handleMouseMove(event: MouseEvent) {
      // Guarda valores anteriores para calcular direção e velocidade
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      
      // Normaliza a posição do mouse para valores entre -1 e 1
      // Representa a distância do centro da tela
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -((event.clientY / window.innerHeight) * 2 - 1);
      
      // Calcula a velocidade do movimento
      velocityX = mouseX - lastMouseX;
      velocityY = mouseY - lastMouseY;
      
      // Aplicação suave para o eixo vertical
      targetRotationX = targetRotationX * 0.8 + mouseY * 0.2;
    }
    
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(animationFrame);
    };
  });

  function initScene() {
    // Inicializa a cena, câmera e renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Fundo branco
    (renderer as any).setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);
    
    // Posiciona a câmera significativamente mais alta para melhor enquadramento, como na imagem de referência
    camera.position.z = 70; // Afasta mais a câmera para ter uma visão mais ampla
    camera.position.y = 5; // Posição bem mais elevada
    (camera as any).lookAt(new THREE.Vector3(0, 5, 0)); // Mantém o olhar para o buraco negro no centro
    
    // Adiciona uma luz ambiente sutil
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
  }

  function createBlackHole() {
    // Cria a esfera central preta
    const geometry = new THREE.SphereGeometry(BLACK_HOLE_RADIUS, 50, 50);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    blackHole = new THREE.Mesh(geometry, material);
    
    // Posiciona a esfera mais alta, como na imagem de referência
    blackHole.position.y = 5;
    
    // Adiciona um halo visível ao redor da esfera central
    const haloGeometry = new THREE.SphereGeometry(BLACK_HOLE_RADIUS * 0.6, 50, 50);
    const haloMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.3 
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    
    blackHole.add(halo);
    
    // Adiciona um segundo halo mais sutil e maior para criar efeito de atração visual
    const outerHaloGeometry = new THREE.SphereGeometry(BLACK_HOLE_RADIUS * 1, 50, 50);
    const outerHaloMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.15 
    });
    const outerHalo = new THREE.Mesh(outerHaloGeometry, outerHaloMaterial);
    
    // Adiciona um terceiro halo ainda maior e mais sutil
    const farHaloGeometry = new THREE.SphereGeometry(BLACK_HOLE_RADIUS * 1, 50, 50);
    const farHaloMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.05 
    });
    const farHalo = new THREE.Mesh(farHaloGeometry, farHaloMaterial);
    
    blackHole.add(halo);
    blackHole.add(outerHalo);
    blackHole.add(farHalo);
    scene.add(blackHole);
  }

  function createParticleGrid() {
    // Cria um grid plano de partículas
    const vertices = [];
    const colors = [];
    
    // Criar um plano de partículas no padrão de grid com maior espaçamento
    for (let i = 0; i < GRID_RESOLUTION; i++) {
      for (let j = 0; j < GRID_RESOLUTION; j++) {
        const x = (i / (GRID_RESOLUTION - 1) * GRID_SIZE * GRID_SPACING) - (GRID_SIZE * GRID_SPACING / 2);
        const z = (j / (GRID_RESOLUTION - 1) * GRID_SIZE * GRID_SPACING) - (GRID_SIZE * GRID_SPACING / 2.5);
        
        // Calcula a distância inicial ao centro para definir a altura (y)
        const distance = Math.sqrt(x * x + z * z);
        let y = 0;
        
        vertices.push(x, y, z);
        
        // Define a cor como preta para todas as partículas
        colors.push(0, 0, 0);
      }
    }
    
    // Cria a geometria e atributos para as partículas
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Cria uma textura circular para as partículas (para que fiquem esféricas, não quadradas)
    const particleTexture = createCircleTexture(128);
    
    // Cria um material para as partículas esféricas e com tamanho maior
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.2,
      sizeAttenuation: true
    });
    
    // Cria o sistema de partículas e o adiciona à cena
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
  }
  
  // Função para criar uma textura circular para as partículas
  function createCircleTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Texture();
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Limpa o canvas para garantir transparência
    context.clearRect(0, 0, size, size);
    
    // Desenha um círculo preto com bordas nítidas
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.9, 0, 2 * Math.PI, false);
    
    // Cria um gradiente radial com menos desfoque para maior nitidez
    const gradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.9
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    context.fillStyle = gradient;
    context.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  function animate() {
    animationFrame = requestAnimationFrame(animate);

    // Movimentação da câmera baseada no mouse
    if (camera) {
      // Valores de sensibilidade - reduzidos para o eixo Y
      const baseRotationSpeed = 0.0005; // Velocidade base reduzida para eixo Y
      
      // Calcula a distância do cursor ao centro da tela (0,0)
      const distanceFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      
      // Fator que aumenta com a distância do centro
      const distanceFactor = Math.pow(distanceFromCenter, 1.5); // Exponencial para amplificar efeito nas bordas
      
      // Movimento horizontal (eixo Y) com velocidade reduzida e baseada na distância do centro
      const positionBasedSpeedX = baseRotationSpeed * Math.sign(mouseX) * Math.abs(mouseX) * distanceFactor * 0.7;
      
      // Mesma lógica para o eixo vertical (eixo X)
      const baseVerticalSpeed = 0.00001;
      const positionBasedSpeedY = baseVerticalSpeed * Math.sign(mouseY) * Math.abs(mouseY) * distanceFactor * 3;
      
      // Acumulamos a rotação horizontal baseada na posição e distância do mouse
      targetRotationY += positionBasedSpeedX;
      
      // Acumulamos a posição vertical com a mesma lógica
      targetRotationX += positionBasedSpeedY;
      
      // Calculamos a posição da câmera em coordenadas esféricas
      const radius = 70; // Distância radial da câmera (mantida constante)
      const horizontalAngle = targetRotationY * Math.PI * 0.15; // Reduzido em 50% (de 0.3 para 0.15)
      
      // Limitamos o ângulo vertical para evitar rotações extremas
      // Isso restringe o movimento para que a câmera não vá muito acima ou abaixo da esfera
      const maxVerticalAngle = 0.75; // Reduzido em 50% (de 1.5 para 0.75)
      const clampedVerticalRotation = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, targetRotationX));
      const verticalAngle = clampedVerticalRotation * Math.PI * 0.075; // Reduzido em 50% (de 0.15 para 0.075)
      
      // Convertemos as coordenadas esféricas para cartesianas
      // Isso permite movimento completo em torno da esfera em ambos os eixos
      camera.position.x = radius * Math.cos(verticalAngle) * Math.sin(horizontalAngle);
      camera.position.y = radius * Math.sin(verticalAngle) + 5; // Adicionamos 5 para centralizar em torno da esfera
      camera.position.z = radius * Math.cos(verticalAngle) * Math.cos(horizontalAngle);
      
      // Removemos a inclinação da câmera para manter o foco apenas pela posição
      (camera as any).rotation.x = 0;
      
      // Mantém a câmera sempre olhando para a esfera central
      (camera as any).lookAt(new THREE.Vector3(0, 5, 0));
    }
    
    // Atualiza as posições das partículas para simular efeito gravitacional
    updateParticlePositions();
    
    renderer.render(scene, camera);
  }
  
  let loginStartTime = 0;
  const loginDuration = 10000; // Aumentado para 10 segundos
  
  function startLoginAnimation() {
    isLoggingIn = true;
    loginStartTime = Date.now();
  }

  let email = '';
  let password = '';

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = '';

    // Inicia a animação de login
    startLoginAnimation();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await setSessionCookie();
        
        // Verifica se o usuário já tem status de onboarding
        const onboardingStatus = await getOnboardingStatus(userCredential.user);
        
        // Se não tiver, cria um novo status
        if (!onboardingStatus) {
          await createOnboardingStatus(userCredential.user);
          // Redireciona para o onboarding
          window.location.replace('/onboarding');
          return;
        }
        
        // Verifica se já aceitou os termos mais recentes
        const hasAcceptedTerms = await hasSignedLatestTerms(userCredential.user);
        if (!hasAcceptedTerms) {
          // Redireciona para a página de termos
          window.location.replace('/terms/2025-03-20');
          return;
        }
        
        // Se já completou tudo, vai para o hub
        window.location.replace('/hub2');
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = 'Erro desconhecido';
      }
      isLoggingIn = false;
    } finally {
      setTimeout(() => {
        loading = false;
      }, 2000);
    }
  }

  async function handleGoogleLogin() {
    loading = true;
    error = '';

    // Inicia a animação de login
    startLoginAnimation();

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        await setSessionCookie();
        
        // Verifica se o usuário já tem status de onboarding
        const onboardingStatus = await getOnboardingStatus(result.user);
        
        // Se não tiver, cria um novo status
        if (!onboardingStatus) {
          await createOnboardingStatus(result.user);
          // Redireciona para o onboarding
          window.location.replace('/onboarding');
          return;
        }
        
        // Verifica se já aceitou os termos mais recentes
        const hasAcceptedTerms = await hasSignedLatestTerms(result.user);
        if (!hasAcceptedTerms) {
          // Redireciona para a página de termos
          window.location.replace('/terms/2025-03-20');
          return;
        }
        
        // Se já completou tudo, vai para o hub
        window.location.replace('/hub2');
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = 'Erro desconhecido';
      }
      isLoggingIn = false;
    } finally {
      setTimeout(() => {
        loading = false;
      }, 2000);
    }
  }

  function updateParticlePositions() {
    if (!particleSystem) return;
    
    const positions = particleSystem.geometry.getAttribute('position');
    const colors = particleSystem.geometry.getAttribute('color');
    const vertices = positions.array;
    
    const time = Date.now() * 0.0002;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      const distance = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);
      
      let waveHeight = 0;
      
      if (!isLoggingIn) {
        // Comportamento normal das ondas
        const gravityFactor = 1 - Math.min(1, distance / (GRID_SIZE * 0.6));
        waveHeight = (
          Math.sin(distance * 0.15 - time) * 3.0 +
          Math.sin(distance * 0.3 - time * 0.8) * 0.8 +
          Math.sin(angle * 12 + distance * 0.05) * 0.3
        ) * Math.pow(1 - gravityFactor, 0.6);
        
        const gravitationalPull = Math.pow(gravityFactor, 2) * 15;
        vertices[i + 1] = waveHeight - gravitationalPull;
      } else {
        // Efeito de pulso que aumenta a amplitude das ondas
        const loginProgress = Math.min(1, (Date.now() - loginStartTime) / loginDuration);
        
        // Calcula a intensidade do pulso baseado no progresso do login
        const pulseIntensity = Math.sin(loginProgress * Math.PI) * 2; // Pico no meio da animação
        
        // Aumenta a amplitude das ondas durante o login
        const waveAmplitude = 3.0 + pulseIntensity * 8.0; // Aumentado de 4.0 para 8.0
        const gravityFactor = 1 - Math.min(1, distance / (GRID_SIZE * 0.8)); // Aumentado área de influência
        
        // Ondas mais largas e com maior amplitude
        waveHeight = (
          Math.sin(distance * 0.08 - time) * waveAmplitude + // Frequência reduzida de 0.15 para 0.08
          Math.sin(distance * 0.15 - time * 0.8) * (waveAmplitude * 0.5) + // Frequência reduzida de 0.3 para 0.15
          Math.sin(angle * 6 + distance * 0.03) * (waveAmplitude * 0.3) // Reduzido de 12 para 6 e 0.05 para 0.03
        ) * Math.pow(1 - gravityFactor, 0.4); // Reduzido de 0.6 para 0.4 para ondas mais amplas
        
        // Mantém o efeito gravitacional base, mas mais suave
        const gravitationalPull = Math.pow(gravityFactor, 1.5) * 12; // Reduzido de 2 para 1.5 e 15 para 12
        
        // Aplica a altura final
        vertices[i + 1] = waveHeight - gravitationalPull;
        
        // Mantém as posições X e Z originais
        vertices[i] = x;
        vertices[i + 2] = z;
      }
      
      // Mantém a cor preta para todas as partículas
      colors.array[i] = 0;
      colors.array[i + 1] = 0;
      colors.array[i + 2] = 0;
    }
    
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }
</script>

<div class="relative w-full h-screen bg-white overflow-hidden">
  <div bind:this={container} class="absolute inset-0 z-0"></div>
  
  <div class="relative z-10 flex items-center justify-center min-h-screen">
    <div class="w-full max-w-md p-8 space-y-6 bg-white/20 backdrop-blur-sm rounded-lg shadow-xl border border-black/10 mx-4 sm:mx-0">
      <div class="flex justify-center mb-6">
        <img 
          src="/images/Logo Redondo Preto - Sem Fundo.png" 
          alt="Gravity Logo" 
          class="h-[90px] sm:h-[120px] w-auto"
        />
      </div>
      
      {#if error}
        <div class="p-3 text-sm text-red-200 bg-red-900/50 rounded-md">
          {error}
        </div>
      {/if}

      <form class="space-y-4" on:submit={handleSubmit}>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            class="w-full px-3 py-2 mt-1 text-black bg-white/80 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="seu@email.com"
            bind:value={email}
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            id="password"
            name="password"
            class="w-full px-3 py-2 mt-1 text-black bg-white/80 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="********"
            bind:value={password}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          class="w-full px-4 py-2 text-white bg-gradient-to-r from-purple-800 to-indigo-900 rounded-md hover:from-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-black/10"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 text-gray-700 bg-white/85">Ou continue com</span>
        </div>
      </div>

      <button
        on:click={handleGoogleLogin}
        disabled={loading}
        class="w-full px-4 py-2 flex items-center justify-center space-x-2 text-black bg-white border border-black/20 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Google</span>
      </button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: white;
  }

  input::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }
  
  /* Efeitos de transição suave para botões e elementos de formulário */
  button, input {
    transition: all 0.3s ease;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(128, 90, 213, 0.3);
  }
  
  input:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(128, 90, 213, 0.2);
  }
</style>
  
