# Estructura del Proyecto — Referencia

Stack, arquitectura de capas, árbol completo y reglas de organización. Lee este archivo cuando necesites decidir **dónde** va un archivo o recordar el diagrama de dependencias.

## Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura de Capas](#arquitectura-de-capas)
3. [Árbol de Archivos](#árbol-de-archivos)
4. [Reglas de Organización](#reglas-de-organización)
5. [Decisión: shared o módulo](#decisión-shared-o-módulo)

---

## Stack Tecnológico

| Herramienta                      | Rol                                                        |
| -------------------------------- | ---------------------------------------------------------- |
| **TypeScript (strict)**          | Tipado estático en toda la arquitectura                    |
| **Expo Router**                  | Navegación file-based y estructura de pantallas            |
| **Zustand**                      | Estado global ligero con slices por módulo                 |
| **TanStack Query (React Query)** | Fetching, caching, sincronización con servidor             |
| **Zod**                          | Validación de schemas en runtime (DTOs, formularios, APIs) |
| **fetch (nativo)**               | Cliente HTTP con interceptores centralizados               |
| **MMKV**                         | Persistencia local síncrona (tokens, preferencias, caché)  |
| **React Hook Form + Zod**        | Formularios con validación tipada                          |

---

## Arquitectura de Capas

La aplicación sigue Clean Architecture adaptada al frontend mobile. Cada módulo se organiza en 3-4 capas con la Regla de Dependencia: **las dependencias siempre apuntan de afuera hacia adentro**.

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION                              │
│  Screens · Components · Hooks de UI · Navigation                 │
│  (Conoce a Application, NO conoce a Infrastructure)              │
├──────────────────────────────────────────────────────────────────┤
│                        APPLICATION                               │
│  Use Cases · DTOs · Mappers · Interfaces de Repositorio          │
│  (Conoce a Domain, NO conoce a Infrastructure ni Presentation)   │
├──────────────────────────────────────────────────────────────────┤
│                          DOMAIN                                  │
│  Entities · Value Objects · Reglas de Negocio · Tipos base       │
│  (NO conoce a nadie — es la capa más interna)                    │
├──────────────────────────────────────────────────────────────────┤
│                       INFRASTRUCTURE                             │
│  API Clients · Repositorios concretos · Storage · Datasources    │
│  (Implementa interfaces de Application, conoce todo)             │
└──────────────────────────────────────────────────────────────────┘
```

### Regla de Dependencia

```
Infrastructure → Application → Domain
      ↓                ↓           ↓
  Implementa      Orquesta     Define
  los contratos   el flujo     las reglas
```

- **Domain** no importa nada de las otras capas. Es puro TypeScript, sin dependencias de React, Expo ni librerías externas.
- **Application** solo importa de Domain. Define interfaces (ports) que Infrastructure implementa.
- **Infrastructure** implementa las interfaces de Application. Aquí viven fetch, MMKV, APIs reales.
- **Presentation** consume los use cases de Application a través de hooks. Nunca accede a Infrastructure directamente.

---

## Árbol de Archivos

```
proyecto/
├── app/                                   ← SOLO rutas y layouts de Expo Router
│   ├── _layout.tsx                        ← Root layout (providers, global wrappers)
│   ├── (tabs)/
│   │   ├── _layout.tsx                    ← Tab navigator layout
│   │   ├── index.tsx                      ← Re-export → modules/home
│   │   ├── supermarket.tsx                ← Re-export → modules/supermarket
│   │   ├── debts.tsx                      ← Re-export → modules/debts
│   │   └── profile.tsx                    ← Re-export → modules/profile
│   └── (auth)/
│       └── login.tsx                      ← Re-export → modules/auth (si es ruta)
│
├── modules/                               ← MÓDULOS DE FEATURE (Clean Architecture)
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── auth.entity.ts             ← Entities puras
│   │   │   └── auth.port.ts               ← Port (contrato)
│   │   ├── application/
│   │   │   ├── login.use-case.ts
│   │   │   └── refresh-token.use-case.ts
│   │   ├── infrastructure/
│   │   │   └── auth.datasource.ts         ← Implementación HTTP
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── login.screen.tsx
│   │       ├── hooks/
│   │       │   ├── use-login.ts
│   │       │   └── use-auth.ts
│   │       └── components/
│   │           └── login-form.tsx         ← Componente específico del módulo
│   │
│   ├── home/
│   │   └── presentation/screens/
│   │       └── home.screen.tsx
│   │
│   ├── supermarket/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   └── debts/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
│
├── shared/                                ← CÓDIGO COMPARTIDO (2+ módulos lo usan)
│   ├── domain/
│   │   └── types/
│   │       └── result.type.ts
│   ├── application/
│   │   └── errors/
│   │       └── app.errors.ts
│   ├── infrastructure/
│   │   ├── api/
│   │   │   ├── api-client.ts              ← fetch wrapper + auto-refresh
│   │   │   ├── api-http-error.ts
│   │   │   ├── api.types.ts
│   │   │   └── response-parser.ts
│   │   ├── auth/
│   │   │   └── auth.store.ts              ← Zustand + MMKV persist (sesión global)
│   │   ├── storage/
│   │   │   └── app-storage.ts             ← MMKV wrapper
│   │   └── theme/
│   │       ├── theme.constants.ts
│   │       ├── theme.store.ts
│   │       └── theme.provider.tsx
│   └── presentation/
│       ├── components/
│       │   ├── auth/
│       │   │   └── login-modal.tsx        ← Modal global de login
│       │   ├── custom-tab-bar.tsx
│       │   ├── theme-toggle.tsx
│       │   └── notification-button.tsx
│       └── hooks/
│           ├── auth/
│           │   ├── use-auth.ts
│           │   ├── use-login.ts
│           │   └── use-session-restore.ts
│           └── use-app-theme.ts
│
└── config/
    └── env.ts                             ← Variables de entorno tipadas
```

---

## Reglas de Organización

| Regla | Descripción |
|-------|-------------|
| **Module-first** | Cada feature contiene sus capas internamente en `modules/[nombre]/`. No carpetas `/domain`, `/application` globales con todo mezclado. |
| **Shared = genuinamente compartido** | Solo código usado por 2+ módulos va a `shared/`. Si solo un módulo lo usa, va dentro de ese módulo. |
| **app/ = solo rutas** | Thin wrappers de 1-3 líneas que re-exportan desde `modules/`. Layouts con providers globales. Nada más. |
| **Flat when possible** | No crear subcarpetas hasta tener 3+ archivos que la justifiquen. |
| **Componentes genéricos → shared** | Componentes reutilizables (ThemeToggle, TabBar, modals globales) viven en `shared/presentation/components/`. |
| **Componentes de feature → módulo** | Componentes específicos de un feature (LoginForm, ProductCard) viven en `modules/[feature]/presentation/components/`. |

---

## Decisión: ¿shared o módulo?

```
¿Lo usan 2+ módulos?
  ├── SÍ → shared/presentation/components/ (o shared/infrastructure/, etc.)
  └── NO → ¿Es específico de un feature?
        ├── SÍ → modules/[feature]/presentation/components/
        └── NO → shared/ (es infraestructura genérica)
```
