// modules/__MODULE__/domain/__MODULE__.port.ts
// Contrato del repositorio. Sin clases, solo interface. Recibe/retorna DTOs o Entities.

import type { __MODULE_PASCAL__ } from './__MODULE__.entity';

export interface __MODULE_PASCAL__Port {
  list(): Promise<__MODULE_PASCAL__[]>;
  getById(id: string): Promise<__MODULE_PASCAL__ | null>;
}
