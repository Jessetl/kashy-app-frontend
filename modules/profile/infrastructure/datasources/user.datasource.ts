import { apiClient } from '@/shared/infrastructure/api/api-client';
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../../domain/entities/user-profile.entity';
import type { UserPort } from '../../domain/ports/user.port';

export class UserDatasource implements UserPort {
  async updateProfile(input: UpdateProfileInput): Promise<void> {
    await apiClient('/users/me', {
      method: 'PUT',
      body: { firstName: input.firstName, lastName: input.lastName },
    });
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient('/users/me/password', {
      method: 'PUT',
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      },
    });
  }
}
