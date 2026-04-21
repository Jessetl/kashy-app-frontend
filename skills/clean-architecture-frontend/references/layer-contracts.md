# Contratos por Capa — Código de Referencia

Guía detallada con ejemplos de código para cada capa de Clean Architecture. Lee esta referencia cuando necesites implementar un artefacto específico (entity, DTO, use case, etc.) y necesites recordar el contrato exacto.

**Regla fundamental**: todo el código de features vive en `modules/`, NUNCA en `app/`. Los archivos de `app/` son thin wrappers de 1-3 líneas que re-exportan screens desde `modules/`.

## Tabla de Contenidos

1. [Domain — Entities](#domain-layer--entities)
2. [Domain — Value Objects](#domain-layer--value-objects)
3. [Domain — Errors](#domain-layer--errors)
4. [Application — Ports](#application-layer--ports-interfaces-de-repositorio)
5. [Application — DTOs](#application-layer--dtos)
6. [Application — Mappers](#application-layer--mappers)
7. [Application — Use Cases](#application-layer--use-cases)
8. [Infrastructure — Repository Implementation](#infrastructure-layer--repository-implementation)
9. [Infrastructure — Datasources](#infrastructure-layer--datasources)
10. [Presentation — Hooks](#presentation-layer--hooks)
11. [Presentation — Screens](#presentation-layer--screens)
12. [app/ — Thin Wrappers (Expo Router)](#app--thin-wrappers-expo-router)
13. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)

---

## Domain Layer — Entities

Las entidades son objetos puros de TypeScript que representan conceptos del negocio. No tienen dependencias externas, no conocen React, Expo, ni ninguna librería. Son la fuente de verdad del dominio.

```typescript
// modules/auth/domain/entities/user.entity.ts

export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly role: UserRole;
  readonly createdAt: Date;
}

export type UserRole = 'player' | 'admin' | 'coach';

/**
 * Regla de negocio: determina si el usuario tiene permisos de gestión.
 * Esta lógica vive en domain porque es una regla del negocio,
 * no de la UI ni de la infraestructura.
 */
export function canManageTeam(user: User): boolean {
  return user.role === 'admin' || user.role === 'coach';
}
```

**Reglas de entities:**

- Solo `interface`, `type`, `enum` y funciones puras.
- Sin imports de librerías externas (ni React, ni Zod, ni Axios).
- Las reglas de negocio que dependen solo de la entidad van aquí como funciones puras.
- Propiedades `readonly` cuando el dato no debe mutar.

---

## Domain Layer — Value Objects

Encapsulan un valor con validación y lógica propia. La diferencia con una entidad es que no tienen identidad — dos emails iguales son el mismo value object.

```typescript
// modules/auth/domain/value-objects/email.vo.ts

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

**Reglas de value objects:**

- Constructor privado + factory method `create()`.
- Validación en el momento de creación — un value object inválido no puede existir.
- Inmutables siempre.
- Úsalos cuando la validación o comparación del valor tenga lógica de negocio. Si es solo un string sin reglas, usa el tipo primitivo directamente.

---

## Domain Layer — Errors

Errores tipados del dominio. Permiten que las capas superiores identifiquen qué salió mal sin acoplarse a detalles de implementación.

```typescript
// modules/auth/domain/errors/auth.errors.ts

export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS' as const;
  constructor() {
    super('Las credenciales proporcionadas son inválidas');
    this.name = 'InvalidCredentialsError';
  }
}

export class SessionExpiredError extends Error {
  readonly code = 'SESSION_EXPIRED' as const;
  constructor() {
    super('La sesión ha expirado, por favor inicia sesión nuevamente');
    this.name = 'SessionExpiredError';
  }
}

export type AuthError = InvalidCredentialsError | SessionExpiredError;
```

---

## Application Layer — Ports (Interfaces de Repositorio)

Los ports definen el **contrato** que la capa de Infrastructure debe cumplir. Application nunca sabe quién implementa el contrato — solo sabe que existe.

```typescript
// modules/auth/application/ports/auth.repository.ts

import type { User } from '../../domain/entities/user.entity';
import type { LoginRequestDto } from '../dtos/login-request.dto';
import type { AuthTokensDto } from '../dtos/auth-tokens.dto';

export interface AuthRepository {
  login(credentials: LoginRequestDto): Promise<AuthTokensDto>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<AuthTokensDto>;
  isAuthenticated(): Promise<boolean>;
}
```

**Reglas de ports:**

- Solo `interface`, nunca `class`.
- Vive en `application/ports/`, no en `domain/` ni en `infrastructure/`.
- Los métodos reciben y retornan DTOs o Entities — nunca tipos de fetch, MMKV, o cualquier librería.
- Nombra la interfaz sin sufijo `Interface` — usa el nombre conceptual: `AuthRepository`, no `IAuthRepository` ni `AuthRepositoryInterface`.

---

## Application Layer — DTOs

Data Transfer Objects: objetos planos que definen la forma de los datos que cruzan fronteras entre capas. Cada DTO tiene su schema Zod para validación en runtime.

```typescript
// modules/auth/application/dtos/login-request.dto.ts

import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
```

```typescript
// modules/auth/application/dtos/login-response.dto.ts

import { z } from 'zod';

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
    role: z.enum(['player', 'admin', 'coach']),
    createdAt: z.string().datetime(),
  }),
});

export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;
```

**Reglas de DTOs:**

- Un DTO por operación o grupo lógico, no uno genérico que sirva para todo.
- El schema Zod y el type se exportan juntos desde el mismo archivo.
- Los DTOs son la frontera de validación: todo dato externo (API, formulario, storage) pasa por un DTO antes de entrar a Application.
- Los DTOs son planos (no clases, no métodos) — solo datos.

---

## Application Layer — Mappers

Transforman datos entre DTOs y Entities. La razón de existir de los mappers es que la forma de los datos en la API (DTO) raramente coincide exactamente con la forma que el dominio necesita (Entity).

```typescript
// modules/auth/application/mappers/user.mapper.ts

import type { User } from '../../domain/entities/user.entity';
import type { LoginResponseDto } from '../dtos/login-response.dto';

export const UserMapper = {
  fromLoginResponse(dto: LoginResponseDto): User {
    return {
      id: dto.user.id,
      email: dto.user.email,
      displayName: dto.user.displayName,
      avatarUrl: dto.user.avatarUrl,
      role: dto.user.role,
      createdAt: new Date(dto.user.createdAt),
    };
  },
} as const;
```

**Reglas de mappers:**

- Objeto con métodos estáticos (`as const`), no clase.
- Nombres descriptivos: `fromLoginResponse`, `toCreateRequest`, `fromApiList`.
- Un mapper por entity/concepto, no uno por DTO.
- Sin efectos secundarios — funciones puras.

---

## Application Layer — Use Cases

El use case es el **orquestador del flujo**. Recibe datos validados, coordina entre repositorios y entidades, y retorna el resultado. Cada use case representa una acción concreta del usuario.

```typescript
// modules/auth/application/use-cases/login.use-case.ts

import type { AuthRepository } from '../ports/auth.repository';
import type { LoginRequestDto } from '../dtos/login-request.dto';
import { LoginRequestSchema } from '../dtos/login-request.dto';
import { UserMapper } from '../mappers/user.mapper';
import type { User } from '../../domain/entities/user.entity';

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: LoginRequestDto): Promise<User> {
    // 1. Validar input
    const validated = LoginRequestSchema.parse(input);

    // 2. Ejecutar operación a través del repositorio
    const response = await this.authRepository.login(validated);

    // 3. Transformar respuesta a entidad de dominio
    return UserMapper.fromLoginResponse(response);
  }
}
```

**Reglas de use cases:**

- Una clase con un solo método público: `execute()`.
- Recibe dependencias (repositorios) por constructor — Dependency Injection.
- Sin dependencias de React, hooks, ni componentes. Un use case es ejecutable desde cualquier contexto.
- Cada use case hace UNA cosa. Si `execute()` tiene más de 20-30 líneas, probablemente necesites descomponer.
- Nomenclatura: `[Verbo][Sustantivo]UseCase` → `LoginUseCase`, `GetMatchesUseCase`, `UpdateProfileUseCase`.

---

## Infrastructure Layer — Repository Implementation

Implementa el contrato definido en `application/ports/`. Aquí es donde vive el código "sucio" — HTTP calls, storage, manejo de tokens.

```typescript
// modules/auth/infrastructure/repositories/auth.repository.impl.ts

import type { AuthRepository } from '../../application/ports/auth.repository';
import type { LoginRequestDto } from '../../application/dtos/login-request.dto';
import type { LoginResponseDto } from '../../application/dtos/login-response.dto';
import { LoginResponseSchema } from '../../application/dtos/login-response.dto';
import type { AuthApiDatasource } from '../datasources/auth-api.datasource';
import type { AuthLocalDatasource } from '../datasources/auth-local.datasource';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly api: AuthApiDatasource,
    private readonly local: AuthLocalDatasource,
  ) {}

  async login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    const rawResponse = await this.api.login(credentials);

    // Validar respuesta del servidor con Zod
    const response = LoginResponseSchema.parse(rawResponse);

    // Persistir tokens localmente
    await this.local.saveTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    return response;
  }

  async logout(): Promise<void> {
    await this.local.clearTokens();
  }

  async getCurrentUser(): Promise<null> {
    return null;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    const rawResponse = await this.api.refreshToken(refreshToken);
    const response = LoginResponseSchema.parse(rawResponse);
    await this.local.saveTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    return response;
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.local.getTokens();
    return tokens !== null;
  }
}
```

**Reglas de implementations:**

- Sufijo `Impl`: `AuthRepositoryImpl implements AuthRepository`.
- Recibe datasources por constructor — nunca instancia fetch ni MMKV directamente.
- Valida toda respuesta externa con Zod antes de pasarla hacia arriba.
- Aquí sí puedes usar try/catch para errores de red y transformarlos a errores de dominio.

---

## Infrastructure Layer — Datasources

Los datasources son wrappers de bajo nivel sobre herramientas específicas (fetch, MMKV). Cada datasource habla con UNA fuente de datos.

```typescript
// modules/auth/infrastructure/datasources/auth-api.datasource.ts

import { apiClient } from '@/shared/infrastructure/api/api-client';
import type { LoginRequestDto } from '../../application/dtos/login-request.dto';

export class AuthApiDatasource {
  async login(credentials: LoginRequestDto) {
    const { data } = await apiClient('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuth: true,
    });
    return data;
  }

  async refreshToken(token: string) {
    const { data } = await apiClient('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: token },
      skipAuth: true,
    });
    return data;
  }
}
```

```typescript
// modules/auth/infrastructure/datasources/auth-local.datasource.ts

import { appStorage } from '@/shared/infrastructure/storage/app-storage';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthLocalDatasource {
  private readonly TOKENS_KEY = 'auth_tokens';

  async saveTokens(tokens: StoredTokens): Promise<void> {
    appStorage.setString(this.TOKENS_KEY, JSON.stringify(tokens));
  }

  async getTokens(): Promise<StoredTokens | null> {
    const raw = appStorage.getString(this.TOKENS_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async clearTokens(): Promise<void> {
    appStorage.remove(this.TOKENS_KEY);
  }
}
```

---

## Presentation Layer — Hooks

Los hooks son el **puente** entre la arquitectura y React. Instancian las dependencias, crean los use cases, y exponen la interfaz que la UI consume.

```typescript
// modules/auth/presentation/hooks/use-login.ts
// (o shared/presentation/hooks/auth/use-login.ts si es compartido globalmente)

import { useMutation } from '@tanstack/react-query';
import type { LoginRequestDto } from '../../application/dtos/login-request.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth.repository.impl';
import { AuthApiDatasource } from '../../infrastructure/datasources/auth-api.datasource';
import { AuthLocalDatasource } from '../../infrastructure/datasources/auth-local.datasource';

// Composición de dependencias (en apps grandes, esto se extrae a un container DI)
const authApi = new AuthApiDatasource();
const authLocal = new AuthLocalDatasource();
const authRepository = new AuthRepositoryImpl(authApi, authLocal);
const loginUseCase = new LoginUseCase(authRepository);

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequestDto) =>
      loginUseCase.execute(credentials),
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}
```

**Reglas de hooks de presentación:**

- El hook instancia las dependencias y expone una API limpia a la UI.
- La UI nunca importa directamente use cases, repositories, ni datasources.
- Usa TanStack Query para operaciones asíncronas: `useQuery` para lectura, `useMutation` para escritura.
- El hook devuelve datos, estados (loading, error, success) y acciones — la UI solo renderiza.

---

## Presentation Layer — Screens

Las screens son componentes que conectan hooks con UI. El **código visual** de la screen es responsabilidad del skill `rnr-ui-designer`; este skill solo decide la estructura.

```typescript
// modules/auth/presentation/screens/login.screen.tsx

import { useLogin } from '../hooks/use-login';
import { LoginForm } from '../components/login-form';

export default function LoginScreen() {
  const login = useLogin();

  return (
    <LoginForm
      onSubmit={login.mutate}
      isLoading={login.isPending}
      error={login.error?.message}
    />
  );
}
```

**Reglas de screens:**

- Máximo 30-40 líneas. Si es más larga, extrae componentes.
- No lógica de negocio — solo conecta hooks con componentes.
- El componente visual (`LoginForm`) es responsabilidad del skill `rnr-ui-designer`.
- La screen vive en `modules/` y se registra en Expo Router via thin wrapper en `app/`.

---

## app/ — Thin Wrappers (Expo Router)

Los archivos en `app/` son **exclusivamente** para routing. Cada uno es un re-export de 1 línea que conecta una ruta de Expo Router con una screen en `modules/`.

```typescript
// app/(tabs)/index.tsx
export { default } from '@/modules/home/presentation/screens/home.screen';
```

```typescript
// app/(tabs)/profile.tsx
export { default } from '@/modules/profile/presentation/screens/profile.screen';
```

```typescript
// app/(tabs)/supermarket.tsx
export { default } from '@/modules/supermarket/presentation/screens/supermarket.screen';
```

```typescript
// app/(tabs)/debts.tsx
export { default } from '@/modules/debts/presentation/screens/debts.screen';
```

**Regla absoluta:** si necesitas importar un hook, un componente, o cualquier lógica dentro de `app/`, es señal de que ese código debe vivir en `modules/` o `shared/` en su lugar.

La única excepción son los **layouts** (`_layout.tsx`) que necesitan configurar providers globales, tab bars, y wrappers de navegación — pero incluso estos deben importar componentes desde `shared/`, no definirlos inline.

---

## Convenciones de Nomenclatura

| Artefacto           | Convención                         | Ejemplo                   |
| ------------------- | ---------------------------------- | ------------------------- |
| Entity              | `[nombre].entity.ts`               | `user.entity.ts`          |
| Value Object        | `[nombre].vo.ts`                   | `email.vo.ts`             |
| Error de dominio    | `[módulo].errors.ts`               | `auth.errors.ts`          |
| Port (interfaz)     | `[módulo].port.ts`                 | `auth.port.ts`            |
| DTO                 | `[nombre]-[accion].dto.ts`         | `login-request.dto.ts`    |
| Mapper              | `[entity].mapper.ts`               | `user.mapper.ts`          |
| Use Case            | `[verbo]-[sustantivo].use-case.ts` | `login.use-case.ts`       |
| Datasource          | `[módulo].datasource.ts`           | `auth.datasource.ts`      |
| Hook                | `use-[accion].ts`                  | `use-login.ts`            |
| Screen              | `[nombre].screen.tsx`              | `login.screen.tsx`        |
| Store (Zustand)     | `[módulo].store.ts`                | `auth.store.ts`           |
