// modules/__MODULE__/application/mappers/__MODULE__.mapper.ts
// Transforma DTOs ↔ Entities. Objeto `as const` con funciones puras.

import type { __MODULE_PASCAL__ } from '../../domain/__MODULE__.entity';

export const __MODULE_PASCAL__Mapper = {
  fromApi(dto: unknown): __MODULE_PASCAL__ {
    throw new Error('not implemented');
  },
} as const;
