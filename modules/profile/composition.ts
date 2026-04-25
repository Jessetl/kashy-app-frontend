/**
 * Composition root del módulo profile.
 *
 * Único lugar donde se cablea la infraestructura (datasources) con los
 * casos de uso. La capa de presentación importa instancias preconfiguradas
 * desde aquí, sin conocer el datasource concreto.
 */
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { UserDatasource } from './infrastructure/datasources/user.datasource';

const userPort = new UserDatasource();

export const updateProfileUseCase = new UpdateProfileUseCase(userPort);
export const changePasswordUseCase = new ChangePasswordUseCase(userPort);
