import type { AuthTokens } from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

/** Renueva los tokens usando el puerto de autenticación.
 *  El `refreshToken` se lee del store/SecureStore dentro del datasource. */
export class RefreshTokenUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(): Promise<AuthTokens> {
    return this.authPort.refreshToken();
  }
}
