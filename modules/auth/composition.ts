/**
 * Composition root del módulo auth.
 *
 * Este es el único lugar donde se cablea la infraestructura (datasources)
 * con los casos de uso (application). La capa de presentación importa de
 * aquí instancias ya configuradas, sin conocer el datasource concreto.
 */
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { GetProfileUseCase } from './application/get-profile.use-case';
import { GoogleAuthUseCase } from './application/google-auth.use-case';
import { LoginUseCase } from './application/login.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { RecoverPasswordUseCase } from './application/recover-password.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { AuthDatasource } from './infrastructure/auth.datasource';

const authPort = new AuthDatasource();

export const loginUseCase = new LoginUseCase(authPort);
export const registerUseCase = new RegisterUseCase(authPort);
export const refreshTokenUseCase = new RefreshTokenUseCase(authPort);
export const googleAuthUseCase = new GoogleAuthUseCase(authPort);
export const getProfileUseCase = new GetProfileUseCase(authPort);
export const updateProfileUseCase = new UpdateProfileUseCase(authPort);
export const changePasswordUseCase = new ChangePasswordUseCase(authPort);
export const logoutUseCase = new LogoutUseCase(authPort);
export const recoverPasswordUseCase = new RecoverPasswordUseCase(authPort);
