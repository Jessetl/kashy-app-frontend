// modules/__MODULE__/infrastructure/store/__MODULE__.store.ts
// Estado cliente del módulo. Usa Zustand. Persiste con MMKV solo si debe sobrevivir reload.

import { create } from 'zustand';

interface __MODULE_PASCAL__State {
}

export const use__MODULE_PASCAL__Store = create<__MODULE_PASCAL__State>(() => ({
}));
