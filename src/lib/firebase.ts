import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Usamos valores fictícios para o build, mas em produção virão das variáveis de ambiente
const firebaseConfig = {
  apiKey: "dummy-api-key-for-build",
  authDomain: "gravity-group-site.firebaseapp.com",
  projectId: "gravity-group-site",
  storageBucket: "gravity-group-site.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcd1234efgh5678",
  measurementId: "G-ABCDEFGHIJ"
};

// Inicializa o Firebase apenas se não houver uma instância existente
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app); 