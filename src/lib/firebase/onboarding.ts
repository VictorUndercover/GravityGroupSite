import { db } from '../firebase.js';
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface OnboardingStatus {
    userId: string;
    userEmail: string;
    completedAt: Timestamp | null;
    steps: {
        profileCompleted: boolean;
        termsAccepted: boolean;
        preferencesSet: boolean;
        tutorialWatched: boolean;
    };
    skippedSteps?: string[];
}

export async function getOnboardingStatus(user: User): Promise<OnboardingStatus | null> {
    try {
        const onboardingRef = collection(db, 'onboardingStatus');
        const q = query(
            onboardingRef,
            where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return doc.data() as OnboardingStatus;
    } catch (error) {
        console.error('Erro ao buscar status do onboarding:', error);
        throw error;
    }
}

export async function createOnboardingStatus(user: User): Promise<void> {
    try {
        const onboardingRef = collection(db, 'onboardingStatus');
        await addDoc(onboardingRef, {
            userId: user.uid,
            userEmail: user.email,
            completedAt: null,
            steps: {
                profileCompleted: false,
                termsAccepted: false,
                preferencesSet: false,
                tutorialWatched: false
            },
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Erro ao criar status do onboarding:', error);
        throw error;
    }
}

export async function updateOnboardingStep(
    user: User, 
    step: keyof OnboardingStatus['steps'], 
    value: boolean
): Promise<void> {
    try {
        const status = await getOnboardingStatus(user);
        if (!status) {
            throw new Error('Status do onboarding não encontrado');
        }

        const onboardingRef = collection(db, 'onboardingStatus');
        const q = query(onboardingRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const docRef = querySnapshot.docs[0].ref;

        const updatedSteps = {
            ...status.steps,
            [step]: value
        };

        // Verifica se todos os passos foram completados
        const allStepsCompleted = Object.values(updatedSteps).every(step => step);

        const updateData: Record<string, any> = {
            [`steps.${step}`]: value
        };

        if (allStepsCompleted) {
            updateData['completedAt'] = Timestamp.now();
        }

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Erro ao atualizar passo do onboarding:', error);
        throw error;
    }
}

export async function hasCompletedOnboarding(user: User): Promise<boolean> {
    try {
        const status = await getOnboardingStatus(user);
        if (!status) return false;
        
        return Object.values(status.steps).every(step => step);
    } catch (error) {
        console.error('Erro ao verificar conclusão do onboarding:', error);
        return false;
    }
}

export async function getNextOnboardingStep(user: User): Promise<string | null> {
    try {
        const status = await getOnboardingStatus(user);
        if (!status) return 'profile'; // Primeiro passo se não houver status

        const steps = [
            { id: 'profile', completed: status.steps.profileCompleted },
            { id: 'terms', completed: status.steps.termsAccepted },
            { id: 'preferences', completed: status.steps.preferencesSet },
            { id: 'tutorial', completed: status.steps.tutorialWatched }
        ];

        const nextStep = steps.find(step => !step.completed);
        return nextStep ? nextStep.id : null;
    } catch (error) {
        console.error('Erro ao buscar próximo passo do onboarding:', error);
        return 'profile'; // Retorna o primeiro passo em caso de erro
    }
}

export async function skipOnboardingStep(
    user: User,
    step: keyof OnboardingStatus['steps']
): Promise<void> {
    try {
        const status = await getOnboardingStatus(user);
        if (!status) {
            throw new Error('Status do onboarding não encontrado');
        }

        const onboardingRef = collection(db, 'onboardingStatus');
        const q = query(onboardingRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const docRef = querySnapshot.docs[0].ref;

        const updateData: Record<string, any> = {
            [`steps.${step}`]: true,
            skippedSteps: [...(status.skippedSteps || []), step]
        };

        // Verifica se todos os passos foram completados ou pulados
        const updatedSteps = {
            ...status.steps,
            [step]: true
        };

        const allStepsCompleted = Object.values(updatedSteps).every(step => step);
        if (allStepsCompleted) {
            updateData.completedAt = Timestamp.now();
        }

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Erro ao pular passo do onboarding:', error);
        throw error;
    }
}

export async function getSkippedSteps(user: User): Promise<string[]> {
    try {
        const status = await getOnboardingStatus(user);
        if (!status) return [];
        return status.skippedSteps || [];
    } catch (error) {
        console.error('Erro ao buscar passos pulados:', error);
        return [];
    }
} 