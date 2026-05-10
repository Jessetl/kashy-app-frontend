# Test Criteria — Criterios de Aceptación (Frontend)

> Test cases para validar que el código generado cumple con la arquitectura.
> Usar como checklist al revisar código generado por cualquier IA.

---

## TC-1: Ubicación Correcta por Capa

**Prompt:** "Crea un módulo de órdenes con entidad, repositorio, use case, store y pantalla."

**Criterios:**

- Entidad en `domain/entities/` sin imports de React, React Native ni frameworks.
- Interfaz `IOrderRepository` en `domain/interfaces/`.
- Use case en `application/use-cases/`, implementa `UseCase<Input, Output>`.
- DTO en `application/dtos/` como interface TypeScript.
- Mapper en `application/mappers/` con métodos estáticos.
- Repositorio concreto en `infrastructure/repositories/`, usa Axios.
- Componentes en `presentation/components/`.
- Store en `presentation/store/` como hook Zustand.
- Screen en `app/(tabs)/` como wrapper delgado.

---

## TC-2: Screen en app/ es un Wrapper

**Prompt:** "Crea la pantalla de detalle de orden."

**Criterios:**

- Archivo en `app/` tiene máximo 10 líneas.
- Solo importa de `presentation/components/`.
- Extrae params de Expo Router y los pasa como props.
- No contiene lógica de negocio, HTTP calls ni actualizaciones de store.
- El componente real (pesado) vive en `presentation/components/`.

---

## TC-3: Aislamiento entre Dominios

**Prompt:** "El dashboard necesita mostrar datos de órdenes y alertas."

**Criterios:**

- Órdenes NO importa archivos de alertas directamente.
- Alertas NO importa archivos de órdenes directamente.
- La composición ocurre en `app/(tabs)/home/index.tsx` que importa componentes de ambos dominios.
- Ningún store importa de otro store.

---

## TC-4: Use Case Correcto

**Prompt:** "Crea el use case para crear una orden."

**Criterios:**

- Llama al repositorio (interfaz del dominio).
- Actualiza el store con la respuesta.
- No tiene try/catch (excepto optimistic update).
- Retorna la entidad creada o void.
- No navega (la navegación es responsabilidad del componente).
- No maneja estados de loading/error.

---

## TC-5: Store Correcto

**Prompt:** "Crea el Zustand store para órdenes."

**Criterios:**

- `initialState` definido como objeto separado.
- Tiene método `reset()` que restaura `initialState`.
- Acciones son simples: set, append, replace, remove.
- No contiene lógica HTTP ni llamadas a APIs.
- No importa de otros stores.
- Usa `getState()` cuando se accede fuera de React.
- Selectores con función arrow en los componentes.

---

## TC-6: Repositorio HTTP Correcto

**Prompt:** "Implementa el repositorio de órdenes."

**Criterios:**

- Implementa la interfaz definida en `domain/interfaces/`.
- Usa la instancia compartida de Axios (`shared-kernel/http/`).
- Solo hace HTTP calls — sin lógica de negocio.
- Sin actualizaciones de store.
- Tipado estricto con DTOs en request y response.
- No hace try/catch (los errores se propagan al use case → componente).

---

## TC-7: Manejo de Errores Correcto

**Prompt:** "Implementa el formulario de creación con manejo de errores."

**Criterios:**

- El componente maneja loading, error global y field errors con `useState`.
- Errores 422 se mapean a errores por campo.
- Errores genéricos se muestran como toast o mensaje.
- El use case NO hace try/catch.
- El repositorio NO hace try/catch.
- Solo el componente captura errores para la UI.

---

## TC-8: Guest Mode Correcto

**Prompt:** "Implementa la funcionalidad de listas para el modo guest."

**Criterios:**

- Datos se guardan en AsyncStorage, nunca llegan al backend.
- El use case del guest tiene la misma interfaz que el del autenticado.
- El componente no sabe si está en modo guest — llama al use case correspondiente.
- Al intentar una acción bloqueada, se dispara el AuthGuard → LoginModal.
- Los datos locales se limpian con `clearLocalData()` si es necesario.

---

## Checklist Rápido

Antes de dar por terminado cualquier código generado, verificar:

| #   | Verificación                                             | ✅  |
| :-- | :------------------------------------------------------- | :-: |
| 1   | ¿La entidad tiene 0 imports de React/RN?                 |     |
| 2   | ¿El screen en `app/` tiene ≤10 líneas?                   |     |
| 3   | ¿El use case actualiza el store después del HTTP call?   |     |
| 4   | ¿El use case no tiene try/catch?                         |     |
| 5   | ¿El repositorio solo hace HTTP calls sin lógica?         |     |
| 6   | ¿El store no importa de otros stores?                    |     |
| 7   | ¿El store no hace llamadas HTTP?                         |     |
| 8   | ¿Los selectores usan función arrow?                      |     |
| 9   | ¿Ningún dominio importa de otro dominio?                 |     |
| 10  | ¿La composición multi-dominio solo ocurre en `app/`?     |     |
| 11  | ¿Loading/error se manejan con useState en el componente? |     |
| 12  | ¿El guest mode usa AsyncStorage sin llamar al backend?   |     |
