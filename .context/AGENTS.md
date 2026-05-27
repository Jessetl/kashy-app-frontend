# 🤖 AGENTS.md — Kashy Frontend

> **Este archivo es el punto de entrada para cualquier IA o desarrollador.**
> Antes de escribir una sola línea de código, lee este archivo para saber qué documentos consultar según la tarea.

---

## Regla Principal

Toda IA que trabaje en este proyecto **debe** seguir esta secuencia:

1. **Leer este archivo** para entender qué documentos existen.
2. **Leer `project-brief.md`** para entender el proyecto.
3. **Consultar el documento específico** según la tarea a realizar.
4. **Consultar la skill correspondiente** antes de generar código.

> Nunca generar código sin haber leído al menos `project-brief.md` + el documento de la tarea + la skill relevante.

---

## 📁 Estructura del Contexto

```
.context/
├── AGENTS.md                              ← Estás aquí
├── guidelines/
│   ├── project-brief.md                   ← Leer SIEMPRE primero
│   ├── architecture.md
│   ├── navigation-map.md
│   ├── api-routes.md
│   └── router/
│       ├── authentication.md
│       ├── shopping-lists.md
│       ├── finances.md
│       └── notifications.md
├── flows/
│   └── shopping-lists.md
└── skills/
    ├── react-native-clean-architecture/
    │   ├── SKILL.md
    │   └── references/
    ├── rn-performance-optimizer/
    │   ├── SKILL.md
    │   └── references/
    ├── rnr-ui-designer/
    │   ├── SKILL.md
    │   └── references/
    └── nodejs-runtime-expert/
        ├── SKILL.md
        └── references/
```

---

## 📋 Guidelines — Documentos del Proyecto

### Siempre leer primero

| Documento         | Ruta                          | Descripción                                                                                                                                                |
| :---------------- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project Brief** | `guidelines/project-brief.md` | Resumen del proyecto, stack tecnológico, alcance del MVP, tabs, roles (GUEST/KASHY) y reglas de negocio. **Lectura obligatoria antes de cualquier tarea.** |

### Consultar según la tarea

| Documento          | Ruta                           | Cuándo consultarlo                                                                                                                                                                                                                                                                            |
| :----------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**   | `guidelines/architecture.md`   | Al crear screens, componentes, stores, use cases, repositorios o cualquier archivo del proyecto. Define la estructura de carpetas con Expo Router, las 4 capas por dominio (domain, application, infrastructure, presentation), convenciones de nombrado, reglas de dependencia y guest mode. |
| **Navigation Map** | `guidelines/navigation-map.md` | Al crear o modificar pantallas, tabs, navegación, guardias o flujos de usuario. Contiene las 13 screens, 4 tabs, 2 roles, guardias de navegación, visibilidad por rol y notas de implementación.                                                                                              |
| **API Routes**     | `guidelines/api-routes.md`     | Al conectar el frontend con el backend. Contiene configuración base (headers, base URL), flujo de refresh token automático con interceptor de Axios, paginación, manejo de errores por código y convenciones de respuesta.                                                                    |

### Endpoints por servicio

| Documento          | Ruta                                  | Cuándo consultarlo                                                                                                                                                              |
| :----------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Authentication** | `guidelines/router/authentication.md` | Al implementar login, registro, Google auth, refresh token, cambio de contraseña, perfil o logout. Cada endpoint con qué enviar, qué esperar y qué acción tomar en el frontend. |
| **Shopping Lists** | `guidelines/router/shopping-lists.md` | Al implementar CRUD de listas de compras, items en batch o comparadora de métricas.                                                                                             |
| **Finances**       | `guidelines/router/finances.md`       | Al implementar CRUD de ingresos/egresos, summary del dashboard o registros recurrentes.                                                                                         |
| **Notifications**  | `guidelines/router/notifications.md`  | Al implementar listado de notificaciones, badge de no leídas, marcar como leída o preferencias.                                                                                 |

---

## 🌀 Flows — Flujos UX por dominio

Documentos vivos que describen el comportamiento esperado de cada flujo de usuario (actores, pasos en Mermaid sequenceDiagram, tabla de estados y casos borde). Cada cambio de comportamiento UX debe reflejarse aquí.

| Documento          | Ruta                         | Cuándo consultarlo                                                                                                                                                                                                                                                  |
| :----------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shopping Lists** | `flows/shopping-lists.md`    | Al modificar el módulo `modules/shopping` (FAB, draft, commit, salir sin guardar, convertir TEMPLATE→RECEIPT, marcar completada, sync guest→auth, reconexión offline). Incluye convenciones del módulo (modos, estados, tipos, tabs, límites) y 12 flujos completos. |

---

## 🧠 Skills — Guías Genéricas de Código

Las skills son guías reutilizables que aplican a cualquier proyecto. Definen **cómo** escribir código, mientras que los guidelines definen **qué** escribir para Kashy.

### React Native Clean Architecture

| Archivo              | Ruta                                                                    | Cuándo consultarlo                                                                                                                                                                                             |
| :------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SKILL.md**         | `skills/react-native-clean-architecture/SKILL.md`                       | Al crear cualquier componente del proyecto: screens, use cases, stores, repositorios, DTOs, mappers. Define las capas, Expo Router, screens como wrappers, reglas de dependencia, Zustand stores y guest mode. |
| **Command Patterns** | `skills/react-native-clean-architecture/references/command-patterns.md` | Al crear use cases que mutan estado: create, update, delete, toggle. Incluye optimistic update y guest mode.                                                                                                   |
| **Query Patterns**   | `skills/react-native-clean-architecture/references/query-patterns.md`   | Al crear use cases de lectura: getById, search paginado con infinite scroll, summary, compare. Incluye mapper patterns y cuándo usar store vs useState.                                                        |
| **Store Patterns**   | `skills/react-native-clean-architecture/references/store-patterns.md`   | Al crear o modificar Zustand stores. Incluye store base CRUD, auth store con hydrate, theme store, guest mode store, selectors y acceso fuera de React.                                                        |
| **Test Criteria**    | `skills/react-native-clean-architecture/references/test-criteria.md`    | Al validar que el código generado cumple con la arquitectura. Checklist de 12 puntos.                                                                                                                          |

### RN Performance Optimizer

| Archivo                   | Ruta                                                                  | Cuándo consultarlo                                                                                                                                                                                  |
| :------------------------ | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SKILL.md**              | `skills/rn-performance-optimizer/SKILL.md`                            | Al optimizar rendimiento, resolver lags, reducir re-renders o implementar código por plataforma. Define reglas DO/DON'T, árbol de decisión platform-specific y formato de salida para diagnósticos. |
| **Optimization Patterns** | `skills/rn-performance-optimizer/references/optimization-patterns.md` | Al optimizar listas (FlashList), memoización (memo/useMemo/useCallback), imágenes (expo-image), startup, animaciones (Reanimated), re-renders (Zustand selectors) y resiliencia (ErrorBoundary).    |
| **Platform Code**         | `skills/rn-performance-optimizer/references/platform-code.md`         | Al implementar código específico por plataforma: Platform.select(), Platform.OS, archivos .ios/.android con ejemplos completos y tabla de decisión.                                                 |

### RNR UI Designer

| Archivo           | Ruta                                                 | Cuándo consultarlo                                                                                                                                                                                                    |
| :---------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SKILL.md**      | `skills/rnr-ui-designer/SKILL.md`                    | Al diseñar pantallas, componentes visuales, layouts o temas. Define componentes RNR disponibles, principios de diseño (jerarquía, color, tipografía, espaciado, accesibilidad), cn(), PortalHost y formato de salida. |
| **Design System** | `skills/rnr-ui-designer/references/design-system.md` | Al implementar tokens de color HSL, tipografía, espaciado, diferencias iOS/Android, accesibilidad o sombras cross-platform.                                                                                           |
| **UI Patterns**   | `skills/rnr-ui-designer/references/ui-patterns.md`   | Al implementar animaciones (fade+slide, botón háptico, skeleton), screen layouts, formularios RNR, cards, empty states, floating button o pull to refresh.                                                            |
| **Test Criteria** | `skills/rnr-ui-designer/references/test-criteria.md` | Al validar que el diseño cumple con accesibilidad, tokens semánticos, dark mode y jerarquía visual. Checklist de 14 puntos.                                                                                           |

### Node.js Runtime Expert

| Archivo            | Ruta                                                        | Cuándo consultarlo                                                                                                                       |
| :----------------- | :---------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **SKILL.md**       | `skills/nodejs-runtime-expert/SKILL.md`                     | Al escribir código TypeScript. Define convenciones ES6+, principios de error handling y async/await patterns. Compartida con el backend. |
| **Error Patterns** | `skills/nodejs-runtime-expert/references/error-patterns.md` | Al implementar manejo de errores, validación de input o unhandled rejections.                                                            |

---

## 🗺 Mapa de Tareas → Documentos

| Tarea                             | Documentos a consultar                                                                                                                 |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| Crear una pantalla nueva          | `project-brief.md` → `architecture.md` → `navigation-map.md` → `rnr-ui-designer/SKILL.md` → `react-native-clean-architecture/SKILL.md` |
| Crear un componente visual        | `rnr-ui-designer/SKILL.md` → `design-system.md` → `ui-patterns.md`                                                                     |
| Crear un use case                 | `architecture.md` → `command-patterns.md` o `query-patterns.md` según el tipo                                                          |
| Crear/modificar un Zustand store  | `architecture.md` → `store-patterns.md`                                                                                                |
| Conectar con un endpoint          | `api-routes.md` → `router/{servicio}.md` → `react-native-clean-architecture/SKILL.md`                                                  |
| Modificar comportamiento UX del módulo Shopping | `flows/shopping-lists.md` → `router/shopping-lists.md` → `architecture.md`                                              |
| Implementar lista con paginación  | `query-patterns.md` → `optimization-patterns.md` (FlashList)                                                                           |
| Implementar formulario            | `rnr-ui-designer/references/ui-patterns.md` → `router/{servicio}.md`                                                                   |
| Implementar modo guest            | `navigation-map.md` → `store-patterns.md` → `command-patterns.md`                                                                      |
| Optimizar rendimiento             | `rn-performance-optimizer/SKILL.md` → `optimization-patterns.md`                                                                       |
| Implementar código por plataforma | `rn-performance-optimizer/references/platform-code.md`                                                                                 |
| Implementar dark mode             | `rnr-ui-designer/references/design-system.md` → `store-patterns.md` (theme store)                                                      |
| Agregar animaciones               | `rnr-ui-designer/references/ui-patterns.md` → `optimization-patterns.md` (Reanimated)                                                  |
| Implementar navegación/tabs       | `navigation-map.md` → `architecture.md` (Expo Router)                                                                                  |
| Implementar auth/refresh          | `router/authentication.md` → `api-routes.md` (interceptor) → `store-patterns.md` (auth store)                                          |
| Resolver un error de runtime      | `nodejs-runtime-expert/references/error-patterns.md`                                                                                   |
| Validar código generado           | `react-native-clean-architecture/references/test-criteria.md` + `rnr-ui-designer/references/test-criteria.md`                          |

---

## ⚠️ Reglas para la IA

1. **No inventar.** Si algo no está documentado en estos archivos, preguntar antes de asumir.
2. **No contradecir.** Si el código a generar contradice algún documento, el documento gana.
3. **No mezclar dominios.** Los dominios nunca se importan entre sí. Las screens en `app/` son el único lugar donde se componen datos de múltiples dominios. Consultar `architecture.md`.
4. **No silenciar errores.** Consultar `nodejs-runtime-expert/SKILL.md` para las reglas de error handling.
5. **Validar al final.** Antes de entregar código, pasar los checklists de `test-criteria.md` (arquitectura + UI).
6. **Output: código directo + breve "Por qué".** Toda respuesta debe incluir el código solicitado seguido de una explicación breve citando el documento de `.context/` que respalda la decisión. Ejemplo: _"Screen wrapper basado en `guidelines/architecture.md`, store pattern de `skills/react-native-clean-architecture/references/store-patterns.md`, componentes RNR según `skills/rnr-ui-designer/SKILL.md`."_
