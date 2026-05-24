import type { AuthSession, LoginCredentials } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

export class LoginUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(credentials: LoginCredentials): Promise<AuthSession> {
    const email = credentials.email.trim();

    if (!email) {
      throw new Error('El email es requerido');
    }
    if (!credentials.password.trim()) {
      throw new Error('La contraseña es requerida');
    }

    return this.authPort.login({
      email,
      password: credentials.password,
    });
  }
}
