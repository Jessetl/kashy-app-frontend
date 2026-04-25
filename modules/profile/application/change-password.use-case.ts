import type { ChangePasswordInput } from '../domain/entities/user-profile.entity';
import type { UserPort } from '../domain/ports/user.port';

const MIN_PASSWORD_LENGTH = 6;

export class ChangePasswordUseCase {
  constructor(private readonly userPort: UserPort) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    if (input.currentPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error('La contraseña actual es requerida');
    }
    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (input.currentPassword === input.newPassword) {
      throw new Error('La nueva contraseña debe ser distinta a la actual');
    }

    await this.userPort.changePassword(input);
  }
}
