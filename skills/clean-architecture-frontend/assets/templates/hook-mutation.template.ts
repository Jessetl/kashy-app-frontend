// modules/__MODULE__/presentation/hooks/use-__ACTION__.ts
// Hook de escritura. Compone use-case + datasource, expone mutate/isPending/error a la UI.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { __ACTION_PASCAL__UseCase } from '../../application/__ACTION__.use-case';
import { __MODULE_PASCAL__Datasource } from '../../infrastructure/__MODULE__.datasource';

const useCase = new __ACTION_PASCAL__UseCase(new __MODULE_PASCAL__Datasource());

export function use__ACTION_PASCAL__() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => useCase.execute(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['__MODULE__'] });
    },
  });
}
