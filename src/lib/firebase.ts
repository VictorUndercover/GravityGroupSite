import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Usamos valores fictícios para o build, mas em produção virão das variáveis de ambiente
const firebaseConfig = {
    apiKey: "AIzaSyBTF3VN0bKW5G1E7c6r9jD6jZcYjI6RoY0",
    authDomain: "gravity-group-2025.firebaseapp.com",
    projectId: "gravity-group-2025",
    storageBucket: "gravity-group-2025.firebasestorage.app",
    messagingSenderId: "113780516172",
    appId: "1:113780516172:web:7a197ec3e948173ee81be9",
    measurementId: "G-F0MWX9Y6CC"
};

// Inicializa o Firebase apenas se não houver uma instância existente
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app); 