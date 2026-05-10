# Store Patterns — Zustand para React Native

> Patterns para crear, estructurar y usar Zustand stores en React Native con Clean Architecture.

---

## Estructura Base de un Store

```typescript
import { create } from 'zustand';

interface OrderState {
  // Estado
  orders: OrderSummaryResponseDto[];
  currentOrder: OrderResponseDto | null;
  meta: PaginationMeta | null;

  // Acciones
  setOrders: (orders: OrderSummaryResponseDto[]) => void;
  appendOrders: (orders: OrderSummaryResponseDto[]) => void;
  setCurrentOrder: (order: OrderResponseDto | null) => void;
  addOrder: (order: OrderResponseDto) => void;
  replaceOrder: (order: OrderResponseDto) => void;
  removeOrder: (orderId: string) => void;
  setMeta: (meta: PaginationMeta) => void;
  reset: () => void;
}

const initialState = {
  orders: [],
  currentOrder: null,
  meta: null,
};

export const useOrderStore = create<OrderState>((set) => ({
  ...initialState,

  setOrders: (orders) => set({ orders }),

  appendOrders: (orders) =>
    set((state) => ({ orders: [...state.orders, ...orders] })),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  replaceOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
      currentOrder:
        state.currentOrder?.id === order.id ? order : state.currentOrder,
    })),

  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
      currentOrder:
        state.currentOrder?.id === orderId ? null : state.currentOrder,
    })),

  setMeta: (meta) => set({ meta }),

  reset: () => set(initialState),
}));
```

**Reglas:**

- Siempre definir `initialState` separado para poder hacer `reset()`.
- `replaceOrder` actualiza tanto en la lista como en `currentOrder`.
- `removeOrder` limpia de la lista y del detalle.
- `appendOrders` para paginación (no reemplaza, agrega).

---

## Store de Autenticación

El store de auth es especial porque maneja persistencia con AsyncStorage:

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setSession: (token: string, user: User) => void;
  clearSession: () => void;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: async (token, user) => {
    await AsyncStorage.setItem('access_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ accessToken: token, user, isAuthenticated: true });
  },

  clearSession: async () => {
    await AsyncStorage.multiRemove(['access_token', 'user']);
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  updateUser: async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (token && user) {
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
```

**`hydrate()`** se llama en el Splash/Root layout al iniciar la app para restaurar la sesión desde AsyncStorage.

---

## Store de Theme (Light/Dark)

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',

  toggle: async () => {
    const newMode = get().mode === 'light' ? 'dark' : 'light';
    await AsyncStorage.setItem('theme_mode', newMode);
    set({ mode: newMode });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem('theme_mode');
      if (stored === 'light' || stored === 'dark') {
        set({ mode: stored });
      }
    } catch {
      // Default light
    }
  },
}));
```

> El theme store vive en `shared-kernel/` porque es transversal — no pertenece a ningún dominio.

---

## Guest Mode Store

Cuando el usuario es guest, los datos se guardan en AsyncStorage en vez del backend:

```typescript
interface GuestOrderState {
  localOrders: Order[];
  addLocalOrder: (order: Order) => void;
  toggleLocalItem: (orderId: string, itemId: string) => void;
  clearLocalData: () => void;
  hydrate: () => Promise<void>;
}

export const useGuestOrderStore = create<GuestOrderState>((set, get) => ({
  localOrders: [],

  addLocalOrder: async (order) => {
    const updated = [...get().localOrders, order];
    await AsyncStorage.setItem('guest_orders', JSON.stringify(updated));
    set({ localOrders: updated });
  },

  toggleLocalItem: async (orderId, itemId) => {
    const updated = get().localOrders.map((order) => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        items: order.items.map((item) =>
          item.id === itemId ? { ...item, isChecked: !item.isChecked } : item,
        ),
      };
    });
    await AsyncStorage.setItem('guest_orders', JSON.stringify(updated));
    set({ localOrders: updated });
  },

  clearLocalData: async () => {
    await AsyncStorage.removeItem('guest_orders');
    set({ localOrders: [] });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem('guest_orders');
      if (stored) set({ localOrders: JSON.parse(stored) });
    } catch {
      // Ignore
    }
  },
}));
```

**Regla:** los datos del guest se limpian opcionalmente cuando el usuario se autentica (migración al backend es Post-MVP).

---

## Selectors — Leer Eficientemente del Store

```typescript
// ❌ Re-renderiza cuando CUALQUIER cosa del store cambia
const Component = () => {
  const store = useOrderStore();
  return <Text>{store.orders.length}</Text>;
};

// ✅ Re-renderiza solo cuando orders cambia
const Component = () => {
  const orders = useOrderStore((s) => s.orders);
  return <Text>{orders.length}</Text>;
};

// ✅ Selector derivado — re-renderiza solo cuando el conteo cambia
const Component = () => {
  const count = useOrderStore((s) => s.orders.length);
  return <Text>{count}</Text>;
};

// ✅ Selector con filtro
const Component = () => {
  const activeOrders = useOrderStore((s) =>
    s.orders.filter((o) => o.isActive),
  );
  return <OrderList data={activeOrders} />;
};
```

**Regla:** siempre usar selectors con función arrow. Nunca hacer `useStore()` sin selector.

---

## Acceder al Store fuera de React

Los use cases no son componentes React, pero necesitan acceder al store:

```typescript
// ✅ Correcto: usar getState() fuera de React
export class CreateOrderUseCase {
  async execute(input: CreateOrderInput): Promise<void> {
    const response = await this.repository.create(input.dto);
    useOrderStore.getState().addOrder(response);
  }
}

// ✅ Correcto: leer estado actual
const currentUser = useAuthStore.getState().user;

// ❌ Incorrecto: usar el hook fuera de React
const store = useOrderStore(); // Error — hooks solo funcionan en componentes
```

---

## Reglas Globales de Stores

| Regla                              | Detalle                                                                                                             |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Un store por dominio**           | `useAuthStore`, `useOrderStore`, `usePaymentStore`, `useAlertStore`. Excepciones: `useThemeStore` en shared-kernel. |
| **Stores no se importan entre sí** | Si un use case necesita datos de otro dominio, los recibe como parámetro.                                           |
| **Sin lógica HTTP**                | El store nunca llama a APIs. Los use cases se encargan.                                                             |
| **Acciones simples**               | Set, append, replace, remove, reset. Sin lógica de negocio.                                                         |
| **Selectors siempre**              | Nunca `useStore()` sin selector arrow.                                                                              |
| **Persistencia selectiva**         | Solo `access_token`, `user` y `theme` en AsyncStorage. El resto vive en memoria.                                    |
| **Hydrate en Splash**              | Llamar `hydrate()` de auth y theme al iniciar la app.                                                               |
| **Reset en logout**                | Llamar `reset()` de todos los stores al hacer logout.                                                               |
