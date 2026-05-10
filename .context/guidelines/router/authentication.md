# 🔐 Auth — `/api/v1/auth`

> Endpoints de autenticación, contraseña, perfil y sesión.
> El frontend nunca interactúa con Firebase directamente — todo pasa por el backend.

---

## Resumen

| Emoji | Método  | Ruta                     | Auth | Descripción                      |
| :---: | ------- | ------------------------ | :--: | -------------------------------- |
|  🟡   | `POST`  | `/auth/register`         |  ❌  | Registro con email y contraseña. |
|  🟡   | `POST`  | `/auth/login`            |  ❌  | Login con email y contraseña.    |
|  🟡   | `POST`  | `/auth/login/google`     |  ❌  | Login con Google.                |
|  🟡   | `POST`  | `/auth/refresh`          |  ❌  | Renovar JWT expirado.            |
|  🟡   | `POST`  | `/auth/recover-password` |  ❌  | Enviar email de recuperación.    |
|  🟡   | `POST`  | `/auth/change-password`  |  ✅  | Cambiar contraseña.              |
|  🟢   | `GET`   | `/auth/profile`          |  ✅  | Obtener perfil.                  |
|  🟠   | `PATCH` | `/auth/profile`          |  ✅  | Actualizar perfil.               |
|  🟡   | `POST`  | `/auth/logout`           |  ✅  | Cerrar sesión.                   |

---

## Endpoints

### 🟡 `POST /auth/register`

**Headers:** `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "email": "string",
  "password": "string",
  "first_name": "string | null",
  "last_name": "string | null"
}
```

**Esperar `201`:**

```json
{
  "access_token": "string",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "first_name": "string | null",
    "last_name": "string | null",
    "avatar_url": null,
    "subscription_plan": "FREE",
    "country_code": "VE"
  }
}
```

**Acción en frontend:** Guardar `access_token` en Zustand + AsyncStorage. Guardar `user` en el store. Navegar a Dashboard con replace.

**Errores:** `400`, `401`, `422`

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
  "access_token": "string",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "first_name": "string | null",
    "last_name": "string | null",
    "avatar_url": "string | null",
    "subscription_plan": "string",
    "country_code": "string"
  }
}
```

**Acción en frontend:** Guardar `access_token` y `user` en store. Cerrar modal de login. Recargar datos del dashboard.

**Errores:** `400`, `401`

---

### 🟡 `POST /auth/login/google`

**Headers:** `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "google_id_token": "string"
}
```

> El `google_id_token` se obtiene usando Google Sign-In SDK en React Native. El frontend se autentica con Google, obtiene el token y lo envía al backend.

**Esperar `200`:** Mismo shape que login.

**Acción en frontend:** Igual que login.

**Errores:** `400`, `401`

---

### 🟡 `POST /auth/refresh`

**Headers:** `X-Device-Id`, `X-Device-Name` (sin `Authorization`)

**Enviar:** Body vacío.

**Esperar `200`:**

```json
{
  "access_token": "string",
  "expires_in": 900
}
```

**Acción en frontend:** Reemplazar `access_token` en Zustand + AsyncStorage. Reintentar el request original que falló con `401`.

**Errores:**

- `401` → Refresh token revocado o expirado. Limpiar sesión y redirigir a login.
- `404` → Dispositivo no registrado. Redirigir a login.

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

**Acción en frontend:** Mostrar mensaje de confirmación: "Revisa tu correo". Navegar de vuelta al login modal.

**Errores:** `400`, `422`

---

### 🟡 `POST /auth/change-password`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "current_password": "string",
  "new_password": "string"
}
```

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Mostrar confirmación. Nota: otros dispositivos serán deslogueados automáticamente por el backend.

**Errores:** `400`, `401`, `422`

---

### 🟢 `GET /auth/profile`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar `200`:**

```json
{
  "id": "uuid",
  "email": "string",
  "first_name": "string | null",
  "last_name": "string | null",
  "avatar_url": "string | null",
  "subscription_plan": "string",
  "country_code": "string"
}
```

**Acción en frontend:** Actualizar `user` en el store.

**Errores:** `401`, `404`

---

### 🟠 `PATCH /auth/profile`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Solo los campos que cambian.

```json
{
  "first_name": "string | null",
  "last_name": "string | null",
  "avatar_url": "string | null",
  "country_code": "string | null",
  "latitude": "number | null",
  "longitude": "number | null"
}
```

**Esperar `200`:** Objeto `user` actualizado (mismo shape que GET profile).

**Acción en frontend:** Reemplazar `user` en el store con la respuesta.

**Errores:** `400`, `401`, `422`

---

### 🟡 `POST /auth/logout`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Body vacío.

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Limpiar `access_token` y `user` de Zustand + AsyncStorage. Navegar a Dashboard (como guest).

**Errores:** `401`, `404`
