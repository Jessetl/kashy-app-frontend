// modules/__MODULE__/domain/__MODULE__.errors.ts
// Errores tipados del dominio. Union type agrupa todos los errores del módulo.

export class __MODULE_PASCAL__NotFoundError extends Error {
  readonly code = '__MODULE_UPPER___NOT_FOUND' as const;
  constructor(id: string) {
    super(`__MODULE_PASCAL__ con id ${id} no encontrado`);
    this.name = '__MODULE_PASCAL__NotFoundError';
  }
}

export type __MODULE_PASCAL__Error = __MODULE_PASCAL__NotFoundError;
