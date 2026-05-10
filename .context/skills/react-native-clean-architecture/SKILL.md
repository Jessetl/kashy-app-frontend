---
name: react-native-clean-architecture
description: Guía para generar código React Native con Clean Architecture y Expo Router. Usa esta skill cuando el usuario pida crear screens, componentes, stores, use cases, repositorios, DTOs, mappers o cualquier componente de un proyecto React Native con arquitectura limpia. También se activa cuando pida refactorizar código existente hacia Clean Architecture, crear nuevos dominios, implementar patrones como Repository, Store, Use Case, o cuando mencione separación por capas (domain, application, infrastructure, presentation). Actívala incluso si el usuario solo dice "crea una pantalla", "agrega un componente", "nuevo módulo" o "implementa el store de X" en contexto React Native o Expo.
---

# React Native Clean Architecture — Skill

> Guía genérica para generar código React Native con Clean Architecture y Expo Router.
> Define capas, reglas de dependencia, convenciones y patrones reutilizables para cualquier proyecto.
> Para estructura específica de un proyecto, consultar su `architecture.md`.

---

## Capas y Dirección de Dependencia

```
app/ screens     → presentation/ → application/ → domain/
(Expo Router)       Components      Use Cases       Entities
                    Stores          DTOs            Interfaces
                                    Mappers         Enums
```

**Regla de oro:** las dependencias siempre apuntan hacia adentro. El dominio nunca importa de capas externas.

---

## Capas en Detalle

### Domain (Núcleo)

La capa más interna. Puro TypeScript, sin dependencias de React, React Native ni frameworks.

| Elemento                  | Ubicación            | Reglas                                                                    |
| :------------------------ | :------------------- | :------------------------------------------------------------------------ |
| Entidades                 | `domain/entities/`   | Sin hooks, sin JSX, sin imports de React. Clases o interfaces puras.      |
| Enums                     | `domain/enums/`      | Valores en `UPPER_SNAKE_CASE`.                                            |
| Interfaces de repositorio | `domain/interfaces/` | Definen el contrato (puerto). El repositorio real vive en infrastructure. |

```typescript
// Ejemplo: entidad
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

// Ejemplo: interfaz de repositorio
export interface IAuthRepository {
  login(dto: LoginRequestDto): Promise<AuthResponseDto>;
  register(dto: RegisterRequestDto): Promise<AuthResponseDto>;
  getProfile(): Promise<ProfileResponseDto>;
  updateProfile(dto: UpdateProfileRequestDto): Promise<ProfileResponseDto>;
  logout(): Promise<void>;
}
```

### Application (Casos de Uso)

Orquesta la lógica de negocio. Depende solo de domain.

| Elemento  | Ubicación                | Reglas                                                                 |
| :-------- | :----------------------- | :--------------------------------------------------------------------- |
| Use Cases | `application/use-cases/` | Un archivo por caso de uso. Llama al repositorio y actualiza el store. |
| DTOs      | `application/dtos/`      | Interfaces TypeScript para request/response del API.                   |
| Mappers   | `application/mappers/`   | Convierte DTOs ↔ entidades. Métodos estáticos.                         |

```typescript
// Interfaz base para todos los use cases
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
```

**Reglas de Use Cases en frontend:**

- Más ligeros que en backend: llaman al repo → actualizan el store.
- Sin try/catch — los errores se propagan al componente.
- Un archivo por use case.
- El store se actualiza desde el use case, nunca desde el componente directamente.

### Infrastructure (HTTP / Adaptadores)

Conecta con el mundo exterior. Depende de domain y application.

| Elemento     | Ubicación                      | Reglas                                                           |
| :----------- | :----------------------------- | :--------------------------------------------------------------- |
| Repositories | `infrastructure/repositories/` | Implementan la interfaz del dominio. Usan Axios para HTTP calls. |

```typescript
// Ejemplo: repositorio HTTP
import { axiosInstance } from '@/shared-kernel/http/axios-instance';

export class AuthRepository implements IAuthRepository {
  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(
      '/auth/login',
      dto,
    );
    return data;
  }

  async getProfile(): Promise<ProfileResponseDto> {
    const { data } =
      await axiosInstance.get<ProfileResponseDto>('/auth/profile');
    return data;
  }
}
```

**Reglas del repositorio:**

- Solo HTTP calls — sin lógica de negocio, sin actualizaciones de store.
- Tipado estricto con DTOs en request y response.
- Usa la instancia de Axios compartida (que ya tiene interceptors y refresh token).

### Presentation (UI + Estado)

Componentes React Native y Zustand stores. **NO contiene screens** (viven en `app/`).

| Elemento   | Ubicación                  | Reglas                                                                              |
| :--------- | :------------------------- | :---------------------------------------------------------------------------------- |
| Components | `presentation/components/` | Componentes de UI del dominio. Pueden ser screens completas o componentes pequeños. |
| Store      | `presentation/store/`      | Un Zustand store por dominio.                                                       |

---

## Shared Kernel

Código transversal compartido entre dominios.

| Elemento   | Ubicación                   | Qué contiene                                                            |
| :--------- | :-------------------------- | :---------------------------------------------------------------------- |
| Components | `shared-kernel/components/` | Componentes UI reutilizables (Button, Input, Modal, Toast).             |
| Hooks      | `shared-kernel/hooks/`      | useDebounce, useKeyboard, useAuthGuard.                                 |
| Theme      | `shared-kernel/theme/`      | ThemeProvider, tokens, light/dark.                                      |
| HTTP       | `shared-kernel/http/`       | Axios instance, interceptors, refresh logic.                            |
| Storage    | `shared-kernel/storage/`    | AsyncStorage helpers.                                                   |
| Types      | `shared-kernel/types/`      | Interfaces compartidas (ApiError, PaginatedRequest, PaginatedResponse). |
| Utils      | `shared-kernel/utils/`      | Formatters, validators, date/currency helpers.                          |
| Constants  | `shared-kernel/constants/`  | API base URL, device info, enums compartidos.                           |

---

## Expo Router — Screens como Wrappers

Las screens en `app/` son archivos **delgados** que solo conectan la navegación con el componente del dominio:

```typescript
// app/(tabs)/catalog/index.tsx
import { CatalogScreen } from '@/catalog/presentation/components/CatalogScreen';

export default function Catalog() {
  return <CatalogScreen />;
}
```

```typescript
// app/(tabs)/catalog/[itemId].tsx
import { useLocalSearchParams } from 'expo-router';
import { CatalogDetailScreen } from '@/catalog/presentation/components/CatalogDetailScreen';

export default function CatalogDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  return <CatalogDetailScreen itemId={itemId} />;
}
```

**Reglas:**

- Máximo 10 líneas por archivo en `app/`.
- Solo importan de `presentation/components/` del dominio correspondiente.
- Extraen params de Expo Router y los pasan como props.
- Nunca contienen lógica de negocio, llamadas HTTP ni actualizaciones de store.

---

## Reglas de Dependencia

### ✅ Permitido

```
presentation/ → application/ → domain/
presentation/ → shared-kernel/
app/ screens  → presentation/components/
app/ screens  → shared-kernel/
```

### ❌ Prohibido

```
domain/         → application/
domain/         → presentation/
domain/         → infrastructure/
application/    → presentation/
application/    → infrastructure/
orders/         → payments/  (dominios NO se importan entre sí)
app/ screens    → infrastructure/ (siempre pasar por use cases)
store A         → store B    (stores no se importan entre sí)
```

### Composición en `app/`

Las screens en `app/` son el **único lugar** donde se componen datos de múltiples dominios:

```typescript
// app/(tabs)/home/index.tsx — compone datos de múltiples dominios
import { DashboardScreen } from '@/orders/presentation/components/DashboardScreen';

export default function Home() {
  return <DashboardScreen />;
}

// Dentro de DashboardScreen, el componente puede usar hooks de su dominio.
// Si necesita datos de otro dominio (badge count), se pasa como prop
// desde un componente padre en app/ o se usa un shared hook.
```

---

## Convenciones de Nombrado

| Tipo                   | Patrón archivo                     | Patrón clase/interfaz                       |
| :--------------------- | :--------------------------------- | :------------------------------------------ |
| Entidad                | `{nombre}.entity.ts`               | `interface {Nombre}`                        |
| Repositorio (interfaz) | `{nombre}.repository.interface.ts` | `interface I{Nombre}Repository`             |
| Repositorio (impl)     | `{nombre}.repository.ts`           | `class {Nombre}Repository`                  |
| Use Case               | `{acción}-{nombre}.use-case.ts`    | `class {Acción}{Nombre}UseCase`             |
| DTO request            | `{acción}-{nombre}-request.dto.ts` | `interface {Acción}{Nombre}RequestDto`      |
| DTO response           | `{nombre}-response.dto.ts`         | `interface {Nombre}ResponseDto`             |
| Mapper                 | `{nombre}.mapper.ts`               | `class {Nombre}Mapper` (static methods)     |
| Componente             | `{Nombre}.tsx` (PascalCase)        | `const {Nombre}: React.FC`                  |
| Store                  | `use{Dominio}Store.ts`             | `export const use{Dominio}Store`            |
| Hook                   | `use{Nombre}.ts`                   | `export const use{Nombre}`                  |
| Enum                   | `{nombre}.enum.ts`                 | `enum {Nombre}` — `UPPER_SNAKE_CASE` values |
| Screen (Expo Router)   | `kebab-case.tsx`                   | `export default function`                   |

**Formato general:** archivos de lógica en `kebab-case`, componentes en `PascalCase`, variables en `camelCase`, constantes en `UPPER_SNAKE_CASE`.

---

## References

Antes de generar código, consultar los archivos de referencia según el tipo de tarea:

| Archivo                                                              | Cuándo consultarlo                                                                   |
| :------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| [`references/command-patterns.md`](./references/command-patterns.md) | Al crear use cases que mutan estado: create, update, delete, toggle.                 |
| [`references/query-patterns.md`](./references/query-patterns.md)     | Al crear use cases de lectura: getById, list, search, summary.                       |
| [`references/store-patterns.md`](./references/store-patterns.md)     | Al crear o modificar Zustand stores, manejar estado local, guest mode, persistencia. |
| [`references/test-criteria.md`](./references/test-criteria.md)       | Al validar que el código generado cumple con la arquitectura.                        |
