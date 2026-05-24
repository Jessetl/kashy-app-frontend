import type { AuthPort } from '../domain/auth.port';

export class LogoutUseCase {
  constructor(private readonly authPort: AuthPort) {}

  /** No lanza si el backend responde 401/404; el caller siempre limpia local. */
  async execute(): Promise<void> {
    await this.authPort.logout();
  }
}
