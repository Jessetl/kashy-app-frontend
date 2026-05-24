# 🔐 Auth — `/auth`

> Endpoints de autenticación, contraseña, perfil y sesión.
> El frontend nunca interactúa con Firebase directamente — todo pasa por el backend.

> **Convención de nombrado:** Request y response usan **camelCase** en los keys JSON (`accessToken`, `firstName`, `avatarUrl`, `countryCode`, etc.). Los valores enum permanecen en `UPPER_SNAKE_CASE` (`FREE`).

---

## Resumen

| Emoji | Método  | Ruta                     | Auth | Descripción                                                                           |
| :---: | ------- | ------------------------ | :--: | ------------------------------------------------------------------------------------- |
|  🟡   | `POST`  | `/auth/register`         |  ❌  | Registro con email y contraseña. No abre sesión — requiere verificación de email.     |
|  🟡   | `POST`  | `/auth/login`            |  ❌  | Login con email y contraseña.                                                         |
|  🟡   | `POST`  | `/auth/login/google`     |  ❌  | Login con Google.                                                                     |
|  🟡   | `POST`  | `/auth/refresh`          |  ⚠️  | Renovar JWT expirado. Requiere JWT expirado como proof-of-possession + `X-Device-Id`. |
|  🟡   | `POST`  | `/auth/recover-password` |  ❌  | Enviar email de recuperación.                                                         |
|  🟡   | `POST`  | `/auth/change-password`  |  ✅  | Cambiar contraseña.                                                                   |
|  🟢   | `GET`   | `/auth/profile`          |  ✅  | Obtener perfil.                                                                       |
|  🟠   | `PATCH` | `/auth/profile`          |  ✅  | Actualizar perfil.                                                                    |
|  🟡   | `POST`  | `/auth/logout`           |  ✅  | Cerrar sesión.                                                                        |

> **Nota:** Todas las rutas llevan el prefijo `/api/v1` (ya incluido en `API_BASE_URL`). Los headers `X-Device-Id` y `X-Device-Name` son obligatorios en todos los endpoints de auth (excepto `register` y `recover-password`). Los endpoints con Auth ✅ requieren además `Authorization: Bearer {jwt}`.

---

## Endpoints

### 🟡 `POST /auth/register`

> No abre sesión. El usuario debe verificar su email y luego iniciar sesión vía `POST /auth/login`.

**Headers:** Ninguno requerido (no abre sesión, no requiere `X-Device-Id` / `X-Device-Name`).

**Enviar:**

```json
{
  "email": "string",
  "password": "string (min 8, max 64)",
  "firstName": "string (max 80)",
  "lastName": "string (max 80)",
  "countryCode": "string (ISO 3166-1 alpha-2, len 2)",
  "latitude": "number | null",
  "longitude": "number | null"
}
```

> **Campos requeridos:** `email`, `password`, `firstName`, `lastName`, `countryCode`.
> **Campos opcionales:** `latitude`, `longitude`.

**Esperar `201`:**

```json
{
  "message": "Usuario registrado. Revisa tu correo para verificar la cuenta antes de iniciar sesion.",
  "email": "string"
}
```

**Acción en frontend:**

1. Mostrar mensaje de confirmación: "Revisa tu correo para verificar tu cuenta".
2. Navegar a la pantalla de login.
3. **No guardar token ni abrir sesión** — el usuario debe verificar email primero.

**Errores:**

| Código | Qué hacer                                                                |
| :----- | :----------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                     |
| `409`  | Email ya registrado. Mostrar error en el campo email.                    |
| `422`  | Validación fallida. Mapear `fields[]` a errores por campo en formulario. |

---

### 🟡 `POST /auth/login`

**Headers:** `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Esperar `200`:**

```json
{
  "accessToken": "string",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string | null",
    "lastName": "string | null",
    "avatarUrl": "string | null",
    "subscriptionPlan": "string",
    "countryCode": "string",
    "latitude": "number | null",
    "longitude": "number | null"
  }
}
```

**Acción en frontend:** Guardar `accessToken` y `user` en Zustand + AsyncStorage. Navegar a Dashboard con replace.

**Errores:**

| Código | Qué hacer                                                               |
| :----- | :---------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                    |
| `401`  | Credenciales inválidas o email no verificado. Mostrar error al usuario. |

---

### 🟡 `POST /auth/login/google`

**Headers:** `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "googleIdToken": "string"
}
```

> El `googleIdToken` se obtiene usando Google Sign-In SDK en React Native. El frontend se autentica con Google, obtiene el token y lo envía al backend.

**Esperar `200`:** Mismo shape que login (incluye `latitude` y `longitude` en `user`).

**Acción en frontend:** Igual que login.

> **Nota:** En auto-registro vía Google, el backend asigna `countryCode = 'VE'` por defecto. El usuario puede actualizarlo vía `PATCH /auth/profile`.

**Errores:**

| Código | Qué hacer                                                        |
| :----- | :--------------------------------------------------------------- |
| `400`  | Token de Google inválido o malformado. Revisar integración.      |
| `401`  | Autenticación fallida contra Firebase. Mostrar error al usuario. |

---

### 🟡 `POST /auth/refresh`

> Renueva el JWT custom. Requiere el JWT expirado en el header como proof-of-possession.

**Headers:**

- `Authorization: Bearer {jwt}` — JWT actual o expirado. **Obligatorio** (proof-of-possession).
- `X-Device-Id` — **Obligatorio**. Debe corresponder al dispositivo dueño del refresh token.
- `X-Device-Name` — Opcional en esta ruta.

**Enviar:** Body vacío.

**Esperar `200`:**

```json
{
  "accessToken": "string",
  "expiresIn": 900
}
```

**Acción en frontend:** Reemplazar `accessToken` en Zustand + AsyncStorage. Reintentar el request original que falló con `401`.

**Errores:**

| Código | Qué hacer                                                                      |
| :----- | :----------------------------------------------------------------------------- |
| `400`  | Request malformado. Bug del frontend — revisar headers.                        |
| `401`  | Refresh token revocado, expirado o device no coincide. Limpiar sesión → login. |

> **Importante:** A diferencia de otros endpoints, el interceptor debe enviar el JWT expirado en `Authorization`. Sin él, el backend responde `401` inmediatamente.

---

### 🟡 `POST /auth/recover-password`

**Headers:** Ninguno requerido.

**Enviar:**

```json
{
  "email": "string"
}
```

**Esperar:** `204 No Content` (sin body).

> **Siempre responde `204`**, incluso si el email no existe. Esto es intencional (anti-enumeración de usuarios).

**Acción en frontend:** Mostrar mensaje de confirmación: "Revisa tu correo". Navegar de vuelta al login.

**Errores:**

| Código | Qué hacer                                                 |
| :----- | :-------------------------------------------------------- |
| `400`  | Body no es JSON válido o falta `email`. Bug del frontend. |

> No esperar `422` — el backend silencia errores de validación de negocio en este endpoint por seguridad.

---

### 🟡 `POST /auth/change-password`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Mostrar confirmación. Nota: otros dispositivos serán deslogueados automáticamente por el backend (revoca todos los refresh tokens).

**Errores:**

| Código | Qué hacer                                                                |
| :----- | :----------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend.                                       |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.    |
| `422`  | Validación fallida. Mapear `fields[]` a errores por campo en formulario. |

---

### 🟢 `GET /auth/profile`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar `200`:**

```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string | null",
  "lastName": "string | null",
  "avatarUrl": "string | null",
  "subscriptionPlan": "string",
  "countryCode": "string",
  "latitude": "number | null",
  "longitude": "number | null"
}
```

**Acción en frontend:** Actualizar `user` en el store.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Usuario no encontrado. Limpiar sesión → login.                        |

---

### 🟠 `PATCH /auth/profile`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Solo los campos que cambian.

```json
{
  "firstName": "string | null",
  "lastName": "string | null",
  "avatarUrl": "string | null",
  "countryCode": "string | null",
  "latitude": "number | null",
  "longitude": "number | null"
}
```

**Esperar `200`:** Objeto `user` actualizado (mismo shape que GET profile, incluye `latitude` y `longitude`).

**Acción en frontend:** Reemplazar `user` en el store con la respuesta.

**Errores:**

| Código | Qué hacer                                                                |
| :----- | :----------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend.                                       |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.    |
| `422`  | Validación fallida. Mapear `fields[]` a errores por campo en formulario. |

---

### 🟡 `POST /auth/logout`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Body vacío.

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Limpiar `accessToken` y `user` de Zustand + AsyncStorage. Navegar a Dashboard (como guest).

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Dispositivo no registrado. Limpiar sesión igualmente.                 |
