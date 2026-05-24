import type { AuthSession, GoogleAuthCredentials } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

export class GoogleAuthUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(credentials: GoogleAuthCredentials): Promise<AuthSession> {
    if (!credentials.googleIdToken.trim()) {
      throw new Error('No se recibió token de Google');
    }
    return this.authPort.googleAuth(credentials);
  }
}
