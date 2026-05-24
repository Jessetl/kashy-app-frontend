import type { RecoverPasswordInput } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class RecoverPasswordUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(input: RecoverPasswordInput): Promise<void> {
    const email = input.email.trim();
    if (!email) {
      throw new Error('El email es requerido');
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new Error('El formato del email no es válido');
    }
    await this.authPort.recoverPassword({ email });
  }
}
