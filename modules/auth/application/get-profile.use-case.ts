import type { AuthUser } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

export class GetProfileUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(): Promise<AuthUser> {
    return this.authPort.getProfile();
  }
}
