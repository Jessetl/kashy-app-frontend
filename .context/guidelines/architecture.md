# 🏗 Architecture — Kashy Frontend

> Manual de referencia técnica del cliente móvil. Define la estructura de carpetas, convenciones de nombrado y reglas arquitectónicas.
> Cualquier IA o desarrollador debe consultar este archivo antes de crear archivos, carpetas o componentes.

---

## Principios Arquitectónicos

| Principio                     | Detalle                                                                                                                    |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Patrón**                    | Clean Architecture + Expo Router (file-based routing).                                                                     |
| **Dependencia hacia adentro** | `Presentation → Application → Domain`. El dominio nunca depende de capas externas.                                         |
| **Screens en `app/`**         | Las screens viven en `app/` por requisito de Expo Router. Los dominios contienen components, stores y lógica — no screens. |
| **Shared Kernel**             | Código transversal compartido entre dominios (components UI, hooks, theme, HTTP, storage).                                 |
| **Estado por dominio**        | Un Zustand store por dominio. Los stores no se importan entre sí.                                                          |

---

## Capas por Dominio

```
domain/          → Entidades, interfaces de repositorio (puertos).
                   Puro TypeScript, sin dependencias de React ni frameworks.

application/     → Casos de uso, DTOs, mappers.
                   Depende solo de domain/. Orquesta la lógica de negocio.

infrastructure/  → Implementación de repositorios (HTTP calls via Axios).
                   Depende de domain/ y application/.

presentation/    → Componentes UI, view-model hooks y Zustand store del dominio.
                   Depende de application/. Las screens viven en components/
                   (con sufijo `Screen`); los wrappers de ruta están en app/.

  presentation/components/  → UI completa, incluidas pantallas (`FooScreen.tsx`).
  presentation/hooks/       → View-models (`useFooBarVm.ts`) y hooks de uso
                              cross-componente. Compatible con la regla de capas
                              porque sólo consume application/ + domain/.
  presentation/store/       → Zustand store del dominio (`use{Dominio}Store.ts`).
```

---

## Ubicación física

| Carpeta    | Contenido                                                                       | Casing                    |
| :--------- | :------------------------------------------------------------------------------ | :------------------------ |
| `app/`     | Rutas de Expo Router. Convención de archivos del framework.                     | `kebab-case` (requisito). |
| `modules/` | Dominios del producto (`auth`, `shopping`, `finances`, `notifications`, etc.).  | `kebab-case`.             |
| `shared/`  | Shared kernel: UI, hooks, theme, HTTP, infraestructura compartida.              | `kebab-case`.             |

> Los dominios siempre viven bajo `modules/`. Las screens viven bajo `app/` por requisito de Expo Router; ese es el único lugar donde se permiten archivos en `kebab-case` que actúan como wrappers de componentes del dominio.

## Estructura de Carpetas

```
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── +not-found.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
│   │   ├── shopping/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── [listId].tsx
│   │   │   └── metrics.tsx
│   │   ├── finances/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── [financeId].tsx
│   │   └── profile/
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       └── notification-settings.tsx
│   └── (auth)/
│       ├── _layout.tsx
│       ├── login.tsx
│       ├── register.tsx
│       └── recover-password.tsx
│
├── shared-kernel/
│   ├── shared-kernel.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useKeyboard.ts
│   │   └── useRefreshToken.ts
│   ├── theme/
│   │   ├── tokens.ts
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── ThemeProvider.tsx
│   ├── storage/
│   │   └── async-storage.helper.ts
│   ├── http/
│   │   ├── axios-instance.ts
│   │   ├── interceptors.ts
│   │   └── api-error.handler.ts
│   ├── constants/
│   │   ├── api.constants.ts
│   │   └── device.constants.ts
│   ├── types/
│   │   ├── api-error.type.ts
│   │   ├── paginated-request.type.ts
│   │   └── paginated-response.type.ts
│   └── utils/
│       ├── currency.util.ts
│       ├── date.util.ts
│       └── validation.util.ts
│
├── auth/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── interfaces/
│   │       └── auth.repository.interface.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── login.use-case.ts
│   │   │   ├── login-google.use-case.ts
│   │   │   ├── register.use-case.ts
│   │   │   ├── recover-password.use-case.ts
│   │   │   ├── change-password.use-case.ts
│   │   │   ├── get-profile.use-case.ts
│   │   │   ├── update-profile.use-case.ts
│   │   │   └── logout.use-case.ts
│   │   ├── dtos/
│   │   │   ├── login-request.dto.ts
│   │   │   ├── register-request.dto.ts
│   │   │   ├── change-password-request.dto.ts
│   │   │   ├── update-profile-request.dto.ts
│   │   │   ├── auth-response.dto.ts
│   │   │   └── profile-response.dto.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── auth.repository.ts
│   └── presentation/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   ├── RecoverPasswordForm.tsx
│       │   ├── ProfileCard.tsx
│       │   └── ChangePasswordForm.tsx
│       └── store/
│           └── useAuthStore.ts
│
├── shopping/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── shopping-list.entity.ts
│   │   │   └── shopping-item.entity.ts
│   │   └── interfaces/
│   │       └── shopping.repository.interface.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-shopping-list.use-case.ts
│   │   │   ├── update-shopping-list.use-case.ts
│   │   │   ├── delete-shopping-list.use-case.ts
│   │   │   ├── get-shopping-list.use-case.ts
│   │   │   ├── search-shopping-lists.use-case.ts
│   │   │   └── compare-shopping-lists.use-case.ts
│   │   ├── dtos/
│   │   │   ├── create-shopping-list-request.dto.ts
│   │   │   ├── update-shopping-list-request.dto.ts
│   │   │   ├── search-shopping-lists-request.dto.ts
│   │   │   ├── compare-lists-request.dto.ts
│   │   │   ├── shopping-list-response.dto.ts
│   │   │   ├── shopping-list-summary-response.dto.ts
│   │   │   └── compare-lists-response.dto.ts
│   │   └── mappers/
│   │       ├── shopping-list.mapper.ts
│   │       └── shopping-item.mapper.ts
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── shopping.repository.ts
│   └── presentation/
│       ├── components/
│       │   ├── ShoppingListCard.tsx
│       │   ├── ShoppingItemRow.tsx
│       │   ├── AddItemForm.tsx
│       │   └── CompareResult.tsx
│       └── store/
│           └── useShoppingStore.ts
│
├── finances/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── financial-record.entity.ts
│   │   ├── enums/
│   │   │   ├── financial-type.enum.ts
│   │   │   └── priority.enum.ts
│   │   └── interfaces/
│   │       └── finances.repository.interface.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-financial-record.use-case.ts
│   │   │   ├── update-financial-record.use-case.ts
│   │   │   ├── delete-financial-record.use-case.ts
│   │   │   ├── get-financial-record.use-case.ts
│   │   │   ├── search-financial-records.use-case.ts
│   │   │   └── get-financial-summary.use-case.ts
│   │   ├── dtos/
│   │   │   ├── create-financial-record-request.dto.ts
│   │   │   ├── update-financial-record-request.dto.ts
│   │   │   ├── search-financial-records-request.dto.ts
│   │   │   ├── financial-record-response.dto.ts
│   │   │   └── financial-summary-response.dto.ts
│   │   └── mappers/
│   │       └── financial-record.mapper.ts
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── finances.repository.ts
│   └── presentation/
│       ├── components/
│       │   ├── FinanceRecordCard.tsx
│       │   ├── FinanceForm.tsx
│       │   ├── BalanceSummary.tsx
│       │   └── UpcomingExpenses.tsx
│       └── store/
│           └── useFinancesStore.ts
│
└── notifications/
    ├── domain/
    │   ├── entities/
    │   │   ├── notification.entity.ts
    │   │   └── notification-preference.entity.ts
    │   ├── enums/
    │   │   └── notification-status.enum.ts
    │   └── interfaces/
    │       └── notifications.repository.interface.ts
    ├── application/
    │   ├── use-cases/
    │   │   ├── search-notifications.use-case.ts
    │   │   ├── get-unread-count.use-case.ts
    │   │   ├── mark-as-read.use-case.ts
    │   │   ├── mark-all-as-read.use-case.ts
    │   │   ├── delete-notification.use-case.ts
    │   │   ├── get-notification-preferences.use-case.ts
    │   │   └── update-notification-preferences.use-case.ts
    │   ├── dtos/
    │   │   ├── search-notifications-request.dto.ts
    │   │   ├── notification-response.dto.ts
    │   │   ├── unread-count-response.dto.ts
    │   │   └── notification-preference-response.dto.ts
    │   └── mappers/
    │       ├── notification.mapper.ts
    │       └── notification-preference.mapper.ts
    ├── infrastructure/
    │   └── repositories/
    │       └── notifications.repository.ts
    └── presentation/
        ├── components/
        │   ├── NotificationsDropdown.tsx
        │   ├── NotificationItem.tsx
        │   └── PreferenceToggle.tsx
        └── store/
            └── useNotificationsStore.ts
```

---

## Expo Router — Convenciones

### Grupos de rutas

| Grupo    | Propósito                             | Presentación          |
| :------- | :------------------------------------ | :-------------------- |
| `(tabs)` | Navegación principal con bottom tabs. | Tab navigator.        |
| `(auth)` | Flujo de autenticación.               | Modal sobre los tabs. |

### Layouts

| Archivo                           | Función                                                                   |
| :-------------------------------- | :------------------------------------------------------------------------ |
| `app/_layout.tsx`                 | Root layout. Providers (Theme, Stores). Define grupo `(tabs)` y `(auth)`. |
| `app/(tabs)/_layout.tsx`          | Tab navigator. Configura los 4 tabs con iconos y labels.                  |
| `app/(tabs)/home/_layout.tsx`     | Stack del tab Home.                                                       |
| `app/(tabs)/shopping/_layout.tsx` | Stack del tab Compras.                                                    |
| `app/(tabs)/finances/_layout.tsx` | Stack del tab Finanzas.                                                   |
| `app/(tabs)/profile/_layout.tsx`  | Stack del tab Perfil.                                                     |
| `app/(auth)/_layout.tsx`          | Modal layout. Presentación como modal transparente sobre los tabs.        |

### Rutas dinámicas

| Archivo                    | Ruta resultante      | Param       |
| :------------------------- | :------------------- | :---------- |
| `shopping/[listId].tsx`    | `/shopping/uuid-xxx` | `listId`    |
| `finances/[financeId].tsx` | `/finances/uuid-xxx` | `financeId` |

### Screens y dominios

Las screens en `app/` son archivos **delgados** que solo conectan navegación con lógica:

```typescript
// app/(tabs)/shopping/index.tsx
import { SavedListsScreen } from '@/modules/shopping/presentation/components/SavedListsScreen';

export default function ShoppingIndex() {
  return <SavedListsScreen />;
}
```

> La screen real (componente pesado) vive en `presentation/components/` del dominio bajo el patrón `{Nombre}Screen.tsx`. El archivo en `app/` es solo un wrapper para Expo Router.

---

## Convenciones de Nombrado

### Archivos

| Tipo                 | Patrón                             | Ejemplo                        |
| :------------------- | :--------------------------------- | :----------------------------- |
| Entidad              | `{nombre}.entity.ts`               | `user.entity.ts`               |
| Interfaz repositorio | `{nombre}.repository.interface.ts` | `auth.repository.interface.ts` |
| Repositorio (impl)   | `{nombre}.repository.ts`           | `auth.repository.ts`           |
| Use Case             | `{acción}-{nombre}.use-case.ts`    | `login.use-case.ts`            |
| DTO request          | `{acción}-{nombre}-request.dto.ts` | `login-request.dto.ts`         |
| DTO response         | `{nombre}-response.dto.ts`         | `auth-response.dto.ts`         |
| Mapper               | `{nombre}.mapper.ts`               | `user.mapper.ts`               |
| Componente React     | `{Nombre}.tsx` (PascalCase)        | `LoginForm.tsx`                |
| Screen (componente)  | `{Nombre}Screen.tsx`               | `SavedListsScreen.tsx`         |
| Zustand Store        | `use{Dominio}Store.ts`             | `useAuthStore.ts`              |
| Hook (presentation)  | `use{Nombre}.ts`                   | `useSavedLists.ts`             |
| View-model (hook)    | `use{Nombre}Vm.ts`                 | `useShoppingListsHeaderVm.ts`  |
| Enum                 | `{nombre}.enum.ts`                 | `financial-type.enum.ts`       |
| Util                 | `{nombre}.util.ts`                 | `currency.util.ts`             |
| Constantes           | `{nombre}.constants.ts`            | `api.constants.ts`             |
| Type                 | `{nombre}.type.ts`                 | `api-error.type.ts`            |
| Screen (Expo Router) | `kebab-case.tsx`                   | `notification-settings.tsx`    |
| Layout (Expo Router) | `_layout.tsx`                      | `_layout.tsx`                  |

### Formato general

| Regla                       | Detalle                                   |
| :-------------------------- | :---------------------------------------- |
| **Archivos de lógica**      | `kebab-case` con sufijo de tipo.          |
| **Archivos de componentes** | `PascalCase` sin sufijo.                  |
| **Archivos de Expo Router** | `kebab-case` (requisito del framework).   |
| **Clases/Interfaces**       | `PascalCase`. Interfaces con prefijo `I`. |
| **Stores**                  | `use{Dominio}Store` — siempre hook.       |
| **Variables/funciones**     | `camelCase`.                              |
| **Constantes**              | `UPPER_SNAKE_CASE`.                       |
| **Carpetas**                | `kebab-case`.                             |

---

## Reglas de Dependencia

### ✅ Permitido

```
presentation/components/ → presentation/hooks/ (view-models, hooks de UI)
presentation/components/ → presentation/store/
presentation/hooks/      → application/ → domain/
presentation/            → shared/ (shared kernel)
application/             → shared/ (solo types, utils)
app/ screens             → presentation/components/ del dominio correspondiente
app/ screens             → shared/
```

> Los view-models (`use*Vm.ts`) son hooks de presentación: aglutinan props y handlers para los componentes. Viven en `presentation/hooks/` y no rompen la dirección de dependencia porque sólo consumen `application/`, `domain/` y `presentation/store/`.

### ❌ Prohibido

```
domain/         → application/
domain/         → presentation/
domain/         → infrastructure/
application/    → presentation/
application/    → infrastructure/
auth/           → shopping/ (dominios NO se importan entre sí)
app/ screens    → infrastructure/ directamente (siempre pasar por use cases)
```

### Comunicación entre dominios

Si un dominio necesita datos de otro (ej: notifications necesita saber si el usuario está logueado):

1. **Shared types** en `shared-kernel/types/` — contratos compartidos.
2. **Lectura de store** — un componente en `app/` puede leer de múltiples stores para componer la vista (el Dashboard lee de `useFinancesStore` y `useNotificationsStore`).
3. **Nunca** un dominio importa el store de otro dominio directamente.

> Las screens en `app/` son el único lugar donde se componen datos de múltiples dominios.

---

## Zustand Stores — Convenciones

### Estructura de un store

```typescript
// auth/presentation/store/useAuthStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  // Estado
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Acciones
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setSession: (token, user) => {
    AsyncStorage.setItem('access_token', token);
    set({ accessToken: token, user, isAuthenticated: true });
  },

  clearSession: () => {
    AsyncStorage.removeItem('access_token');
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  updateUser: (user) => set({ user }),
}));
```

### Reglas

| Regla                           | Detalle                                                                                                              |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------- |
| **Un store por dominio**        | `useAuthStore`, `useShoppingStore`, `useFinancesStore`, `useNotificationsStore`.                                     |
| **No importar stores entre sí** | Si `useNotificationsStore` necesita el `userId`, lo recibe como parámetro en el use case, no leyendo `useAuthStore`. |
| **Persistencia**                | Solo datos críticos en AsyncStorage (`access_token`, `theme`). El resto vive en memoria.                             |
| **Acciones simples**            | El store solo guarda/limpia estado. La lógica de negocio vive en los use cases.                                      |
| **Sin lógica HTTP**             | El store nunca llama a APIs. Los use cases llaman al repositorio y luego actualizan el store.                        |

---

## Use Cases en Frontend

A diferencia del backend, los use cases del frontend son más ligeros: llaman al repositorio y actualizan el store.

```typescript
// auth/application/use-cases/login.use-case.ts
export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: LoginRequestDto): Promise<void> {
    const response = await this.authRepository.login(dto);

    useAuthStore
      .getState()
      .setSession(response.access_token, UserMapper.toEntity(response.user));
  }
}
```

### Reglas

| Regla                       | Detalle                                                                                                                         |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Sin try/catch**           | Los errores se propagan al componente que llamó al use case.                                                                    |
| **Actualizan el store**     | Después de la llamada HTTP, actualizan el Zustand store correspondiente.                                                        |
| **Retornan void o datos**   | Si el componente necesita datos específicos, el use case los retorna. Si solo necesita que el store se actualice, retorna void. |
| **Un archivo por use case** | Igual que el backend.                                                                                                           |

---

## Guest Mode — Manejo en Frontend

| Aspecto                   | Detalle                                                                                                                                |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Dónde viven los datos** | AsyncStorage. Nunca llegan al backend.                                                                                                 |
| **Store**                 | Los stores del guest manejan datos locales idénticos en shape a los del backend.                                                       |
| **Migración al login**    | Cuando el guest se autentica, los datos locales se pueden sincronizar al backend (Post-MVP).                                           |
| **AuthGuard**             | Componente/hook que verifica `useAuthStore.isAuthenticated` antes de ejecutar acciones protegidas. Si es guest, muestra el LoginModal. |

```typescript
// shared-kernel/hooks/useAuthGuard.ts
export const useAuthGuard = () => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    action();
  };

  return { requireAuth, isAuthenticated };
};
```
