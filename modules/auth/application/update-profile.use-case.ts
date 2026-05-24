import type { AuthUser, UpdateProfileInput } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

const MAX_NAME_LENGTH = 80;

export class UpdateProfileUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(input: UpdateProfileInput): Promise<AuthUser> {
    const normalized: UpdateProfileInput = {};

    if (input.firstName !== undefined) {
      const firstName = input.firstName?.trim() ?? null;
      if (firstName !== null) {
        if (!firstName) {
          throw new Error('El nombre es requerido');
        }
        if (firstName.length > MAX_NAME_LENGTH) {
          throw new Error(`El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`);
        }
      }
      normalized.firstName = firstName;
    }

    if (input.lastName !== undefined) {
      const lastName = input.lastName?.trim() ?? null;
      if (lastName !== null) {
        if (!lastName) {
          throw new Error('El apellido es requerido');
        }
        if (lastName.length > MAX_NAME_LENGTH) {
          throw new Error(`El apellido no puede exceder ${MAX_NAME_LENGTH} caracteres`);
        }
      }
      normalized.lastName = lastName;
    }

    if (input.avatarUrl !== undefined) {
      normalized.avatarUrl = input.avatarUrl;
    }
    if (input.countryCode !== undefined) {
      normalized.countryCode = input.countryCode;
    }
    if (input.latitude !== undefined) {
      normalized.latitude = input.latitude;
    }
    if (input.longitude !== undefined) {
      normalized.longitude = input.longitude;
    }

    if (Object.keys(normalized).length === 0) {
      throw new Error('No hay cambios para guardar');
    }

    return this.authPort.updateProfile(normalized);
  }
}
