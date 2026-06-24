# 📡 API REST — Referencia para el Cliente

> Catálogo de todos los endpoints que consume el frontend.
> Define qué enviar, qué esperar y cómo manejar cada respuesta.
> Cada servicio tiene su propio archivo `.md` en la carpeta `router/`.

---

## Configuración Base

### Base URL

Configurada por entorno (`shared/infrastructure/api/api-client.ts`):

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
```

Las rutas se concatenan directo (`${API_URL}${path}`). El prefijo `/api/v1` vive en `EXPO_PUBLIC_API_URL` (ver `.env.example`), no en el código.

### Headers por Defecto

El `api-client` arma estos headers. **No** envía `X-Device-Id` ni `X-Device-Name`.

```typescript
const requestHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  // Authorization se adjunta automáticamente desde el store, salvo skipAuth
  ...(token && { Authorization: `Bearer ${token}` }),
};
```

| Header          | Cómo se obtiene                                                                 |
| :-------------- | :----------------------------------------------------------------------------- |
| `Authorization` | `Bearer {accessToken}` — auto-adjuntado vía `getAccessToken()`. Omitido si `skipAuth: true`. |

---

## Rutas Públicas (`skipAuth`)

No adjuntan `Authorization`.

| Método   | Ruta                      | Descripción                          |
| :------- | :------------------------ | :----------------------------------- |
| 🟢 `GET` | `/exchange-rates/current` | Tasa de cambio actual (BCV oficial). |
| 🟡 `POST`| `/users/login`            | Login.                               |
| 🟡 `POST`| `/users/register`         | Registro.                            |
| 🟡 `POST`| `/users/google-auth`      | Login/registro con Google.           |
| 🟡 `POST`| `/users/refresh`          | Renovar tokens.                      |

---

## Sesión — Almacenamiento de Tokens

El frontend **sí** maneja el `refreshToken`. Ambos tokens se guardan en dos lugares (`shared/infrastructure/auth/auth.store.ts`):

1. **Memoria** — Zustand store (`accessToken`, `refreshToken`).
2. **Persistencia** — **SecureStore** (`expo-secure-store`, encriptado, keychainService `valo-secure-storage`), bajo la key `auth-session`:

```jsonc
// secureStorage['auth-session']
{
  "isAuthenticated": true,
  "user": { /* AuthUser */ },
  "accessToken": "string", // = idToken del backend
  "refreshToken": "string"
}
```

> ⚠️ Es **SecureStore**, no AsyncStorage. El backend devuelve `idToken`; el store lo persiste como `accessToken`.

Selectores síncronos para el `api-client`: `getAccessToken()`, `getRefreshToken()`, `updateTokensSync()`, `clearSessionSync()`.

### Refresh Automático

El `api-client` lo maneja solo — el código de feature **no** llama a refresh manualmente:

1. Cada request adjunta `Authorization: Bearer {accessToken}` automáticamente (salvo `skipAuth`).
2. Si la respuesta es `401` (y no es `skipAuth`):
   - Llama a `refreshTokenOnce()` → `POST /users/refresh` con body `{ refreshToken }`. Un **mutex** evita refreshes simultáneos: requests paralelos comparten la misma promesa.
   - Si vuelve `idToken`: `updateTokensSync()` guarda ambos tokens y **reintenta el request original una vez** con el nuevo token.
   - Si falla: `clearSessionSync()` → vuelve a guest mode (no se reintenta).
3. Al abrir la app, `useSessionRestore` hidrata desde SecureStore e intenta un refresh silencioso. Solo limpia sesión ante `4xx`; ante red/`5xx` mantiene la sesión local.

```typescript
// shared/infrastructure/api/api-client.ts (simplificado)
let response = await executeRequest(path, options);

if (response.status === 401 && !options.skipAuth) {
  const newTokens = await refreshTokenOnce(); // POST /users/refresh { refreshToken }
  if (newTokens?.idToken) {
    response = await executeRequest(path, { ...options, token: newTokens.idToken });
  } else {
    clearSessionSync(); // vuelve a guest
  }
}
```

---

## Envelope de Respuesta

Toda respuesta del backend viene envuelta (`api.types.ts` → `ApiEnvelope`):

```typescript
interface ApiEnvelope<T> {
  success: boolean;
  data: T;        // el recurso real
  timestamp: string;
  message?: string;
}
```

El `api-client` lo desempaqueta y retorna `{ success, data, timestamp, ok, status }`. **El contenido útil está en `data`** — los shapes de cada `router/*.md` describen `data`.

## Paginación

Los endpoints de listado usan `POST` con filtros en el body.

**Enviar:**

```typescript
{
  page: 1,
  limit: 20,
  filters: { /* específicos del recurso */ }
}
```

**Esperar** (dentro de `data`): `{ data: T[], meta: { page, limit, total, total_pages } }`.

---

## Manejo de Errores

### Estructura de errores del backend (`ApiErrorEnvelope`)

```typescript
interface ApiErrorEnvelope {
  success: false;
  error: {
    statusCode: number;
    code: string;
    message: string;
  };
  timestamp: string;
}
```

El `api-client` lanza `ApiHttpError` con `{ message, status, statusCode, code, timestamp }`. **No hay** array `fields[]` por campo — la validación llega como un solo `message`.

```typescript
try {
  await someUseCase.execute(input);
} catch (err) {
  if (err instanceof ApiHttpError) {
    if (err.status === 401) { /* el api-client ya intentó refresh */ }
    else showToast(err.message);
  }
}
```

### Cómo manejar cada código

| Código | Qué significa                            | Qué hacer en el frontend                                    |
| :----- | :--------------------------------------- | :---------------------------------------------------------- |
| `400`  | Body malformado o campos faltantes.      | Revisar el payload — bug del frontend.                      |
| `401`  | Token expirado o credenciales inválidas. | El api-client intenta refresh; si falla → guest/login.      |
| `404`  | Recurso no existe.                       | Mostrar "No encontrado" y navegar atrás.                    |
| `409`  | Conflicto (p.ej. email ya registrado).   | Mostrar `error.message`.                                    |
| `422`  | Validación fallida.                      | Mostrar `error.message` (no hay desglose por campo).        |
| `500`  | Error del servidor.                      | Toast genérico: "Algo salió mal, intenta de nuevo".         |
| `503`  | Servidor no disponible.                  | Pantalla de mantenimiento o retry.                          |
| `204`  | Éxito sin body.                          | Acción completada — actualizar UI localmente.               |

---

## Convenciones de Respuesta

| Tipo de endpoint          | Status      | Qué esperar                                                |
| :------------------------ | :---------- | :-------------------------------------------------------- |
| Consulta (`GET`)          | `200`       | Objeto o array en `data`.                                 |
| Creación (`POST`)         | `201`       | Objeto creado en `data` (cuando aplica).                  |
| Actualización (`PUT`/`PATCH`) | `200`/`204` | Objeto actualizado o sin body (perfil retorna `void`).   |
| Acción sin datos (`POST`) | `204`       | Sin body. Confirmar con el status code.                  |
| Eliminación (`DELETE`)    | `204`       | Sin body. Remover del store localmente.                  |

---

## Leyenda Visual

| Emoji | Verbo    | Uso típico                  |
| :---- | :------- | :-------------------------- |
| 🟢    | `GET`    | Obtener recursos (lectura). |
| 🟡    | `POST`   | Crear recursos o acciones.  |
| 🟠    | `PATCH`  | Actualización parcial.      |
| 🔴    | `DELETE` | Eliminar recurso.           |

---

## Catálogo de Servicios

| Servicio           | Archivo                                                  | Descripción                                                     |
| :----------------- | :------------------------------------------------------- | :-------------------------------------------------------------- |
| **Auth & Users**   | [`router/authentication.md`](./router/authentication.md) | `/users/*` — registro, login, Google, refresh, perfil, contraseña. Logout local. |
| **Shopping Lists** | [`router/shopping-lists.md`](./router/shopping-lists.md) | CRUD de listas con items en batch. Comparadora de métricas.     |
| **Finances**       | [`router/finances.md`](./router/finances.md)             | CRUD de ingresos/egresos. Summary del dashboard.                |
| **Notifications**  | [`router/notifications.md`](./router/notifications.md)   | Listado, lectura, eliminación y preferencias de notificaciones. |
