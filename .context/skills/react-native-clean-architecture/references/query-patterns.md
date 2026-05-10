# Query Patterns — Casos de Uso de Lectura (Frontend)

> Patterns para use cases que leen datos sin mutar estado: getById, list, search, summary.

---

## Patrón Base

Los use cases de lectura en frontend: llaman al repositorio → mapean si es necesario → actualizan el store.

```typescript
export class GetXxxUseCase implements UseCase<GetXxxInput, XxxResponseDto> {
  constructor(private readonly repository: IXxxRepository) {}

  async execute(input: GetXxxInput): Promise<XxxResponseDto> {
    const data = await this.repository.getById(input.id);
    useXxxStore.getState().setCurrentItem(data);
    return data;
  }
}
```

---

## Subpatrón: GetById

**Flujo:** llamar API con ID → guardar en store → retornar datos.

```typescript
interface GetOrderByIdInput {
  orderId: string;
}

export class GetOrderByIdUseCase implements UseCase<
  GetOrderByIdInput,
  OrderResponseDto
> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: GetOrderByIdInput): Promise<OrderResponseDto> {
    const order = await this.orderRepository.getById(input.orderId);
    useOrderStore.getState().setCurrentOrder(order);
    return order;
  }
}
```

**En el componente:**

```typescript
const OrderDetailScreen: React.FC<{ orderId: string }> = ({ orderId }) => {
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        await getOrderByIdUseCase.execute({ orderId });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentOrder) return null;

  return <OrderDetail order={currentOrder} />;
};
```

**Checklist:**

- Cargar datos en `useEffect` al montar el componente.
- Manejar estados: loading, error, data.
- Leer del store, no del return del use case (el store es la fuente de verdad para la UI).

---

## Subpatrón: Search (Paginado con filtros)

**Flujo:** enviar page + limit + filters → recibir data + meta → agregar al store.

```typescript
interface SearchOrdersInput {
  page: number;
  limit: number;
  filters: OrderFilters;
}

export class SearchOrdersUseCase implements UseCase<
  SearchOrdersInput,
  PaginatedResponse<OrderSummaryResponseDto>
> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(
    input: SearchOrdersInput,
  ): Promise<PaginatedResponse<OrderSummaryResponseDto>> {
    const result = await this.orderRepository.search(input);

    const store = useOrderStore.getState();

    if (input.page === 1) {
      store.setOrders(result.data);
    } else {
      store.appendOrders(result.data);
    }

    store.setMeta(result.meta);
    return result;
  }
}
```

**En el componente con infinite scroll:**

```typescript
const OrderListScreen: React.FC = () => {
  const orders = useOrderStore((s) => s.orders);
  const meta = useOrderStore((s) => s.meta);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});

  const loadPage = async (page: number) => {
    setLoading(true);
    try {
      await searchOrdersUseCase.execute({ page, limit: 20, filters });
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
  }, [filters]);

  const loadMore = () => {
    if (meta && meta.page < meta.total_pages && !loading) {
      loadPage(meta.page + 1);
    }
  };

  return (
    <FlatList
      data={orders}
      renderItem={({ item }) => <OrderCard order={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
};
```

**Checklist:**

- Page 1 → `setOrders` (reemplaza). Page 2+ → `appendOrders` (agrega).
- Guardar `meta` en el store para saber si hay más páginas.
- Infinite scroll con `onEndReached` de FlatList.
- Cuando cambian los filtros, volver a page 1.

---

## Subpatrón: Summary / Stats

**Flujo:** llamar API con parámetros opcionales → guardar en store → renderizar en dashboard.

```typescript
interface GetSummaryInput {
  month?: number;
  year?: number;
}

export class GetSummaryUseCase implements UseCase<
  GetSummaryInput,
  SummaryResponseDto
> {
  constructor(private readonly repository: ISummaryRepository) {}

  async execute(input: GetSummaryInput): Promise<SummaryResponseDto> {
    const summary = await this.repository.getSummary(input.month, input.year);
    useSummaryStore.getState().setSummary(summary);
    return summary;
  }
}
```

**Checklist:**

- Los params son opcionales — el backend usa defaults (mes/año actual).
- Llamar al cargar el dashboard y al cambiar de mes.
- El store guarda el summary completo para evitar re-fetching innecesario.

---

## Subpatrón: Compare (múltiples entidades)

**Flujo:** enviar IDs → recibir resultado de comparación → no guardar en store (datos transitorios).

```typescript
interface CompareInput {
  entityAId: string;
  entityBId: string;
}

export class CompareEntitiesUseCase implements UseCase<
  CompareInput,
  CompareResponseDto
> {
  constructor(private readonly repository: IEntityRepository) {}

  async execute(input: CompareInput): Promise<CompareResponseDto> {
    return this.repository.compare(input.entityAId, input.entityBId);
  }
}
```

**En el componente:**

```typescript
const CompareScreen: React.FC = () => {
  const [result, setResult] = useState<CompareResponseDto | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async (idA: string, idB: string) => {
    setLoading(true);
    try {
      const data = await compareUseCase.execute({ entityAId: idA, entityBId: idB });
      setResult(data);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return <CompareView result={result} onCompare={handleCompare} loading={loading} />;
};
```

**Nota:** los resultados de comparación son transitorios — se guardan en estado local del componente (`useState`), no en el Zustand store. No tiene sentido persistirlos.

---

## Mapper — Patrón de Referencia

```typescript
export class OrderMapper {
  static toEntity(dto: OrderResponseDto): Order {
    return {
      id: dto.id,
      title: dto.title,
      amount: dto.amount_local,
      amountUsd: dto.amount_usd,
      date: new Date(dto.date),
    };
  }

  static toCreateRequest(form: OrderFormData): CreateOrderRequestDto {
    return {
      title: form.title.trim(),
      amount_local: form.amount,
      amount_usd: form.amountUsd,
      date: form.date.toISOString().split('T')[0],
    };
  }

  static toSummary(dto: OrderResponseDto): OrderSummary {
    return {
      id: dto.id,
      title: dto.title,
      total: dto.amount_local,
    };
  }
}
```

**Reglas:**

- Métodos estáticos, sin estado.
- `toEntity`: DTO del API → entidad del dominio (camelCase, tipos correctos).
- `toCreateRequest`: datos del formulario → DTO del API (snake_case, formateado).
- `toSummary`: DTO → versión reducida para listas.
- Vive en `application/mappers/`.

---

## Cuándo guardar en Store vs Estado Local

| Dato                          | Dónde      | Por qué                                        |
| :---------------------------- | :--------- | :--------------------------------------------- |
| Lista de items (paginada)     | Store      | Persiste entre navegaciones dentro del tab.    |
| Detalle de item actual        | Store      | Puede ser consultado por otros componentes.    |
| Summary / stats del dashboard | Store      | Se muestra al volver al tab Home.              |
| Resultado de comparación      | `useState` | Es transitorio, no se reutiliza.               |
| Form data en edición          | `useState` | Es local al formulario, se descarta al cerrar. |
| Loading / error states        | `useState` | Son estados de UI, no de negocio.              |
