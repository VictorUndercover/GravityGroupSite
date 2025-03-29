import { db } from '../firebase.js';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface TermsSignature {
    userId: string;
    version: string;
    signedAt: Timestamp;
    acceptedBy: string;
    userEmail: string;
}

export async function getTermsSignature(user: User, version: string): Promise<TermsSignature | null> {
    try {
        const termsRef = collection(db, 'termsSignatures');
        const q = query(
            termsRef,
            where('userId', '==', user.uid),
            where('version', '==', version)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            ...doc.data(),
            signedAt: doc.data().signedAt
        } as TermsSignature;
    } catch (error) {
        console.error('Erro ao buscar assinatura dos termos:', error);
        throw error;
    }
}

export async function signTerms(user: User, version: string): Promise<void> {
    try {
        const termsRef = collection(db, 'termsSignatures');
        await addDoc(termsRef, {
            userId: user.uid,
            version: version,
            signedAt: Timestamp.now(),
            acceptedBy: user.displayName || user.email,
            userEmail: user.email
        });
    } catch (error) {
        console.error('Erro ao assinar os termos:', error);
        throw error;
    }
}

export async function hasSignedLatestTerms(user: User): Promise<boolean> {
    try {
        const latestVersion = '2025.03.20'; // Versão mais recente dos termos
        const signature = await getTermsSignature(user, latestVersion);
        return signature !== null;
    } catch (error) {
        console.error('Erro ao verificar assinatura dos termos:', error);
        return false;
    }
} 