import type { AuthTokens } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

/** Renueva el `accessToken` usando el puerto de autenticación.
 *  El JWT actual/expirado se inyecta desde el store dentro del datasource. */
export class RefreshTokenUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(): Promise<AuthTokens> {
    return this.authPort.refreshToken();
  }
}
