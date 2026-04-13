# ARCHITECTURE_MASTER.md — Kashy

> **Este archivo es el cerebro de la aplicación.**
> Toda IA, desarrollador o agente que trabaje en Kashy **debe leer este archivo primero** antes de escribir una sola línea de código. Aquí se define qué es Kashy, cómo se comporta, qué puede hacer cada tipo de usuario y cuáles son las reglas irrompibles del sistema.

---

## 1. Identidad del Proyecto

| Campo                | Kashyr                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**           | Kashy                                                                                                                                                    |
| **Tipo**             | App Móvil                                                                                                                                                |
| **Propósito**        | Gestión inteligente de compras de supermercado con seguimiento de precios moneda local/USD + organizador de deudas y cobros personales con recordatorios |
| **Mercado**          | Venezuela, Argentina, Chile, Perú                                                                                                                        |
| **Versión objetivo** | MVP (Sprint 4 semanas)                                                                                                                                   |

---

## 2. Stack Tecnológico

| Capa                | Tecnología                                        |
| ------------------- | ------------------------------------------------- |
| Frontend Móvil      | React Native + React Navigation                   |
| Backend API         | NestJS (Node.js / TypeScript)                     |
| Base de Datos       | PostgreSQL + TypeORM                              |
| Autenticación       | Firebase Authentication (email/password + Google) |
| Mensajería/Eventos  | RabbitMQ                                          |
| Notificaciones Push | Firebase Cloud Messaging (FCM)                    |
| Tasa de Cambio      | API BCV / Monitor Dólar + cache local             |

---

## 3. Sistema de Usuarios — Modos de Operación

Kashy opera bajo **dos modos mutuamente excluyentes**. El modo define qué puede hacer y qué no puede hacer el usuario dentro de la app. Este sistema es la **columna vertebral** de toda decisión de acceso.

### 3.1 Modo Guest (Invitado)

El modo guest es el estado por defecto al abrir la app sin iniciar sesión. Su objetivo es permitir al usuario **explorar y probar** la funcionalidad antes de comprometerse con un registro.

**Lo que un Guest PUEDE hacer:**

- Ver la pantalla de inicio y navegar entre las secciones de Supermercado y Deudas.
- Crear una lista de compras temporal en memoria local (estado del dispositivo, no persiste en servidor).
- Agregar productos a esa lista temporal con precio en moneda local, cantidad e IVA.
- Ver la conversión de moneda local a USD en tiempo real con la tasa vigente.
- Usar la calculadora de interés de deudas como herramienta de consulta (sin guardar).
- Ver gráficos de ejemplo o datos de demostración para entender la funcionalidad.

**Lo que un Guest NO PUEDE hacer (requiere inicio de sesión):**

- Guardar listas de compras en el servidor (persistencia).
- Guardar, crear o editar deudas/cobros.
- Acceder al historial de compras.
- Usar el comparador de precios entre listas.
- Ver estadísticas/gráficos de gasto personalizado.
- Recibir notificaciones push de vencimiento de deudas.
- Configurar preferencias de usuario (toggle notificaciones, etc.).
- Duplicar listas de compras.

**Comportamiento del bloqueo guest:**

Cuando un guest intenta realizar una acción restringida, la app **no muestra un error genérico**. En su lugar:

1. Se muestra un **modal/bottom-sheet** con el mensaje contextual: `"Para guardar tu lista de compras necesitas una cuenta. ¡Es gratis y toma 10 segundos!"` (el texto varía según la acción bloqueada).
2. El modal ofrece dos opciones: **"Crear cuenta"** y **"Iniciar sesión"**.
3. Si el usuario cancela, vuelve a donde estaba sin perder datos temporales.
4. Si el usuario se registra/inicia sesión, **la acción bloqueada se ejecuta automáticamente** después del login exitoso (no obligar a repetir la acción).

**Mensajes contextuales del bloqueo guest por acción:**

| Acción bloqueada          | Mensaje del modal                                                  |
| ------------------------- | ------------------------------------------------------------------ |
| Guardar lista de compras  | "Inicia sesión para guardar tu lista y no perder tus productos."   |
| Crear deuda/cobro         | "Inicia sesión para registrar tus deudas y recibir recordatorios." |
| Ver historial             | "Inicia sesión para acceder a tu historial de compras."            |
| Comparar precios          | "Inicia sesión para comparar precios entre tus listas guardadas."  |
| Ver estadísticas          | "Inicia sesión para ver tus gráficos de gasto."                    |
| Configurar notificaciones | "Inicia sesión para activar recordatorios de vencimiento."         |

### 3.2 Modo Usuario Autenticado

El usuario autenticado tiene **acceso completo** a todas las funcionalidades del MVP. No hay restricciones de features, solo las del plan actual (MVP).

**Capacidades completas:**

- CRUD completo de listas de compras (crear, editar, eliminar, duplicar).
- CRUD completo de productos dentro de listas (nombre, precio en moneda local, cantidad, IVA).
- Conversión automática de moneda local a USD con tasa vigente en todo momento.
- Marcar productos como comprados (persistido en BD).
- Guardar/cerrar listas (pasan al historial como "completadas").
- Historial de compras con búsqueda y scroll infinito.
- Comparador de precios entre listas.
- Gráficos de gasto por período (semana/mes).
- Toggle IVA sobre el total de la compra.
- CRUD completo de deudas/cobros en USD con prioridad (alta/media/baja).
- Tasa de interés opcional con cálculo automático.
- Conversión de deudas a USD con tasa vigente.
- Notificaciones push 1 día antes del vencimiento de deudas o por configuración del usuario.
- Activar/desactivar notificaciones desde configuración.
- Todos los datos persisten en PostgreSQL vinculados a su `user_id`.

### 3.3 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────┐
│                  APP SE ABRE                        │
│                                                     │
│  ¿Existe sesión activa (Firebase token válido)?     │
│                                                     │
│     SÍ ──────► MODO USUARIO AUTENTICADO             │
│                (cargar datos del servidor)           │
│                                                     │
│     NO ──────► MODO GUEST                           │
│                (datos temporales, acceso limitado)   │
│                                                     │
│  El guest puede navegar libremente.                 │
│  Al intentar una acción restringida:                │
│                                                     │
│     ► Modal de login/registro contextual            │
│     ► Login exitoso → ejecutar acción pendiente     │
│     ► Login cancelado → volver sin perder datos     │
│                                                     │
│  Cierre de sesión → volver a MODO GUEST             │
│  (limpiar datos locales del usuario)                │
└─────────────────────────────────────────────────────┘
```

### 3.4 Reglas Técnicas del Sistema de Modos

1. **El estado guest se gestiona con un flag global** (`isAuthenticated: boolean`) accesible desde cualquier pantalla vía Context o estado global (Zustand, Redux, etc.).
2. **Toda función que persista datos debe verificar** `isAuthenticated` antes de ejecutar la llamada API. Si es `false`, disparar el modal de login.
3. **Los datos temporales del guest** se almacenan en el estado local de la app (React state o AsyncStorage temporal). NO se envían al backend.
4. **Al hacer login, se intenta migrar los datos temporales** al servidor. Si el guest tenía una lista en progreso, se envía al backend como lista nueva del usuario recién autenticado.
5. **El token de Firebase se refresca automáticamente**. Si el token expira durante el uso, se intenta refresh silencioso. Si falla, se redirige a MODO GUEST con mensaje: "Tu sesión ha expirado. Inicia sesión de nuevo."
6. **Cerrar sesión limpia** todo dato local del usuario y regresa al estado guest limpio.

---

## 4. Módulos del Sistema

### 4.1 Módulo Supermercado

**Propósito:** Permitir al usuario crear listas de compras con precios en moneda local, conversión automática a USD y seguimiento de gasto.

**Entidades involucradas:** `shopping_lists`, `shopping_items`, `exchange_rates`.

**Funcionalidades:**

| ID     | Funcionalidad                                               | Guest                   | Usuario              | Prioridad |
| ------ | ----------------------------------------------------------- | ----------------------- | -------------------- | --------- |
| SUP-01 | Crear lista de compras                                      | Solo temporal (memoria) | Persiste en BD       | Alta      |
| SUP-02 | Editar nombre/tienda de lista                               | Solo temporal           | Persiste en BD       | Alta      |
| SUP-03 | Eliminar lista                                              | Solo temporal           | Persiste en BD       | Alta      |
| SUP-04 | Duplicar lista existente                                    | No disponible           | Sí                   | Media     |
| SUP-05 | Agregar producto (nombre, precio VES, cantidad)             | Solo temporal           | Persiste en BD       | Alta      |
| SUP-06 | Editar/eliminar producto                                    | Solo temporal           | Persiste en BD       | Alta      |
| SUP-07 | Marcar producto como comprado                               | Solo temporal           | Persiste en BD       | Alta      |
| SUP-08 | Ver total en moneda local con conversión USD en tiempo real | Sí                      | Sí                   | Alta      |
| SUP-09 | Toggle IVA sobre total                                      | Sí                      | Sí                   | Alta      |
| SUP-10 | Guardar/cerrar lista (completar compra)                     | Requiere login          | Sí, pasa a historial | Alta      |
| SUP-11 | Ver historial de compras                                    | Requiere login          | Sí, paginado         | Alta      |
| SUP-12 | Buscar en historial                                         | Requiere login          | Sí                   | Media     |
| SUP-13 | Comparar precios entre listas                               | Requiere login          | Sí                   | Media     |
| SUP-14 | Ver gráficos de gasto (semana/mes)                          | Requiere login          | Sí                   | Media     |

**Reglas de negocio del módulo:**

- Los precios se ingresan **siempre en moneda local** (moneda primaria de entrada).
- La conversión a USD se calcula automáticamente usando la tasa vigente de `exchange_rates`.
- Al cerrar una lista, se guarda un `exchange_rate_snapshot` con la tasa del momento para auditoría.
- El IVA se aplica sobre el `total_local` y se recalcula el equivalente USD.
- El historial muestra solo listas con `status = 'completed'`.
- El comparador muestra diferencias de precio por producto entre 2 o más listas seleccionadas.
- Los gráficos agrupan gasto por semana o mes, mostrando moneda local y USD.

### 4.2 Módulo Deudas/Cobros

**Propósito:** Permitir al usuario registrar deudas que debe o cobros que le deben, con prioridad, interés opcional y notificaciones de vencimiento.

**Entidades involucradas:** `debts`, `exchange_rates`, `notifications`.

**Funcionalidades:**

| ID     | Funcionalidad                                   | Guest                  | Usuario                | Prioridad |
| ------ | ----------------------------------------------- | ---------------------- | ---------------------- | --------- |
| DEU-01 | Crear deuda/cobro (monto USD, prioridad, fecha) | Requiere login         | Persiste en BD         | Alta      |
| DEU-02 | Editar deuda/cobro                              | Requiere login         | Sí                     | Alta      |
| DEU-03 | Eliminar deuda/cobro                            | Requiere login         | Sí                     | Alta      |
| DEU-04 | Marcar deuda como pagada                        | Requiere login         | Sí                     | Alta      |
| DEU-05 | Filtrar por prioridad (alta/media/baja)         | Requiere login         | Sí                     | Alta      |
| DEU-06 | Filtrar deudas vs cobros (`is_collection`)      | Requiere login         | Sí                     | Alta      |
| DEU-07 | Agregar tasa de interés opcional                | Requiere login         | Cálculo automático     | Media     |
| DEU-08 | Ver monto con interés calculado                 | Simulación sin guardar | Con datos reales       | Media     |
| DEU-09 | Ver conversión a VES con tasa vigente           | Sí (consulta)          | Sí (con datos reales)  | Alta      |
| DEU-10 | Recibir notificación push 1 día antes           | No disponible          | Sí, vía FCM + RabbitMQ | Media     |
| DEU-11 | Activar/desactivar notificaciones               | Requiere login         | Sí, persiste en BD     | Media     |

**Reglas de negocio del módulo:**

- Las deudas se almacenan **siempre en USD** (moneda base) para proteger contra la volatilidad del bolívar.
- La conversión a moneda local es de solo lectura y se recalcula en tiempo real con la tasa vigente.
- La prioridad afecta el **orden visual** (alta primero) y el estilo de la tarjeta (color/icono).
- El campo `is_collection` diferencia: `false` = "yo debo" / `true` = "me deben".
- El interés se calcula como: `interest_amount_usd = amount_usd * (interest_rate_pct / 100)`.
- Las notificaciones se programan al crear/editar la deuda si `due_date` está definida y `notification_enabled = true` en el perfil del usuario.
- Si el usuario desactiva notificaciones globalmente, no se programan nuevas ni se envían las pendientes.

---

## 5. Servicio de Tasa de Cambio

**Fuentes:** API BCV (oficial) y Monitor Dólar (paralelo).

**Comportamiento:**

1. El backend consulta las APIs cada **4 horas** mediante un cron job.
2. La tasa obtenida se guarda en `exchange_rates` con `source` y `fetched_at`.
3. Si la API falla, se usa la **última tasa válida en cache**.
4. Si no hay ninguna tasa en BD (primera ejecución o BD vacía), se permite **entrada manual** por el administrador.
5. El frontend consume un endpoint `/exchange-rates/current` que retorna la tasa más reciente.
6. Error de conversión tolerado: **< 0.01%**.

**Endpoint clave:**

```
GET /exchange-rates/current
→ { rate_local_per_usd: number, source: string, fetched_at: string }
```

---

## 6. Sistema de Notificaciones

### 6.1 Configuración de Preferencias

Cada usuario autenticado tiene un registro en `notification_preferences` que controla **qué tipo** de notificaciones recibe. El campo `push_enabled` actúa como **master toggle**: si es `false`, ninguna notificación se programa ni se envía, independientemente de los toggles individuales.

| Toggle           | Tipo de notificación                          | Comportamiento cuando activo                                                      |
| ---------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `push_enabled`   | Master — habilita/deshabilita todo            | Si es `false`, se ignoran todos los demás toggles y no se envía nada              |
| `debt_reminders` | Recordatorios de vencimiento de deudas        | Programa notificación `scheduled_at = due_date - 24h` al crear/editar deuda       |
| `price_alerts`   | Alertas de cambio en la tasa de cambio        | Envía push cuando la variación de tasa supera un umbral configurable (ej. ≥ 5%)   |
| `list_reminders` | Recordatorios de listas de compras pendientes | Envía push si hay listas con `status = 'active'` sin actividad en las últimas 48h |

**Reglas:**

- Al registrarse un usuario, se crea automáticamente un registro en `notification_preferences` con los defaults (`push_enabled = true`, `debt_reminders = true`, `price_alerts = false`, `list_reminders = true`).
- Cuando `push_enabled` se desactiva, el backend **cancela** (soft-delete o `status = 'cancelled'`) todas las notificaciones pendientes del usuario.
- Cuando `push_enabled` se reactiva, el backend **reprograma** las notificaciones de deudas con `due_date` futura si `debt_reminders = true`.
- Antes de programar cualquier notificación, el backend verifica que el toggle correspondiente esté activo.

### 6.2 Flujo de Envío

1. Al crear/editar una deuda con `due_date`, el backend verifica `push_enabled = true` Y `debt_reminders = true`.
2. Si ambos son `true`, calcula `scheduled_at = due_date - 24h` y crea registro en `notifications` con `status = 'pending'`.
3. Un worker de RabbitMQ revisa periódicamente las notificaciones pendientes cuyo `scheduled_at` ya pasó.
4. El worker envía la notificación vía Firebase Cloud Messaging (FCM) al dispositivo del usuario.
5. Se actualiza `sent_at` y `status = 'sent'`.

**Fallback:** Si RabbitMQ introduce complejidad excesiva para el MVP, simplificar a un **cron job NestJS** que ejecute cada hora y envíe directamente vía FCM.

**Restricción guest:** Los guests NO reciben notificaciones bajo ninguna circunstancia. No se programa nada para usuarios no autenticados.

---

## 7. Modelo de Datos

### 7.1 Entidades

**users**

```
id              UUID PRIMARY KEY
firebase_uid    VARCHAR UNIQUE NOT NULL
email           VARCHAR UNIQUE NOT NULL
display_name    VARCHAR
created_at      TIMESTAMP DEFAULT now()
```

**notification_preferences**

```
id               UUID PRIMARY KEY
user_id          UUID FK → users.id UNIQUE NOT NULL
push_enabled     BOOLEAN DEFAULT true
debt_reminders   BOOLEAN DEFAULT true
price_alerts     BOOLEAN DEFAULT false
list_reminders   BOOLEAN DEFAULT true
updated_at       TIMESTAMP DEFAULT now()
```

**shopping_lists**

```
id                      UUID PRIMARY KEY
user_id                 UUID FK → users.id NOT NULL
name                    VARCHAR NOT NULL
store_name              VARCHAR
status                  ENUM('active', 'completed') DEFAULT 'active'
iva_enabled             BOOLEAN DEFAULT false
total_local             DECIMAL(18,2) DEFAULT 0
total_usd               DECIMAL(18,2) DEFAULT 0
exchange_rate_snapshot  DECIMAL(18,4)
created_at              TIMESTAMP DEFAULT now()
completed_at            TIMESTAMP
```

**shopping_items**

```
id                UUID PRIMARY KEY
list_id           UUID FK → shopping_lists.id NOT NULL
product_name      VARCHAR NOT NULL
category          VARCHAR NOT NULL
unit_price_local  DECIMAL(18,2) NOT NULL
quantity          INTEGER DEFAULT 1
total_local       DECIMAL(18,2) GENERATED (unit_price_local * quantity)
unit_price_usd    DECIMAL(18,4)
total_usd         DECIMAL(18,4)
is_purchased      BOOLEAN DEFAULT false
created_at        TIMESTAMP DEFAULT now()
```

**debts**

```
id                  UUID PRIMARY KEY
user_id             UUID FK → users.id NOT NULL
title               VARCHAR NOT NULL
description         TEXT
amount_usd          DECIMAL(18,2) NOT NULL
priority            ENUM('high', 'medium', 'low') DEFAULT 'medium'
interest_rate_pct   DECIMAL(5,2) DEFAULT 0
interest_amount_usd DECIMAL(18,2) DEFAULT 0
due_date            DATE
is_paid             BOOLEAN DEFAULT false
is_collection       BOOLEAN DEFAULT false
created_at          TIMESTAMP DEFAULT now()
```

**exchange_rates**

```
id                  UUID PRIMARY KEY
rate_local_per_usd  DECIMAL(18,4) NOT NULL
source              VARCHAR NOT NULL
fetched_at          TIMESTAMP DEFAULT now()
```

**notifications**

```
id            UUID PRIMARY KEY
user_id       UUID FK → users.id NOT NULL
debt_id       UUID FK → debts.id NOT NULL
type          VARCHAR DEFAULT 'debt_due_reminder'
scheduled_at  TIMESTAMP NOT NULL
sent_at       TIMESTAMP
status        ENUM('pending', 'sent', 'failed') DEFAULT 'pending'
```

### 7.2 Reglas de Integridad

- Todo `shopping_list` y `debt` **debe** tener un `user_id` válido. No existen registros huérfanos.
- Al registrar un usuario, se crea automáticamente su registro en `notification_preferences` con los defaults.
- `notification_preferences.user_id` es `UNIQUE` — relación 1:1 con `users`.
- Al eliminar un usuario, se eliminan en cascada: sus listas, items, deudas, notificaciones y `notification_preferences`.
- Al eliminar una lista, se eliminan en cascada sus items.
- Al eliminar una deuda, se eliminan en cascada sus notificaciones.
- `exchange_rates` no tiene FK a ninguna tabla; es una tabla de referencia global.

---

## 8. Estructura de la API (Backend NestJS)

### 8.1 Autenticación

Todos los endpoints (excepto los públicos) requieren header `Authorization: Bearer <firebase_token>`. El backend valida el token con Firebase Admin SDK y extrae el `firebase_uid` para identificar al usuario.

**Endpoints públicos (no requieren auth):**

```
GET  /health                    → Health check
GET  /exchange-rates/current    → Tasa de cambio vigente
```

### 8.2 Endpoints del Módulo Supermercado

```
POST   /shopping-lists                          → Crear lista
GET    /shopping-lists                          → Listar listas activas del usuario
GET    /shopping-lists/history                  → Historial (status=completed), paginado
GET    /shopping-lists/:id                      → Detalle de una lista
PUT    /shopping-lists/:id                      → Editar lista (nombre, tienda, iva_enabled)
DELETE /shopping-lists/:id                      → Eliminar lista
POST   /shopping-lists/:id/duplicate            → Duplicar lista
PUT    /shopping-lists/:id/complete             → Cerrar lista (status→completed, snapshot tasa)

POST   /shopping-lists/:id/items                → Agregar producto
PUT    /shopping-lists/:id/items/:itemId        → Editar producto
DELETE /shopping-lists/:id/items/:itemId        → Eliminar producto
PUT    /shopping-lists/:id/items/:itemId/toggle → Marcar/desmarcar como comprado

GET    /shopping-lists/compare?ids=id1,id2      → Comparar precios entre listas
GET    /shopping-lists/stats?period=week|month  → Estadísticas de gasto
```

### 8.3 Endpoints del Módulo Deudas

```
POST   /debts                     → Crear deuda/cobro
GET    /debts                     → Listar deudas del usuario (con filtros query params)
GET    /debts/:id                 → Detalle de deuda
PUT    /debts/:id                 → Editar deuda
DELETE /debts/:id                 → Eliminar deuda
PUT    /debts/:id/pay             → Marcar como pagada
```

**Query params para filtros:**

```
GET /debts?priority=high&is_collection=false&is_paid=false
```

### 8.4 Endpoints de Usuario

```
GET    /users/me                  → Perfil del usuario actual (incluye notification_preferences)
PUT    /users/me                  → Actualizar perfil (display_name)
```

### 8.5 Endpoints de Preferencias de Notificación

```
GET    /users/me/notification-preferences      → Obtener preferencias de notificación
PUT    /users/me/notification-preferences      → Actualizar preferencias (parcial o completa)
```

**Body de `PUT /users/me/notification-preferences`:**

```json
{
  "pushEnabled": true,
  "debtReminders": true,
  "priceAlerts": false,
  "listReminders": true
}
```

Todos los campos son opcionales (merge parcial). El backend aplica las reglas de la sección 6.1: si `pushEnabled` cambia a `false`, cancela notificaciones pendientes; si vuelve a `true`, reprograma las aplicables.

**Respuesta (200 OK):**

```json
{
  "success": true,
  "data": {
    "pushEnabled": true,
    "debtReminders": true,
    "priceAlerts": false,
    "listReminders": true,
    "updatedAt": "2026-04-11T15:30:00.000Z"
  }
}
```

**Errores posibles:**

| Status | Código             | Causa                                     |
| ------ | ------------------ | ----------------------------------------- |
| 401    | `UNAUTHORIZED`     | Token inválido o expirado                 |
| 404    | `NOT_FOUND`        | Usuario no tiene registro de preferencias |
| 422    | `VALIDATION_ERROR` | Valor inválido (ej. campo no booleano)    |

---

## 9. Navegación del Frontend (React Navigation)

### 9.1 Estructura de Pantallas

```
App
├── AuthStack (solo visible en modo guest si elige login/registro)
│   ├── LoginScreen
│   └── RegisterScreen
│
├── MainTabs (visible siempre, guest o autenticado)
│   ├── Tab: Supermercado
│   │   ├── ShoppingListsScreen        (listas activas)
│   │   ├── ShoppingListDetailScreen   (productos de una lista)
│   │   ├── ShoppingHistoryScreen      (historial - requiere auth)
│   │   ├── PriceComparisonScreen      (comparador - requiere auth)
│   │   └── SpendingStatsScreen        (gráficos - requiere auth)
│   │
│   ├── Tab: Deudas
│   │   ├── DebtsListScreen            (lista de deudas - requiere auth)
│   │   └── DebtDetailScreen           (detalle de deuda - requiere auth)
│   │
│   └── Tab: Perfil
│       ├── ProfileScreen              (info del usuario o botón login)
│       └── SettingsScreen             (config notificaciones - requiere auth)
│
└── Modales Globales
    ├── LoginRequiredModal             (modal contextual de login para guest)
    └── ExchangeRateInfoModal          (info de tasa actual)
```

### 9.2 Comportamiento de Tabs según Modo

| Tab          | Guest                                                                                                               | Usuario Autenticado                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Supermercado | Puede crear lista temporal. Al intentar guardar → modal login.                                                      | Funcionalidad completa.                                 |
| Deudas       | Puede ver la pantalla pero al intentar crear/ver deudas → modal login. Puede usar calculadora de interés como demo. | Funcionalidad completa.                                 |
| Perfil       | Muestra botones "Crear cuenta" / "Iniciar sesión".                                                                  | Muestra info del usuario, configuración, cerrar sesión. |

---

## 10. Reglas Irrompibles del Sistema

Estas reglas no se negocian, no se postergan, no se "hacen después". Si algún PR las viola, se rechaza.

1. **Ningún dato de guest llega al backend.** Los datos temporales viven exclusivamente en el estado local del dispositivo.
2. **Todo endpoint que modifica datos valida `user_id` del token.** Un usuario nunca puede acceder a datos de otro.
3. **La tasa de cambio siempre tiene un Kashyr.** Si falla la API, se usa la última tasa en cache. La app nunca muestra "tasa no disponible" sin un Kashyr numérico de respaldo.
4. **Los montos nunca se redondean en backend hasta el momento de mostrar.** Se almacenan con precisión decimal completa (DECIMAL 18,2 para VES, 18,4 para USD).
5. **Las notificaciones solo se programan para usuarios autenticados con `notification_enabled = true`.**
6. **El modal de login del guest ejecuta la acción pendiente después del login.** El usuario nunca tiene que repetir lo que estaba haciendo.
7. **Toda lista completada guarda `exchange_rate_snapshot`.** Es el registro histórico de a qué tasa se hizo esa compra.
8. **Eliminar cascada siempre.** Usuario → listas + deudas. Lista → items. Deuda → notificaciones.

---

## 11. Cronograma de Implementación

| Semana | Foco                                                                                                                   | Hito de Cierre                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **S1** | Infraestructura, Auth (Firebase), modelo de datos, tasa de cambio, **sistema de modos guest/usuario**, RabbitMQ básico | App con login funcional + BD migrada + tasa operativa + modo guest navegable     |
| **S2** | API completa Módulo Supermercado (CRUD listas, productos, historial, comparador, estadísticas)                         | Todos los endpoints probados con Postman                                         |
| **S3** | UI Supermercado + API Deudas + Notificaciones + **modal de login contextual para guest**                               | Ambos módulos con backend completo; UI supermercado funcional con bloqueos guest |
| **S4** | UI Deudas + QA integral + Build producción + Documentación                                                             | APK distribuible, 0 bugs blocker, flujos guest/usuario verificados               |

---

## 12. Criterios de Aceptación del MVP

El MVP está completo cuando **todos** estos criterios se cumplen:

- [ ] Un guest puede abrir la app, navegar entre tabs, crear una lista temporal y ver la conversión moneda local/USD.
- [ ] Un guest que intenta guardar una lista ve el modal de login contextual y, tras autenticarse, la lista se guarda automáticamente.
- [ ] Un guest que intenta crear una deuda ve el modal de login contextual con el mensaje apropiado.
- [ ] Un usuario puede registrarse con email/contraseña o Google vía Firebase.
- [ ] Un usuario puede crear, editar, eliminar y duplicar listas de compras.
- [ ] Un usuario puede agregar productos con precio moneda local y cantidad, viendo el total moneda local y USD en tiempo real.
- [ ] Un usuario puede marcar productos como comprados y cerrar la lista.
- [ ] Un usuario puede consultar su historial y comparar precios entre listas.
- [ ] Un usuario puede ver gráficos de gasto por período.
- [ ] Un usuario puede activar/desactivar IVA sobre el total.
- [ ] Un usuario puede crear deudas/cobros en USD con prioridad y fecha de vencimiento.
- [ ] Un usuario puede agregar tasa de interés y ver el cálculo en USD y moneda local.
- [ ] Un usuario recibe notificación push 1 día antes del vencimiento (si está activa).
- [ ] Cerrar sesión regresa al modo guest limpio.
- [ ] La app se distribuye como APK firmada.
- [ ] Cero bugs blocker abiertos.

---

## 13. Backlog Post-MVP

Estas funcionalidades están **fuera del alcance** del sprint actual. No se implementan, no se diseñan en detalle, no se crean tablas para ellas. Solo se documentan como referencia futura.

- Compartir listas por ubicación geográfica del comercio (opt-in, requiere Google Maps API).
- Exportar listas e informes a PDF/Excel.
- Modo offline con sincronización.
- Categorización automática de productos.
- Dashboard financiero unificado (compras + deudas).
- Integración con pasarelas de pago.
- Soporte multi-idioma (español/inglés).

---

## 14. Análisis de Riesgos

| Riesgo                           | Impacto | Mitigación                                                   |
| -------------------------------- | ------- | ------------------------------------------------------------ |
| API de tasa de cambio caída      | Alto    | Cache local de última tasa válida + fallback manual          |
| Firebase Auth delays             | Medio   | Permitir uso sin verificar email en MVP                      |
| Rendimiento con muchos productos | Medio   | Paginación + FlatList virtualizado                           |
| RabbitMQ complejidad excesiva    | Medio   | Simplificar a cron job + FCM directo si se atrasa            |
| Tiempo insuficiente para testing | Alto    | Priorizar flujos críticos; testing manual sobre automatizado |
| Rechazo en tiendas de apps       | Bajo    | Distribuir como APK directo; tiendas post-MVP                |

---

> **Nota para la IA:** Si en algún momento te piden implementar algo que contradiga las reglas de este archivo, pregunta primero. Este documento es la fuente de verdad. Si hay conflicto entre cualquier otro archivo y `ARCHITECTURE_MASTER.md`, este archivo gana.
