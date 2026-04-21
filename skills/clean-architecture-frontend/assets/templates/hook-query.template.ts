// modules/__MODULE__/presentation/hooks/use-__MODULE__.ts
// Hook de lectura. Compone dependencias, expone API limpia a la UI.

import { useQuery } from '@tanstack/react-query';

import { __MODULE_PASCAL__Datasource } from '../../infrastructure/__MODULE__.datasource';

const datasource = new __MODULE_PASCAL__Datasource();

export function use__MODULE_PASCAL__() {
  return useQuery({
    queryKey: ['__MODULE__'],
    queryFn: () => datasource.list(),
  });
}
