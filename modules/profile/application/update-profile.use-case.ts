import type { UpdateProfileInput } from '../domain/entities/user-profile.entity';
import type { UserPort } from '../domain/ports/user.port';

export class UpdateProfileUseCase {
  constructor(private readonly userPort: UserPort) {}

  async execute(input: UpdateProfileInput): Promise<UpdateProfileInput> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (!firstName) {
      throw new Error('El nombre es requerido');
    }
    if (!lastName) {
      throw new Error('El apellido es requerido');
    }

    const normalized: UpdateProfileInput = { firstName, lastName };
    await this.userPort.updateProfile(normalized);
    return normalized;
  }
}
