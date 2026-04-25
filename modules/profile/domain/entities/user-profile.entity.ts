/** Datos editables del perfil del usuario */
export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
}

/** Datos para cambio de contraseña */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
