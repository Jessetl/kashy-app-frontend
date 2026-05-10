# Mapa de Navegación — Kashy

> Referencia compacta de las screens del proyecto. Consultar al crear o modificar pantallas.

## Roles

| Rol     | Hereda de | Descripción                                                                                            |
| ------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `GUEST` | —         | Sin sesión. Navega, ve dashboard y crea listas temporales, pero no persiste datos en BD.               |
| `KASHY` | `GUEST`   | Autenticado. Acceso completo a finanzas, listas, perfil y notificaciones. Sin acceso a Login/Register. |

## Tabs de Navegación

| Tab        | Icono | Roles | Descripción                                                              |
| ---------- | ----- | ----- | ------------------------------------------------------------------------ |
| `Home`     | 🏠    | ALL   | Dashboard principal. Balance, vencimientos, notificaciones, toggle tema. |
| `Compras`  | 🛒    | ALL   | Listas de compras. Guest crea pero no guarda.                            |
| `Finanzas` | 💰    | ALL   | Ingresos y egresos. Guest solo visualiza.                                |
| `Perfil`   | 👤    | ALL   | Datos de cuenta o invitado. Config de notificaciones.                    |

## Registro de Screens

| Screen                  |       Params        | Auth | Roles | Descripción                                                                                                           |
| ----------------------- | :-----------------: | :--: | :---: | --------------------------------------------------------------------------------------------------------------------- |
| `Splash`                |          —          |  ❌  |  ALL  | Entry point. Carga sesión y configuración inicial.                                                                    |
| `Dashboard`             |          —          |  ❌  |  ALL  | Balance neto, ingresos, egresos, próximos 3 vencimientos, toggle light/dark, icono de notificaciones con badge.       |
| `NotificationsDropdown` |          —          |  ✅  | KASHY | Desplegable desde el icono del dashboard. Lista de notificaciones con contador de no leídas.                          |
| `LoginModal`            |          —          |  ❌  | GUEST | Modal de autenticación. Se dispara al intentar una acción bloqueada.                                                  |
| `Register`              |          —          |  ❌  | GUEST | Registro de cuenta nueva (email/password, Google).                                                                    |
| `RecoverPassword`       |          —          |  ❌  | GUEST | Envío de email de recuperación de contraseña.                                                                         |
| `ShoppingLists`         |          —          |  ❌  |  ALL  | Listado de listas de compras. Guest ve listas temporales locales.                                                     |
| `ShoppingListDetail`    |  `listId: String`   |  ❌  |  ALL  | Productos de una lista. Guest puede crear y marcar, no guardar en BD.                                                 |
| `ShoppingMetrics`       |          —          |  ✅  | KASHY | Métricas y comparadora entre listas iguales.                                                                          |
| `FinanceList`           |          —          |  ❌  |  ALL  | Lista de ingresos y egresos. Guest solo visualiza sin poder crear.                                                    |
| `FinanceDetail`         | `financeId: String` |  ✅  | KASHY | Detalle de un ingreso o egreso. Creación, edición y eliminación.                                                      |
| `Profile`               |          —          |  ❌  |  ALL  | KASHY: datos de cuenta, cambio de contraseña, toggle light/dark. GUEST: se muestra como invitado con acción de login. |
| `NotificationSettings`  |          —          |  ✅  | KASHY | Configuración de notificaciones (activar/desactivar, preferencias). Accesible desde Perfil.                           |

## Navegaciones por Screen

| Origen               | Destino                 | Condición                                                 |
| -------------------- | ----------------------- | --------------------------------------------------------- |
| `Splash`             | `Dashboard`             | Carga de datos completada.                                |
| `Dashboard`          | `NotificationsDropdown` | Tap en icono de notificaciones (requiere sesión).         |
| `Dashboard`          | `LoginModal`            | Guest toca icono de notificaciones.                       |
| `ShoppingLists`      | `ShoppingListDetail`    | Tap en una lista.                                         |
| `ShoppingLists`      | `ShoppingMetrics`       | Tap en comparadora (requiere sesión).                     |
| `ShoppingLists`      | `LoginModal`            | Guest intenta guardar una lista.                          |
| `ShoppingListDetail` | `LoginModal`            | Guest intenta guardar cambios en BD.                      |
| `ShoppingMetrics`    | `ShoppingListDetail`    | Tap en una lista desde las métricas.                      |
| `FinanceList`        | `FinanceDetail`         | Tap en un ingreso/egreso (requiere sesión).               |
| `FinanceList`        | `LoginModal`            | Guest intenta crear ingreso/egreso.                       |
| `Profile`            | `NotificationSettings`  | Tap en configuración de notificaciones (requiere sesión). |
| `Profile`            | `LoginModal`            | Guest toca cualquier acción de cuenta.                    |
| `LoginModal`         | `Dashboard`             | Login exitoso (cierra modal, recarga datos).              |
| `LoginModal`         | `Register`              | Tap en "Crear cuenta".                                    |
| `LoginModal`         | `RecoverPassword`       | Tap en "¿Olvidaste tu contraseña?".                       |
| `Register`           | `Dashboard`             | Registro exitoso (replace, limpia stack).                 |
| `RecoverPassword`    | `LoginModal`            | Recuperación enviada exitosamente.                        |

## Guardias de Navegación

| Target solicitado       | Sesión    | Destino real    |
| ----------------------- | --------- | --------------- |
| `NotificationsDropdown` | `== null` | → `LoginModal`  |
| `ShoppingMetrics`       | `== null` | → `LoginModal`  |
| `FinanceDetail`         | `== null` | → `LoginModal`  |
| `NotificationSettings`  | `== null` | → `LoginModal`  |
| `LoginModal`            | `!= null` | → `Dashboard`   |
| `Register`              | `!= null` | → `Dashboard`   |
| `RecoverPassword`       | `!= null` | → `Dashboard`   |
| Cualquier otro          | —         | Sin redirección |

## Visibilidad por Rol

### Tabs (siempre visibles)

| Tab      | GUEST | KASHY |
| -------- | :---: | :---: |
| Home     |  ✅   |  ✅   |
| Compras  |  ✅   |  ✅   |
| Finanzas |  ✅   |  ✅   |
| Perfil   |  ✅   |  ✅   |

### Acciones dentro de cada Tab

| Acción                         |       GUEST       |    KASHY    |
| ------------------------------ | :---------------: | :---------: |
| Ver dashboard                  |        ✅         |     ✅      |
| Toggle light/dark              |        ✅         |     ✅      |
| Ver notificaciones             |    ❌ → Modal     |     ✅      |
| Crear lista de compras         |    ✅ (local)     |   ✅ (BD)   |
| Marcar productos               |    ✅ (local)     |   ✅ (BD)   |
| Guardar lista                  |    ❌ → Modal     |     ✅      |
| Comparadora de listas          |    ❌ → Modal     |     ✅      |
| Ver finanzas                   | ✅ (solo lectura) |     ✅      |
| Crear ingreso/egreso           |    ❌ → Modal     |     ✅      |
| Editar/eliminar ingreso/egreso |    ❌ → Modal     |     ✅      |
| Ver perfil                     |   ✅ (invitado)   | ✅ (cuenta) |
| Cambiar contraseña             |    ❌ → Modal     |     ✅      |
| Config notificaciones          |    ❌ → Modal     |     ✅      |
| Cerrar sesión                  |        ❌         |     ✅      |

## Notas de Implementación

- `Splash`: Entry point. Usa `navigator.replaceAll(Dashboard)` tras carga de datos.
- `LoginModal`: Es un modal, no una screen completa. Se dispara contextualmente desde cualquier acción bloqueada del guest.
- `Register` → `Dashboard`: Usar **replace** (el usuario no debe volver a Register con back).
- `RecoverPassword`: Accesible solo desde `LoginModal`. Al enviar la recuperación exitosamente, regresa al modal de login.
- `Dashboard`: Al navegar hacia esta screen desde login/registro, siempre hacer **replace** y limpiar el back stack.
- `NotificationsDropdown`: No es una pantalla independiente, es un desplegable/bottom sheet desde el icono del dashboard.
- Toggle light/dark disponible en `Dashboard` y `Profile`.
