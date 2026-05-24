# 🔔 Notifications — `/notifications`

> Listado, lectura y eliminación de notificaciones, y gestión de preferencias.
> Solo el rol KASHY consume estos endpoints.

---

## Resumen

| Emoji | Método   | Ruta                          | Auth | Descripción                                     |
| :---: | -------- | ----------------------------- | :--: | ----------------------------------------------- |
|  🟡   | `POST`   | `/notifications/search`       |  ✅  | Listar notificaciones con filtros y paginación. |
|  🟢   | `GET`    | `/notifications/unread-count` |  ✅  | Contador de no leídas (badge).                  |
|  🟠   | `PATCH`  | `/notifications/:id/read`     |  ✅  | Marcar una como leída.                          |
|  🟡   | `POST`   | `/notifications/read-all`     |  ✅  | Marcar todas como leídas.                       |
|  🔴   | `DELETE` | `/notifications/:id`          |  ✅  | Eliminar una notificación.                      |
|  🟢   | `GET`    | `/notifications/preferences`  |  ✅  | Obtener preferencias.                           |
|  🟠   | `PATCH`  | `/notifications/preferences`  |  ✅  | Actualizar preferencias.                        |

> **Nota:** Todas las rutas llevan el prefijo `/api/v1` (ya incluido en `API_BASE_URL`). Los headers `Authorization`, `X-Device-Id` y `X-Device-Name` son obligatorios en todos los endpoints.

> **Convención de nombrado:** Request y response usan **camelCase** en los keys JSON (`isRead`, `sentAt`, `unreadCount`, `pushEnabled`, etc.). Los valores enum permanecen en `UPPER_SNAKE_CASE` (`PENDING`, `SENT`, `FAILED`, `EXPENSE`).

---

## Endpoints

### 🟡 `POST /notifications/search`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "isRead": "boolean | null",
    "status": "PENDING | SENT | FAILED | null",
    "type": "string | null",
    "scheduledDateFrom": "date | null",
    "scheduledDateTo": "date | null"
  }
}
```

**Esperar `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "string",
      "scheduledAt": "2026-06-14",
      "sentAt": "2026-06-14 | null",
      "status": "SENT",
      "isRead": false,
      "financialRecord": {
        "id": "uuid",
        "title": "string",
        "type": "EXPENSE",
        "amountLocal": 0.0,
        "amountUsd": 0.0,
        "date": "2026-06-15"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

> Cada notificación incluye un resumen del registro financiero asociado. Usar `financialRecord.id` para navegar al detalle si el usuario toca la notificación.

**Acción en frontend:** Renderizar lista en el dropdown de notificaciones. Resaltar visualmente las que tienen `isRead: false`.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                  |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |

---

### 🟢 `GET /notifications/unread-count`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar `200`:**

```json
{
  "unreadCount": 5
}
```

**Acción en frontend:** Actualizar el badge del icono de notificaciones en el Dashboard. Llamar este endpoint al cargar el Dashboard y después de marcar como leídas.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |

---

### 🟠 `PATCH /notifications/:id/read`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Body vacío.

**Esperar `200`:**

```json
{
  "id": "uuid",
  "type": "string",
  "scheduledAt": "2026-06-14",
  "sentAt": "2026-06-14 | null",
  "status": "SENT",
  "isRead": true,
  "financialRecord": {
    "id": "uuid",
    "title": "string",
    "type": "EXPENSE",
    "amountLocal": 0.0,
    "amountUsd": 0.0,
    "date": "2026-06-15"
  }
}
```

**Acción en frontend:** Actualizar la notificación en el store con `isRead: true`. Decrementar el badge.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                  |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Notificación no encontrada. Remover del store y actualizar UI.        |

---

### 🟡 `POST /notifications/read-all`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Body vacío.

**Esperar `200`:**

```json
{
  "markedCount": 5
}
```

**Acción en frontend:** Marcar todas las notificaciones del store como `isRead: true`. Resetear el badge a 0.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |

---

### 🔴 `DELETE /notifications/:id`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar:** `204 No Content` (sin body).

> Eliminar una notificación no afecta al registro financiero asociado.

**Acción en frontend:** Remover la notificación del store. Decrementar el badge si era no leída.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                  |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Notificación no encontrada. Remover del store y actualizar UI.        |

---

### 🟢 `GET /notifications/preferences`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar `200`:**

```json
{
  "pushEnabled": true,
  "debtReminders": true,
  "priceAlerts": false,
  "listReminders": true
}
```

> Si el usuario no tiene preferencias creadas, el backend devuelve los valores por defecto (todos en `true`).

**Acción en frontend:** Renderizar los toggles en la pantalla de configuración de notificaciones.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |

---

### 🟠 `PATCH /notifications/preferences`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Solo los campos que cambian.

```json
{
  "pushEnabled": "boolean | null",
  "debtReminders": "boolean | null",
  "priceAlerts": "boolean | null",
  "listReminders": "boolean | null"
}
```

**Esperar `200`:**

```json
{
  "pushEnabled": true,
  "debtReminders": true,
  "priceAlerts": true,
  "listReminders": false
}
```

> Si el usuario no tenía registro de preferencias, se crea automáticamente con los valores enviados y defaults para el resto.

**Acción en frontend:** Reemplazar preferencias en el store con la respuesta. Actualizar los toggles visualmente.

**Errores:**

| Código | Qué hacer                                                                |
| :----- | :----------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                     |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.    |
| `422`  | Validación fallida. Mapear `fields[]` a errores por campo en formulario. |
