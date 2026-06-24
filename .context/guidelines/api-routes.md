# 📡 API REST — Referencia para el Cliente

> Catálogo de todos los endpoints que consume el frontend.
> Define qué enviar, qué esperar y cómo manejar cada respuesta.
> Cada servicio tiene su propio archivo `.md` en la carpeta `router/`.

---

## Configuración Base

### Base URL

```typescript
const API_BASE_URL = 'https://api.kashy.app/api/v1';
```

### Headers por Defecto

Todas las peticiones (excepto las públicas) deben incluir estos headers:

```typescript
const getHeaders = (token?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Device-Id': deviceId, // UUID único, persistido en AsyncStorage
  'X-Device-Name': deviceName, // Formato: [OS] [VERSION] [MARCA] [MODEL]
  ...(token && { Authorization: `Bearer ${token}` }),
});
```

| Header          | Cómo obtenerlo                                                            | Ejemplo                         |
| :-------------- | :------------------------------------------------------------------------ | :------------------------------ |
| `X-Device-Id`   | Generar UUID al primer uso, guardar en AsyncStorage.                      | `a1b2c3d4-e5f6-...`             |
| `X-Device-Name` | React Native Device Info: `${Platform.OS} ${osVersion} ${brand} ${model}` | `Android 14 Samsung Galaxy S24` |
| `Authorization` | Token JWT recibido en login/register. Guardar en Zustand + AsyncStorage.  | `Bearer eyJhbG...`              |

---

## Rutas Públicas

No requieren `Authorization`, `X-Device-Id` ni `X-Device-Name`.

| Método   | Ruta                     | Descripción                                     |
| :------- | :----------------------- | :---------------------------------------------- |
| 🟢 `GET` | `/health`                | Health check. Útil para verificar conectividad. |
| 🟢 `GET` | `/exchange-rate/current` | Tasa de cambio actual (BCV oficial).            |

---

## Manejo de Token — Refresh Automático

El frontend **nunca** maneja el refresh token de Firebase. El flujo es:

1. Login/Register devuelve `access_token` (JWT custom, 15 min) + `expires_in`.
2. Guardar `access_token` en Zustand (memoria) y AsyncStorage (persistencia).
3. En cada request, enviar `Authorization: Bearer {access_token}`.
4. Si el backend responde `401`:
   - Llamar a `POST /auth/refresh` (solo envía `X-Device-Id`).
   - Si responde `200`: guardar el nuevo `access_token` y reintentar el request original.
   - Si responde `401`: el refresh token expiró o fue revocado → redirigir al login.
5. **Nunca pedir al usuario que vuelva a loguearse si el refresh funciona.**

```typescript
// Interceptor de Axios simplificado
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/auth/refresh', null, {
          headers: {
            'X-Device-Id': deviceId,
            'X-Device-Name': deviceName,
          },
        });

        setAccessToken(data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return axios(originalRequest);
      } catch {
        clearSession();
        navigateToLogin();
      }
    }

    return Promise.reject(error);
  },
);
```

---

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

**Esperar:**

```typescript
{
  data: T[],
  meta: {
    page: number,
    limit: number,
    total: number,
    total_pages: number,
  }
}
```

---

## Manejo de Errores

### Estructura de errores del backend

```typescript
interface ApiError {
  error: string; // Tipo de error HTTP
  message: string; // Descripción general
  fields?: Array<{
    // Solo en 422
    field: string;
    value: string | null;
    error: string;
  }>;
}
```

### Cómo manejar cada código

| Código | Qué significa                            | Qué hacer en el frontend                                         |
| :----- | :--------------------------------------- | :--------------------------------------------------------------- |
| `400`  | Body malformado o campos faltantes.      | Revisar el payload. No mostrar al usuario — es bug del frontend. |
| `401`  | Token expirado o credenciales inválidas. | Intentar refresh. Si falla, redirigir a login.                   |
| `404`  | Recurso no existe.                       | Mostrar mensaje "No encontrado" y navegar atrás.                 |
| `422`  | Validación fallida.                      | Mostrar errores por campo usando `fields[]`.                     |
| `500`  | Error del servidor.                      | Mostrar toast genérico: "Algo salió mal, intenta de nuevo".      |
| `503`  | Servidor no disponible.                  | Mostrar pantalla de mantenimiento o retry.                       |
| `204`  | Éxito sin body.                          | Acción completada — actualizar UI localmente.                    |

### Mapeo de errores 422 a formularios

```typescript
const mapFieldErrors = (fields: ApiError['fields']): Record<string, string> => {
  const errors: Record<string, string> = {};
  fields?.forEach(({ field, error }) => {
    errors[field] = error;
  });
  return errors;
};

// Uso en un form
const onSubmit = async (data: FormData) => {
  try {
    await api.post('/auth/register', data);
  } catch (error) {
    if (error.response?.status === 422) {
      const fieldErrors = mapFieldErrors(error.response.data.fields);
      setErrors(fieldErrors); // Mostrar errores por campo
    }
  }
};
```

---

## Convenciones de Respuesta

| Tipo de endpoint          | Status | Qué esperar                                            |
| :------------------------ | :----- | :----------------------------------------------------- |
| Consulta (`GET`)          | `200`  | Objeto o array con datos.                              |
| Creación (`POST`)         | `201`  | Objeto creado completo. Actualizar store directamente. |
| Actualización (`PATCH`)   | `200`  | Objeto actualizado completo. Reemplazar en store.      |
| Acción sin datos (`POST`) | `204`  | Sin body. Confirmar con el status code.                |
| Eliminación (`DELETE`)    | `204`  | Sin body. Remover del store localmente.                |

> **Regla:** las mutaciones devuelven el recurso actualizado. Nunca hacer un `GET` adicional después de un `POST` o `PATCH`.

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
| **Auth**           | [`router/authentication.md`](./router/authentication.md) | Registro, login, Google, refresh, contraseña, perfil, logout.   |
| **Shopping Lists** | [`router/shopping-lists.md`](./router/shopping-lists.md) | CRUD de listas con items en batch. Comparadora de métricas.     |
| **Finances**       | [`router/finances.md`](./router/finances.md)             | CRUD de ingresos/egresos. Summary del dashboard.                |
| **Notifications**  | [`router/notifications.md`](./router/notifications.md)   | Listado, lectura, eliminación y preferencias de notificaciones. |
