---
name: rn-performance-optimizer
description: >
  Guía para optimizar rendimiento en React Native con Expo. Usa esta skill siempre que el usuario pida
  optimizar rendimiento, reducir el tamaño del bundle, mejorar velocidad de la app, resolver lags,
  jank o stutters, optimizar listas, reducir re-renders, implementar código específico por plataforma
  con Platform.select o archivos .ios.tsx/.android.tsx, lazy loading, code splitting, optimizar
  imágenes, memoización, reducir tiempo de arranque, optimizar animaciones, profiling, o cualquier
  tarea que implique hacer la app más rápida, ligera y eficiente.
  Actívala cuando el usuario diga "está lento", "optimiza esto", "reduce re-renders",
  "la lista lagea", "separa por plataforma", "Platform.select", "reduce el bundle",
  "mejora el startup", "agrega memoización", "lazy load", "la animación se traba",
  "profiling", "reduce el tamaño", "optimiza las imágenes", "usa memo", "useCallback",
  "FlashList", "virtualización", "hermes", "quita el jank", "60fps",
  "haz que cargue más rápido", "el splash tarda mucho", "optimiza la navegación",
  "reduce imports", "tree shaking", o cualquier petición que implique VELOCIDAD, PESO,
  EFICIENCIA o RENDIMIENTO. También actívala cuando el usuario reporte crashes, cierres
  inesperados, pantallas rotas, "la app se cierra sola", "se congela", o cualquier escenario
  donde un error no atrapado rompe la UI.
---

# React Native Performance Optimizer — Skill

> Guía genérica para optimizar rendimiento en React Native con Expo.
> Cubre listas, memoización, imágenes, startup, animaciones, código por plataforma y resiliencia de UI.
> Aplica a cualquier proyecto React Native independientemente de su arquitectura.

---

## Principio

**Medir antes de optimizar.** Una optimización sin evidencia de que hay un problema es complejidad gratuita. Cada milisegundo cuenta, cada kilobyte importa, cada re-render innecesario es un bug.

---

## Stack de Performance

| Herramienta                            | Rol                                                        |
| :------------------------------------- | :--------------------------------------------------------- |
| **Hermes**                             | Motor JS optimizado para RN (bytecode precompilado).       |
| **React Native New Arch**              | JSI, TurboModules, Fabric — comunicación sync sin bridge.  |
| **FlashList (@shopify)**               | Reemplazo de FlatList con reciclaje de celdas.             |
| **React Native Reanimated**            | Animaciones en el hilo nativo (worklets).                  |
| **expo-image**                         | Carga de imágenes con caché, blurhash, transiciones.       |
| **React.memo / useMemo / useCallback** | Memoización para evitar re-renders y recálculos.           |
| **AsyncStorage**                       | Persistencia local para datos de sesión y preferencias.    |
| **Expo Router**                        | Lazy loading de screens automático por file-based routing. |

---

## Código Específico por Plataforma — Árbol de Decisión

```
¿La diferencia es solo un valor (número, string, estilo)?
  └─ Sí → Platform.select()
  └─ No →
      ¿El componente comparte >70% del código entre plataformas?
        └─ Sí → Platform.OS con condicionales
        └─ No →
            ¿Las implementaciones son fundamentalmente distintas?
              └─ Sí → Archivos .ios.tsx / .android.tsx
              └─ No → Platform.OS (refactoriza para compartir más)
```

| Mecanismo                   | Cuándo usar                                              | Ejemplo                           |
| :-------------------------- | :------------------------------------------------------- | :-------------------------------- |
| `Platform.select()`         | Valores de estilo, constantes, configs de 1-5 líneas.    | Sombras iOS vs elevation Android. |
| `Platform.OS`               | Ramas de lógica, permisos. Componente comparte >70%.     | Pedir permiso de notificaciones.  |
| `.ios.tsx` / `.android.tsx` | Implementaciones >30% diferentes. Tree-shaking gratuito. | Cámara, mapa, video player.       |

### Reglas de archivos por plataforma

- Props **idénticas** en ambos archivos. Usar `.types.ts` compartido si es necesario.
- Nunca `.ios.tsx` sin `.android.tsx` (o un `.tsx` base como fallback).
- Imports apuntan al nombre **sin extensión de plataforma**.

> Para código detallado de cada mecanismo, consultar [`references/platform-code.md`](./references/platform-code.md).

---

## Patrones de Optimización — Resumen

| Área            | Resumen                                                                                                                                        | Impacto    |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **Listas**      | FlashList con `estimatedItemSize`, `React.memo` en items, `useCallback` en renderItem, `keyExtractor` estable.                                 | Alto       |
| **Memoización** | `React.memo` solo en hijos con props estables. `useMemo` solo para cálculos costosos. `useCallback` solo para props de hijos memoizados.       | Medio-Alto |
| **Imágenes**    | `expo-image` con `recyclingKey`, `blurhash`, `contentFit`, dimensiones explícitas.                                                             | Alto       |
| **Startup**     | Imports directos (no barrels). `lazy()` + `Suspense` para componentes pesados. `SplashScreen.preventAutoHideAsync()` + `Promise.all` paralelo. | Medio-Alto |
| **Animaciones** | Reanimated worklets en UI thread. Solo animar `transform`/`opacity`. Nunca `Animated` de RN para interacciones.                                | Medio      |
| **Re-renders**  | `useMemo` en Context Provider value. Aislar estado local. Zustand selectors con función arrow.                                                 | Medio-Alto |
| **Resiliencia** | `ErrorBoundary` por tab/sección. `try-catch` en handlers async. `Promise.allSettled` en init. Parseo defensivo de JSON/storage.                | Alto       |

> Para código detallado con ejemplos ❌/✅, consultar [`references/optimization-patterns.md`](./references/optimization-patterns.md).

---

## Reglas — Qué Hacer y Qué NO Hacer

### Hacer (Performance Wins)

| #   | Regla                                                       | Impacto    |
| :-- | :---------------------------------------------------------- | :--------- |
| 1   | Usar FlashList en lugar de FlatList para listas.            | Alto       |
| 2   | `React.memo` en componentes de listas.                      | Alto       |
| 3   | `expo-image` con `recyclingKey` en listas.                  | Alto       |
| 4   | Imports directos, no barrel exports.                        | Medio-Alto |
| 5   | `useCallback` para funciones pasadas a hijos memoizados.    | Medio      |
| 6   | `useMemo` para transformaciones de datos costosas.          | Medio      |
| 7   | Lazy load de screens/componentes pesados.                   | Medio      |
| 8   | Animar solo `transform` y `opacity`.                        | Medio      |
| 9   | `estimatedItemSize` en FlashList.                           | Medio      |
| 10  | Especificar `width`/`height` en imágenes.                   | Bajo-Medio |
| 11  | Zustand selectors con función arrow (evitar re-renders).    | Medio      |
| 12  | `ErrorBoundary` por tab/screen y por sección independiente. | Alto       |
| 13  | `try-catch` en todo `async/await` dentro de event handlers. | Alto       |
| 14  | `Promise.allSettled` en inicialización (no `Promise.all`).  | Medio-Alto |
| 15  | Parseo defensivo de JSON/storage con fallback.              | Medio      |

### NO Hacer (Performance Killers)

| #   | Anti-patrón                                            | Por qué mata el rendimiento                          |
| :-- | :----------------------------------------------------- | :--------------------------------------------------- |
| 1   | `Animated` de RN para interacciones.                   | Corre en JS thread, compite con la lógica.           |
| 2   | `useState` para animar valores.                        | Re-render completo cada frame (60/seg).              |
| 3   | Funciones/objetos inline en `renderItem`.              | Mata el reciclaje de FlashList.                      |
| 4   | Barrel exports (`index.ts`) con muchos re-exports.     | Evalúa todos los módulos aunque solo uses uno.       |
| 5   | `Image` de RN sin dimensiones.                         | Double layout pass.                                  |
| 6   | `console.log` en producción.                           | Serialización bloquea JS thread.                     |
| 7   | Inline styles con objetos (`style={{ padding: 16 }}`). | Objeto nuevo cada render → re-render.                |
| 8   | `JSON.parse`/`JSON.stringify` en render path.          | Operación costosa que bloquea el frame.              |
| 9   | Context Provider sin `useMemo` en `value`.             | Re-renderiza TODOS los consumers.                    |
| 10  | Animar `width`/`height`/`margin`/`padding`.            | Fuerza recálculo de layout cada frame.               |
| 11  | `async/await` sin `try-catch` en event handlers.       | Unhandled rejection → crash o comportamiento mudo.   |
| 12  | `catch` vacío sin feedback al usuario.                 | El usuario no sabe qué pasó, UX rota.                |
| 13  | Solo un `ErrorBoundary` en la raíz.                    | Un error en un componente tumba toda la app.         |
| 14  | `useStore()` sin selector.                             | Re-renderiza cuando cualquier cosa del store cambia. |

---

## Formato de Salida

Cuando se solicite trabajo de optimización, estructurar la respuesta así:

### 1. Diagnóstico

Qué problema se resuelve, qué lo causa, qué métricas mejorarán (fps, bundle size, startup time, memory).

### 2. Mecanismo de Plataforma (si aplica)

Qué mecanismo se usa (`Platform.select`, `Platform.OS`, o `.ios/.android`) y por qué.

### 3. Código Optimizado

TypeScript con optimizaciones. Antes (❌) y después (✅) cuando reemplaza código existente.

### 4. Impacto Esperado

| Métrica       | Antes     | Después (estimado) |
| :------------ | :-------- | :----------------- |
| FPS en scroll | ~30-40fps | ~58-60fps          |
| Bundle size   | 2.1MB     | 1.8MB              |

### 5. Notas de Integración

Dependencias nuevas (`npx expo install ...`), cambios en configuración, archivos a actualizar.

---

## References

| Archivo                                                                        | Cuándo consultarlo                                                                                      |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| [`references/optimization-patterns.md`](./references/optimization-patterns.md) | Al optimizar listas, memoización, imágenes, startup, animaciones, re-renders y resiliencia de UI.       |
| [`references/platform-code.md`](./references/platform-code.md)                 | Al implementar código específico por plataforma (Platform.select, Platform.OS, archivos .ios/.android). |
