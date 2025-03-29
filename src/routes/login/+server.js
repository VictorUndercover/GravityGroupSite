import { json } from '@sveltejs/kit';
// import { JWT_SECRET } from '$env/static/private';
const JWT_SECRET = 'gravity_group_secret_2025';
import jwt from 'jsonwebtoken';

// Simulação de banco de dados (você deve substituir por um banco real)
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    // Senha: admin123 (em produção, use hash)
    password: 'admin123'
  }
];

export async function POST({ request }) {
  const { email, password } = await request.json();

  // Verificar credenciais
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    );
  }

  // Gerar token JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return json({ token });
} 