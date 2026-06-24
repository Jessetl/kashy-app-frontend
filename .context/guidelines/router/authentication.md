# 🔐 Auth & Users — `/users`

> Endpoints de autenticación, sesión, perfil y contraseña.
> El frontend nunca interactúa con Firebase directamente — todo pasa por el backend.
> Refleja el código real (`modules/auth`, `modules/profile`, `shared/infrastructure/api`).

---

## Resumen

| Emoji | Método | Ruta                   | Auth | Descripción                                  |
| :---: | ------ | ---------------------- | :--: | -------------------------------------------- |
|  🟡   | `POST` | `/users/register`      |  ❌  | Registro con email y contraseña.             |
|  🟡   | `POST` | `/users/login`         |  ❌  | Login con email y contraseña.                |
|  🟡   | `POST` | `/users/google-auth`   |  ❌  | Login/registro con Google (unificado).       |
|  🟡   | `POST` | `/users/refresh`       |  ❌  | Renovar tokens. Lo dispara el api-client.    |
|  🟠   | `PUT`  | `/users/me`            |  ✅  | Actualizar perfil (nombre).                  |
|  🟠   | `PUT`  | `/users/me/password`   |  ✅  | Cambiar contraseña.                          |

> **No existen** en el frontend: `logout`, `recover-password`, ni `GET` de perfil.
> El logout es **local** (`clearSession()` borra SecureStore + resetea stores). El usuario llega en el body de login/google-auth.

---

## Convenciones

- **Casing:** todo el contrato es `camelCase` (`idToken`, `refreshToken`, `firstName`, `locationLatitude`). No `snake_case`.
- **Envelope:** las respuestas vienen envueltas → `{ success, data, timestamp }`. Los shapes de abajo describen el contenido de `data`.
- `skipAuth: true` en login/register/google-auth/refresh (no adjuntan `Authorization`).

---

## Endpoints

### 🟡 `POST /users/register`

**Enviar:**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "country": "VE",
  "locationLatitude": 0.0,
  "locationLongitude": 0.0
}
```

**Esperar `201`:** sin sesión — el registro **no** auto-loguea (`register()` retorna `void`).

**Acción en frontend:** mostrar éxito y dirigir al login.

**Errores:** `400`, `409`, `422`

---

### 🟡 `POST /users/login`

**Enviar:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Esperar `200`** (dentro de `data`):

```json
{
  "idToken": "string",
  "refreshToken": "string",
  "expiresIn": "900",
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "displayName": "string | undefined",
    "firebaseUid": "string"
  }
}
```

**Acción en frontend:** `setSession()` → guarda `idToken` (como `accessToken`) + `refreshToken` + `user` en Zustand y **SecureStore**. Cierra modal de login. Ejecuta `pendingAction` si existe.

**Errores:** `400`, `401`

---

### 🟡 `POST /users/google-auth`

**Enviar:**

```json
{
  "idToken": "string | null",
  "accessToken": "string | null",
  "country": "VE",
  "locationLatitude": 0.0,
  "locationLongitude": 0.0
}
```

> `idToken`/`accessToken` se obtienen con Google Sign-In SDK en RN. Flujo unificado: crea cuenta si no existe, si no loguea.

**Esperar `200`:** mismo shape que login.

**Acción en frontend:** igual que login.

**Errores:** `400`, `401`

---

### 🟡 `POST /users/refresh`

> **No se llama manualmente.** Lo dispara el `api-client` automáticamente ante un `401`, con un mutex que evita refresh simultáneos (`refreshTokenOnce`). También lo usa `useSessionRestore` al abrir la app.

**Enviar:**

```json
{ "refreshToken": "string" }
```

**Esperar `200`** (dentro de `data`):

```json
{
  "idToken": "string",
  "refreshToken": "string",
  "expiresIn": "900"
}
```

**Acción en frontend:** `updateTokens()` reemplaza ambos tokens en Zustand + SecureStore y reintenta **una** vez el request original con el nuevo `idToken`.

**Si falla** (`!response.ok` o sin tokens): `clearSession()` → vuelve a guest. No se reintenta.

---

### 🟠 `PUT /users/me`

**Headers:** `Authorization`

**Enviar:** solo nombre.

```json
{
  "firstName": "string",
  "lastName": "string"
}
```

**Esperar:** `200`/`204`. El datasource retorna `void` — actualizar `user` en store localmente (`updateUser`).

**Errores:** `400`, `401`, `422`

---

### 🟠 `PUT /users/me/password`

**Headers:** `Authorization`

**Enviar:**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Esperar:** `200`/`204`. Retorna `void`.

**Acción en frontend:** mostrar confirmación.

**Errores:** `400`, `401`, `422`

---

## Logout (local, sin endpoint)

No hay `POST /logout`. El flujo:

1. `clearSession()` — borra estado de auth + `secureStorage.removeItem('auth-session')`.
2. Reset de stores cross-módulo (`use-reset-debts`, `use-reset-supermarket`).
3. Navegar a Dashboard como guest.
