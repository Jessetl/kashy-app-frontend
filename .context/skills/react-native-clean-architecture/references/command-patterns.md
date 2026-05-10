# Command Patterns — Casos de Uso de Escritura (Frontend)

> Patterns para use cases que mutan estado: create, update, delete, toggle.
> En frontend, los use cases llaman al repositorio y actualizan el Zustand store.

---

## Patrón Base

```typescript
export class XxxUseCase implements UseCase<XxxInput, void> {
  constructor(private readonly repository: IXxxRepository) {}

  async execute(input: XxxInput): Promise<void> {
    const response = await this.repository.xxx(input.dto);
    useXxxStore.getState().someAction(response);
  }
}
```

**Reglas comunes:**

- Sin try/catch — los errores se propagan al componente.
- El use case actualiza el store después de la llamada HTTP.
- El componente solo llama al use case, nunca al repositorio directamente.
- Si la acción es solo para el guest (local), el use case interactúa con AsyncStorage en vez del repositorio.

---

## Subpatrón: Create

**Flujo:** llamar API → recibir entidad creada → agregar al store → opcionalmente navegar.

```typescript
interface CreateOrderInput {
  dto: CreateOrderRequestDto;
}

export class CreateOrderUseCase implements UseCase<
  CreateOrderInput,
  OrderResponseDto
> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: CreateOrderInput): Promise<OrderResponseDto> {
    const created = await this.orderRepository.create(input.dto);
    useOrderStore.getState().addOrder(created);
    return created;
  }
}
```

**En el componente:**

```typescript
const CreateOrderScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (data: CreateOrderFormData) => {
    setLoading(true);
    setError(null);

    try {
      const dto = OrderMapper.toCreateRequest(data);
      const created = await createOrderUseCase.execute({ dto });
      router.push(`/orders/${created.id}`);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return <OrderForm onSubmit={handleSubmit} loading={loading} error={error} />;
};
```

**Checklist:**

- El use case retorna la entidad creada (para que el componente pueda navegar con el ID).
- El store se actualiza dentro del use case, no en el componente.
- El componente maneja loading/error states.
- La navegación ocurre en el componente, no en el use case.

---

## Subpatrón: Update

**Flujo:** llamar API con cambios parciales → recibir entidad actualizada → reemplazar en store.

```typescript
interface UpdateOrderInput {
  orderId: string;
  dto: UpdateOrderRequestDto;
}

export class UpdateOrderUseCase implements UseCase<
  UpdateOrderInput,
  OrderResponseDto
> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: UpdateOrderInput): Promise<OrderResponseDto> {
    const updated = await this.orderRepository.update(input.orderId, input.dto);
    useOrderStore.getState().replaceOrder(updated);
    return updated;
  }
}
```

**Checklist:**

- Enviar solo los campos que cambiaron (PATCH).
- El store reemplaza el item completo con la respuesta del backend.
- No hacer un GET adicional — el PATCH ya devuelve el recurso actualizado.

---

## Subpatrón: Delete

**Flujo:** llamar API → recibir 204 → remover del store → navegar atrás.

```typescript
interface DeleteOrderInput {
  orderId: string;
}

export class DeleteOrderUseCase implements UseCase<DeleteOrderInput, void> {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: DeleteOrderInput): Promise<void> {
    await this.orderRepository.delete(input.orderId);
    useOrderStore.getState().removeOrder(input.orderId);
  }
}
```

**En el componente:**

```typescript
const handleDelete = async () => {
  try {
    await deleteOrderUseCase.execute({ orderId });
    router.back();
  } catch (err) {
    const apiError = handleApiError(err);
    setError(apiError.message);
  }
};
```

**Checklist:**

- El use case retorna void (204 No Content).
- El store remueve el item localmente.
- La navegación (back) ocurre en el componente.

---

## Subpatrón: Toggle / Action

**Flujo:** llamar API → recibir entidad actualizada → actualizar en store.

```typescript
interface ToggleItemInput {
  itemId: string;
}

export class ToggleItemUseCase implements UseCase<
  ToggleItemInput,
  ItemResponseDto
> {
  constructor(private readonly itemRepository: IItemRepository) {}

  async execute(input: ToggleItemInput): Promise<ItemResponseDto> {
    const updated = await this.itemRepository.toggleChecked(input.itemId);
    useItemStore.getState().replaceItem(updated);
    return updated;
  }
}
```

### Optimistic Update (variante rápida)

Para acciones frecuentes (toggle, mark as read), actualizar el store antes de la API para UX inmediata:

```typescript
export class ToggleItemUseCase implements UseCase<ToggleItemInput, void> {
  constructor(private readonly itemRepository: IItemRepository) {}

  async execute(input: ToggleItemInput): Promise<void> {
    const store = useItemStore.getState();
    const previous = store.getItem(input.itemId);

    // Optimistic: actualizar UI inmediatamente
    store.toggleItemLocally(input.itemId);

    try {
      await this.itemRepository.toggleChecked(input.itemId);
    } catch {
      // Rollback si falla
      store.replaceItem(previous);
      throw error;
    }
  }
}
```

**Cuándo usar optimistic update:**

- Acciones frecuentes y rápidas (toggle checkbox, mark as read).
- La acción es reversible.
- La latencia de red afecta la UX.

**Cuándo NO usar:**

- Crear o eliminar entidades.
- Operaciones financieras o irreversibles.

---

## Guest Mode — Commands Locales

Cuando el usuario es guest, los commands no llaman al API sino que persisten en AsyncStorage:

```typescript
export class CreateOrderGuestUseCase implements UseCase<
  CreateOrderInput,
  void
> {
  async execute(input: CreateOrderInput): Promise<void> {
    const id = generateUUID();
    const localOrder = { id, ...input.dto, isLocal: true };

    // Guardar en AsyncStorage
    const stored = (await getFromStorage<Order[]>('guest_orders')) ?? [];
    stored.push(localOrder);
    await saveToStorage('guest_orders', stored);

    // Actualizar store
    useOrderStore.getState().addOrder(localOrder);
  }
}
```

**Regla:** los use cases del guest tienen el mismo interface que los del usuario autenticado. El componente no sabe si está en modo guest o no — solo llama al use case correspondiente.

---

## Error Handling en Commands

```typescript
// En el componente — único lugar donde se maneja el error para la UI
const handleSubmit = async (data: FormData) => {
  setLoading(true);
  setError(null);
  setFieldErrors({});

  try {
    await createUseCase.execute({ dto: data });
  } catch (err) {
    if (isApiError(err) && err.response?.status === 422) {
      setFieldErrors(mapFieldErrors(err.response.data.fields));
    } else {
      setError(getErrorMessage(err));
    }
  } finally {
    setLoading(false);
  }
};
```

**Reglas:**

- El use case **nunca** hace try/catch (excepto optimistic update rollback).
- El componente maneja loading, error global y field errors.
- Usar `shared-kernel/http/api-error.handler.ts` para parsear errores.
- Los errores 422 se mapean a errores por campo para el formulario.
