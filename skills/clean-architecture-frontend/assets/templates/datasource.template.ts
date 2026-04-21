// modules/__MODULE__/infrastructure/__MODULE__.datasource.ts
// Implementación concreta del port. Aquí vive fetch/MMKV. Valida respuestas con Zod.

import { apiClient } from '@/shared/infrastructure/api';

import type { __MODULE_PASCAL__ } from '../domain/__MODULE__.entity';
import type { __MODULE_PASCAL__Port } from '../domain/__MODULE__.port';

export class __MODULE_PASCAL__Datasource implements __MODULE_PASCAL__Port {
  async list(): Promise<__MODULE_PASCAL__[]> {
    const { data } = await apiClient<__MODULE_PASCAL__[]>('/__MODULE__');
    return data;
  }

  async getById(id: string): Promise<__MODULE_PASCAL__ | null> {
    const { data } = await apiClient<__MODULE_PASCAL__ | null>(`/__MODULE__/${id}`);
    return data;
  }
}
