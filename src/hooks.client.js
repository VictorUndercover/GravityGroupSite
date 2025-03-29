import { auth } from '$lib/firebase';
import { goto } from '$app/navigation';
import { hasSignedLatestTerms } from '$lib/firebase/terms';

/**
 * Gerencia o redirecionamento após a navegação
 * @param {{ to: { route: { id: string } } }} options - Opções de navegação
 * @returns {Promise<void | {cancel: boolean}>}
 */
export const handleNavigate = async ({ to }) => {
    // Rotas públicas que não requerem verificação
    const publicRoutes = [
        '/login', 
        '/register', 
        '/reset-password',
        '/terms-rejected'
    ];

    // Rotas de onboarding que são permitidas sem verificação adicional
    const onboardingRoutes = [
        '/onboarding',
        '/terms-accepted'
    ];

    // Rotas relacionadas a termos
    const termsRoutes = [
        '/terms/2025-02-01',
        '/terms/2025-03-20',
        '/terms-history',
        '/terms-view'
    ];

    // Ignora verificação em rotas públicas
    if (publicRoutes.includes(to.route.id)) {
        return;
    }

    /**
     * @param {any} value
     */
    return new Promise((resolve) => {
        // Verifica se o usuário está autenticado
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe();

            // Se não estiver autenticado, redireciona para login
            if (!user) {
                goto('/login');
                resolve({ cancel: true });
                return;
            }

            // Verifica se já completou o onboarding (que inclui aceite dos termos)
            const hasCompletedOnboarding = document.cookie.includes('onboarding_completed=true');
            
            // Verifica se o usuário já assinou os termos mais recentes (independente dos cookies)
            const hasSignedTerms = await hasSignedLatestTerms(user);
            
            // Se estiver tentando acessar rotas de termos, permite continuar
            if (termsRoutes.includes(to.route.id)) {
                resolve(undefined);
                return;
            }

            // Se ainda não assinou os termos mais recentes, redirecionar para assinatura
            if (!hasSignedTerms && !termsRoutes.includes(to.route.id)) {
                goto('/terms/2025-03-20');
                resolve({ cancel: true });
                return;
            }

            // Se já está em uma rota de onboarding, permite continuar
            if (onboardingRoutes.includes(to.route.id)) {
                resolve(undefined);
                return;
            }

            // Se não completou o onboarding, redireciona
            if (!hasCompletedOnboarding) {
                goto('/onboarding');
                resolve({ cancel: true });
                return;
            }

            // Caso contrário, permite a navegação
            resolve(undefined);
        });
    });
}; 