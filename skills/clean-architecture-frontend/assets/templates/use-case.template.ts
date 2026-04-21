// modules/__MODULE__/application/__ACTION__.use-case.ts
// Orquesta el flujo. DI por constructor. execute() ≤ 20-30 líneas. Hace UNA cosa.

import type { __MODULE_PASCAL__Port } from '../domain/__MODULE__.port';

export class __ACTION_PASCAL__UseCase {
  constructor(private readonly port: __MODULE_PASCAL__Port) {}

  async execute(): Promise<void> {
    throw new Error('not implemented');
  }
}
