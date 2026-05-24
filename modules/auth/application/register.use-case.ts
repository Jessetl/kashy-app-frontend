import type { RegisterCredentials } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;
const MAX_NAME_LENGTH = 80;

export class RegisterUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(credentials: RegisterCredentials): Promise<void> {
    const firstName = credentials.firstName.trim();
    const lastName = credentials.lastName.trim();
    const email = credentials.email.trim();
    const password = credentials.password;

    if (!firstName) {
      throw new Error('El nombre es requerido');
    }
    if (firstName.length > MAX_NAME_LENGTH) {
      throw new Error(
        `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`,
      );
    }
    if (!lastName) {
      throw new Error('El apellido es requerido');
    }
    if (lastName.length > MAX_NAME_LENGTH) {
      throw new Error(
        `El apellido no puede exceder ${MAX_NAME_LENGTH} caracteres`,
      );
    }
    if (!email) {
      throw new Error('El email es requerido');
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new Error('El formato del email no es válido');
    }
    if (!password) {
      throw new Error('La contraseña es requerida');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new Error(
        `La contraseña no puede exceder ${MAX_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (!credentials.countryCode) {
      throw new Error('El país es requerido');
    }

    await this.authPort.register({
      ...credentials,
      firstName,
      lastName,
      email,
    });
  }
}
