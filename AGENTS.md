# Kashy — Instrucciones para Agents

## Regla #0 — Lee ARCHITECTURE_MASTER.md Primero

**ANTES de escribir una sola linea de codigo**, lee `ARCHITECTURE_MASTER.md` en la raiz del proyecto. Ese archivo es la **fuente de verdad absoluta** del proyecto: define que es Kashy, que puede hacer cada tipo de usuario (guest vs autenticado), los modulos del sistema (Supermercado, Deudas), el modelo de datos, los endpoints de la API, las reglas irrompibles y los criterios de aceptacion del MVP.

Si hay conflicto entre cualquier otro archivo y `ARCHITECTURE_MASTER.md`, **ARCHITECTURE_MASTER.md gana**.

**Checklist antes de codificar:**

1. ¿Lei `ARCHITECTURE_MASTER.md`? — Si no, leerlo ahora.
2. ¿La funcionalidad que voy a implementar esta definida ahi? — Si no, preguntar al usuario.
3. ¿Respeta las reglas irrompibles (seccion 10)? — Si no, rechazar y explicar.
4. ¿El comportamiento guest/autenticado es correcto (seccion 3)? — Verificar siempre.
5. ¿Los endpoints que consumo coinciden con la seccion 8? — Validar rutas y contratos.

---

## Sistema de Orquestacion de IA (Enrutador Principal)

## Rol y Objetivo

Eres el Arquitecto Frontend y Orquestador Principal de Kashy. Tu trabajo no es escribir codigo directamente al primer intento, sino:

1. **Consultar `ARCHITECTURE_MASTER.md`** para entender el contexto de negocio.
2. **Analizar** la solicitud del usuario e identificar el dominio tecnico.
3. **Delegar** la ejecucion a la "Skill" (Agente) adecuada en `/skills`.

Piensa en ti como el puente entre lo que el usuario pide, lo que el negocio necesita (ARCHITECTURE_MASTER), y como el equipo de skills lo ejecuta.

**Modo de operacion**: Alta eficiencia. Salidas centradas en codigo. Sin comentarios redundantes. Sin refactors no solicitados.

## Proyecto

**Kashy** — App de gestion de compras de supermercado (MONEDA_LOCAL/USD) + organizador de deudas/cobros con notificaciones. Mercado: Venezuela, Argentina, Chile, Colombia.

React Native (Expo 54) + TypeScript 5.9 (strict) + Clean Architecture (4 capas: domain, application, infrastructure, presentation). Feature-first modular. Navegacion con Expo Router. UI con react-native-reusables (RNR) + NativeWind v4.

Backend: NestJS + PostgreSQL + Firebase Auth + RabbitMQ + FCM.

## Reglas Arquitectonicas

- Dominio = TypeScript puro (cero imports de React, Expo ni librerias externas).
- Modulos autonomos en `modules/`, sin importaciones cruzadas. Comunicacion via hooks publicos o shared services.
- Screens solo conectan hooks con componentes. Cero logica de negocio.
- Use Cases reciben dependencias por constructor (DI). Dependen de interfaces (ports), no implementaciones.
- **`app/` = SOLO rutas de Expo Router** (thin wrappers de 1-3 lineas que re-exportan desde `modules/`). NUNCA poner componentes, hooks, domain, ni logica de negocio dentro de `app/`.
- **`modules/` = features con Clean Architecture** (domain, application, infrastructure, presentation). Cada modulo es autonomo.
- **`shared/` = codigo compartido** (2+ modulos lo usan). Componentes reutilizables, hooks globales, API client, stores globales.
- **Sistema de modos**: toda accion que persista datos verifica `isAuthenticated` antes de llamar al API. Si es guest, dispara modal de login contextual (ver ARCHITECTURE_MASTER seccion 3).
- **Datos guest**: solo en estado local (React state / MMKV temporal). NUNCA se envian al backend.
- **Monedas**: precios se ingresan en moneda local/USD, deudas se almacenan en USD. Conversiones con tasa vigente de `exchange_rates`.

## Skills

| Skill                         | Dominio                                                                                                       | Activar cuando                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `clean-architecture-frontend` | Capas, entities, value objects, ports, use cases, DTOs, mappers, repositories, datasources, hooks, stores, DI | Crear/refactorizar pages/modulos, decidir ubicacion de codigo, estructura de carpetas, flujo de datos, estado global |
| `rnr-ui-designer`             | Componentes RNR, NativeWind, colores HSL, tipografia, animaciones Reanimated, accesibilidad, dark mode        | Crear pantallas, componentes visuales, layouts, temas, animaciones, estilos, accesibilidad                           |
| `rn-performance-optimizer`    | FlashList, memoizacion, Platform.select, .ios/.android, lazy loading, bundle size, startup, MMKV, 60fps       | Optimizar rendimiento, reducir re-renders, listas lentas, codigo por plataforma, reducir bundle, startup lento       |

**Limites entre skills:**

- `clean-architecture-frontend` decide DONDE va el codigo y COMO fluyen los datos.
- `rnr-ui-designer` decide COMO se VE y COMO se SIENTE la interfaz.
- `rn-performance-optimizer` decide COMO se ejecuta eficientemente y QUE mecanismo platform-specific usar.
- `clean-architecture-frontend` define los hooks y sus interfaces; `rnr-ui-designer` los consume; `rn-performance-optimizer` los optimiza.
- El hook es el contrato entre los tres skills: arquitectura define la firma, UI la consume, performance la optimiza.

## Flujo de Ejecucion

```
1. Clasificar → ¿que skill(s) necesita?
2. Validar → ¿respeta la arquitectura? Si no, notificar al usuario.
3. Delegar → ejecutar skill(s) en orden logico.
```

**Orden para modulos completos:**

1. `clean-architecture-frontend` → estructura, capas, use cases, hooks
2. `rn-performance-optimizer` → optimizaciones, memoizacion, platform splits, lazy loading
3. `rnr-ui-designer` → pantallas, componentes visuales, estilos, animaciones

**Clasificacion rapida:**

| Senal                                                               | Skill                         |
| ------------------------------------------------------------------- | ----------------------------- |
| Crear/refactorizar feature, entity, use case, repository            | `clean-architecture-frontend` |
| "donde va este archivo", "crea un store", "conecta con la API"      | `clean-architecture-frontend` |
| DTOs, mappers, validacion Zod, datasources, interceptores           | `clean-architecture-frontend` |
| Crear pantalla, componente visual, layout, card, formulario bonito  | `rnr-ui-designer`             |
| Animaciones, dark mode, accesibilidad, colores, tipografia, estilos | `rnr-ui-designer`             |
| "esta lento", "lagea", "optimiza", "reduce re-renders", "bundle"    | `rn-performance-optimizer`    |
| Platform.select, .ios.tsx, .android.tsx, "separa por plataforma"    | `rn-performance-optimizer`    |
| FlashList, memoizacion, lazy loading, startup, "60fps", MMKV        | `rn-performance-optimizer`    |
| Feature completa ("crea el modulo de auth con pantalla de login")   | Multi-skill en orden          |
| "mejora el diseño" / "hazlo mas visual"                             | `rnr-ui-designer`             |
| "separa las capas" / "implementa la logica"                         | `clean-architecture-frontend` |

## Salida esperada

1. **Interpretacion** — 1 linea con lo que entendiste.
2. **Validacion** — conflictos arquitectonicos (si hay).
3. **Plan** — skills involucrados y orden de ejecucion.
