import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../entities/user-profile.entity';

export interface UserPort {
  /** Actualiza el nombre del usuario autenticado */
  updateProfile(input: UpdateProfileInput): Promise<void>;
  /** Cambia la contraseña del usuario autenticado */
  changePassword(input: ChangePasswordInput): Promise<void>;
}
