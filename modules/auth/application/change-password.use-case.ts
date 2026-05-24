import type { ChangePasswordInput } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;

export class ChangePasswordUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    if (!input.currentPassword) {
      throw new Error('La contraseña actual es requerida');
    }
    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (input.newPassword.length > MAX_PASSWORD_LENGTH) {
      throw new Error(
        `La nueva contraseña no puede exceder ${MAX_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (input.currentPassword === input.newPassword) {
      throw new Error('La nueva contraseña debe ser distinta a la actual');
    }

    await this.authPort.changePassword(input);
  }
}
