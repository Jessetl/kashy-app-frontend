# 🔔 Notifications — `/api/v1/notifications`

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

---

## Endpoints

### 🟡 `POST /notifications/search`

**Enviar:**

```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "is_read": "boolean | null",
    "status": "PENDING | SENT | FAILED | null",
    "type": "string | null",
    "scheduled_date_from": "date | null",
    "scheduled_date_to": "date | null"
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
      "scheduled_at": "2026-06-14",
      "sent_at": "2026-06-14 | null",
      "status": "SENT",
      "is_read": false,
      "financial_record": {
        "id": "uuid",
        "title": "string",
        "type": "EXPENSE",
        "amount_local": 0.0,
        "amount_usd": 0.0,
        "date": "2026-06-15"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

> Cada notificación incluye un resumen del registro financiero asociado. Usar `financial_record.id` para navegar al detalle si el usuario toca la notificación.

**Acción en frontend:** Renderizar lista en el dropdown de notificaciones. Resaltar visualmente las que tienen `is_read: false`.

**Errores:** `400`, `401`

---

### 🟢 `GET /notifications/unread-count`

**Esperar `200`:**

```json
{
  "unread_count": 5
}
```

**Acción en frontend:** Actualizar el badge del icono de notificaciones en el Dashboard. Llamar este endpoint al cargar el Dashboard y después de marcar como leídas.

**Errores:** `401`

---

### 🟠 `PATCH /notifications/:id/read`

**Enviar:** Body vacío.

**Esperar `200`:**

```json
{
  "id": "uuid",
  "type": "string",
  "scheduled_at": "2026-06-14",
  "sent_at": "2026-06-14 | null",
  "status": "SENT",
  "is_read": true,
  "financial_record": {
    "id": "uuid",
    "title": "string",
    "type": "EXPENSE",
    "amount_local": 0.0,
    "amount_usd": 0.0,
    "date": "2026-06-15"
  }
}
```

**Acción en frontend:** Actualizar la notificación en el store con `is_read: true`. Decrementar el badge.

**Errores:** `400`, `401`, `404`

---

### 🟡 `POST /notifications/read-all`

**Enviar:** Body vacío.

**Esperar `200`:**

```json
{
  "marked_count": 5
}
```

**Acción en frontend:** Marcar todas las notificaciones del store como `is_read: true`. Resetear el badge a 0.

**Errores:** `401`

---

### 🔴 `DELETE /notifications/:id`

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Remover la notificación del store. Decrementar el badge si era no leída.

> Eliminar una notificación no afecta al registro financiero asociado.

**Errores:** `400`, `401`, `404`

---

### 🟢 `GET /notifications/preferences`

**Esperar `200`:**

```json
{
  "push_enabled": true,
  "debt_reminders": true,
  "price_alerts": false,
  "list_reminders": true
}
```

**Acción en frontend:** Renderizar los toggles en la pantalla de configuración de notificaciones.

**Errores:** `401`

---

### 🟠 `PATCH /notifications/preferences`

**Enviar:** Solo los campos que cambian.

```json
{
  "push_enabled": "boolean | null",
  "debt_reminders": "boolean | null",
  "price_alerts": "boolean | null",
  "list_reminders": "boolean | null"
}
```

**Esperar `200`:**

```json
{
  "push_enabled": true,
  "debt_reminders": true,
  "price_alerts": true,
  "list_reminders": false
}
```

**Acción en frontend:** Reemplazar preferencias en el store con la respuesta. Actualizar los toggles visualmente.

**Errores:** `400`, `401`, `422`
