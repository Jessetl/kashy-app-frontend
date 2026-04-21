// modules/__MODULE__/application/dtos/__ACTION__-request.dto.ts
// Schema Zod + type co-localizados. La DTO es la frontera de validación entre capas.

import { z } from 'zod';

export const __ACTION_PASCAL__RequestSchema = z.object({
});

export type __ACTION_PASCAL__RequestDto = z.infer<typeof __ACTION_PASCAL__RequestSchema>;
