# 💰 Finances — `/finances`

> CRUD de registros financieros y summary del dashboard.
> Solo el rol KASHY consume estos endpoints. El GUEST solo visualiza datos estáticos/vacíos.

> **Convención de nombrado:** Request y response usan **camelCase** en los keys JSON (`amountLocal`, `amountUsd`, `interestRate`, `isRecurring`, etc.). Los valores enum permanecen en `UPPER_SNAKE_CASE` (`INCOME`, `EXPENSE`, `HIGH`, `MEDIUM`, `LOW`, `PENDING`, `SENT`, `FAILED`).

---

## Resumen

| Emoji | Método   | Ruta                | Auth | Descripción                                |
| :---: | -------- | ------------------- | :--: | ------------------------------------------ |
|  🟡   | `POST`   | `/finances`         |  ✅  | Crear ingreso o egreso.                    |
|  🟡   | `POST`   | `/finances/search`  |  ✅  | Listar registros con filtros y paginación. |
|  🟢   | `GET`    | `/finances/:id`     |  ✅  | Obtener detalle de un registro.            |
|  🟠   | `PATCH`  | `/finances/:id`     |  ✅  | Actualizar un registro.                    |
|  🔴   | `DELETE` | `/finances/:id`     |  ✅  | Eliminar un registro y sus notificaciones. |
|  🟢   | `GET`    | `/finances/summary` |  ✅  | Resumen del mes para el dashboard.         |

> **Nota:** Todas las rutas llevan el prefijo `/api/v1` (ya incluido en `API_BASE_URL`). Los headers `Authorization`, `X-Device-Id` y `X-Device-Name` son obligatorios en todos los endpoints.

---

## Endpoints

### 🟡 `POST /finances`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "type": "INCOME | EXPENSE",
  "title": "string",
  "description": "string | null",
  "amountLocal": 0.0,
  "amountUsd": 0.0,
  "priority": "HIGH | MEDIUM | LOW | null",
  "interestRate": 0.0,
  "date": "2026-06-15 | null",
  "isRecurring": false,
  "recurrenceDay": "integer (1-31) | null"
}
```

> El frontend calcula la conversión entre `amountLocal` y `amountUsd` usando la tasa de cambio actual. El usuario elige en qué moneda ingresar, el frontend calcula la otra. El backend valida la consistencia (±1% de tolerancia).

**Esperar `201`:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EXPENSE",
  "title": "string",
  "description": "string | null",
  "amountLocal": 0.0,
  "amountUsd": 0.0,
  "priority": "HIGH | null",
  "interestRate": 0.0,
  "date": "2026-06-15 | null",
  "isRecurring": false,
  "recurrenceDay": null,
  "notification": {
    "id": "uuid",
    "scheduledAt": "2026-06-14",
    "sentAt": null,
    "status": "PENDING"
  }
}
```

> Si `date` está presente, el backend crea automáticamente una notificación 1 día antes. Si `date` es `null`, `notification` será `null`.

**Acción en frontend:** Agregar al store. Si tiene `notification`, mostrar indicador de recordatorio.

**Errores:**

| Código | Qué hacer                                                                |
| :----- | :----------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                     |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.    |
| `422`  | Validación fallida. Mapear `fields[]` a errores por campo en formulario. |

---

### 🟡 `POST /finances/search`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "type": "INCOME | EXPENSE | null",
    "priority": "HIGH | MEDIUM | LOW | null",
    "isRecurring": "boolean | null",
    "dateFrom": "date | null",
    "dateTo": "date | null"
  }
}
```

**Esperar `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EXPENSE",
      "title": "string",
      "amountLocal": 0.0,
      "amountUsd": 0.0,
      "priority": "HIGH | null",
      "date": "2026-06-15 | null",
      "isRecurring": false,
      "notificationStatus": "PENDING | SENT | FAILED | null"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2
  }
}
```

> El listado devuelve resúmenes. Usar `GET /:id` para el detalle completo con notificación.

**Acción en frontend:** Renderizar la lista de finanzas. Usar `notificationStatus` para mostrar íconos de estado.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                  |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |

---

### 🟢 `GET /finances/:id`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar `200`:** Objeto completo del registro con su notificación (mismo shape que response de create, incluye `sentAt` en `notification`).

**Acción en frontend:** Cargar en el store de detalle. Mostrar todos los campos incluyendo `description`, `interestRate` y detalle de notificación.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Registro no encontrado. Mostrar mensaje y navegar atrás al listado.   |

---

### 🟠 `PATCH /finances/:id`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Solo los campos que cambian.

```json
{
  "type": "INCOME | EXPENSE | null",
  "title": "string | null",
  "description": "string | null",
  "amountLocal": "number | null",
  "amountUsd": "number | null",
  "priority": "HIGH | MEDIUM | LOW | null",
  "interestRate": "number | null",
  "date": "date | null",
  "isRecurring": "boolean | null",
  "recurrenceDay": "integer (1-31) | null"
}
```

> Si se cambia la `date`, el backend reprograma la notificación automáticamente. No hay que hacer nada extra desde el frontend.

**Esperar `200`:** Objeto completo actualizado (mismo shape que GET).

**Acción en frontend:** Reemplazar en el store con la respuesta.

**Errores:**

| Código | Qué hacer                                                                |
| :----- | :----------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                     |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.    |
| `404`  | Registro no encontrado. Mostrar mensaje y navegar atrás al listado.      |
| `422`  | Validación fallida. Mapear `fields[]` a errores por campo en formulario. |

---

### 🔴 `DELETE /finances/:id`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar:** `204 No Content` (sin body).

> El backend elimina las notificaciones asociadas automáticamente.

**Acción en frontend:** Remover del store. Navegar atrás al listado.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Registro no encontrado. Ya fue eliminado — actualizar UI.             |

---

### 🟢 `GET /finances/summary`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Query params opcionales:**

| Param   | Tipo           | Default    | Descripción      |
| :------ | :------------- | :--------- | :--------------- |
| `month` | Integer (1-12) | Mes actual | Mes a consultar. |
| `year`  | Integer        | Año actual | Año a consultar. |

**Ejemplo:** `GET /finances/summary?month=6&year=2026`

**Esperar `200`:**

```json
{
  "month": 6,
  "year": 2026,
  "totalIncomeLocal": 0.0,
  "totalIncomeUsd": 0.0,
  "totalExpenseLocal": 0.0,
  "totalExpenseUsd": 0.0,
  "netBalanceLocal": 0.0,
  "netBalanceUsd": 0.0,
  "upcomingExpenses": [
    {
      "id": "uuid",
      "title": "string",
      "amountLocal": 0.0,
      "amountUsd": 0.0,
      "date": "2026-06-15",
      "priority": "HIGH | null"
    }
  ]
}
```

> `upcomingExpenses` devuelve máximo 3 egresos por vencer (ordenados por fecha ascendente, `date >= hoy`). Esto alimenta el Dashboard.

**Acción en frontend:** Renderizar balance neto, ingresos, egresos y los próximos 3 vencimientos en el Dashboard.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Query params inválidos. Bug del frontend — revisar values.            |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
