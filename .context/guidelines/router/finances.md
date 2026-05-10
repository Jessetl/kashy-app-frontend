# 💰 Finances — `/api/v1/finances`

> CRUD de registros financieros y summary del dashboard.
> Solo el rol KASHY consume estos endpoints. El GUEST solo visualiza datos estáticos/vacíos.

---

## Resumen

| Emoji | Método   | Ruta                | Auth | Descripción                                |
| :---: | -------- | ------------------- | :--: | ------------------------------------------ |
|  🟡   | `POST`   | `/finances`         |  ✅  | Crear ingreso o egreso.                    |
|  🟡   | `POST`   | `/finances/search`  |  ✅  | Listar registros con filtros y paginación. |
|  🟢   | `GET`    | `/finances/:id`     |  ✅  | Obtener detalle de un registro.            |
|  🟠   | `PATCH`  | `/finances/:id`     |  ✅  | Actualizar un registro.                    |
|  🔴   | `DELETE` | `/finances/:id`     |  ✅  | Eliminar un registro.                      |
|  🟢   | `GET`    | `/finances/summary` |  ✅  | Resumen del mes para el dashboard.         |

---

## Endpoints

### 🟡 `POST /finances`

**Enviar:**

```json
{
  "type": "INCOME | EXPENSE",
  "title": "string",
  "description": "string | null",
  "amount_local": 0.0,
  "amount_usd": 0.0,
  "priority": "HIGH | MEDIUM | LOW | null",
  "interest_rate": 0.0,
  "date": "2026-06-15",
  "is_recurring": false,
  "recurrence_day": "integer (1-31) | null"
}
```

> El frontend calcula la conversión entre `amount_local` y `amount_usd` usando la tasa de cambio actual. El usuario elige en qué moneda ingresar, el frontend calcula la otra. El backend valida la consistencia (±1% de tolerancia).

**Esperar `201`:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "EXPENSE",
  "title": "string",
  "description": "string | null",
  "amount_local": 0.0,
  "amount_usd": 0.0,
  "priority": "HIGH | null",
  "interest_rate": 0.0,
  "date": "2026-06-15",
  "is_recurring": false,
  "recurrence_day": null,
  "notification": {
    "id": "uuid",
    "scheduled_at": "2026-06-14",
    "status": "PENDING"
  }
}
```

> Si `date` está presente, el backend crea automáticamente una notificación 1 día antes. Si `date` es null, `notification` será null.

**Acción en frontend:** Agregar al store. Si tiene `notification`, mostrar indicador de recordatorio.

**Errores:** `400`, `401`, `422`

---

### 🟡 `POST /finances/search`

**Enviar:**

```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "type": "INCOME | EXPENSE | null",
    "priority": "HIGH | MEDIUM | LOW | null",
    "is_recurring": "boolean | null",
    "date_from": "date | null",
    "date_to": "date | null"
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
      "amount_local": 0.0,
      "amount_usd": 0.0,
      "priority": "HIGH | null",
      "date": "2026-06-15",
      "is_recurring": false,
      "notification_status": "PENDING | SENT | FAILED | null"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "total_pages": 2
  }
}
```

> El listado devuelve resúmenes. Usar `GET /:id` para el detalle completo con notificación.

**Acción en frontend:** Renderizar la lista de finanzas. Usar `notification_status` para mostrar íconos de estado.

**Errores:** `400`, `401`

---

### 🟢 `GET /finances/:id`

**Esperar `200`:** Objeto completo del registro con su notificación (mismo shape que response de create).

**Acción en frontend:** Cargar en el store de detalle. Mostrar todos los campos incluyendo `description`, `interest_rate` y detalle de notificación.

**Errores:** `400`, `401`, `404`

---

### 🟠 `PATCH /finances/:id`

**Enviar:** Solo los campos que cambian.

```json
{
  "type": "INCOME | EXPENSE | null",
  "title": "string | null",
  "description": "string | null",
  "amount_local": "number | null",
  "amount_usd": "number | null",
  "priority": "HIGH | MEDIUM | LOW | null",
  "interest_rate": "number | null",
  "date": "date | null",
  "is_recurring": "boolean | null",
  "recurrence_day": "integer (1-31) | null"
}
```

> Si se cambia la `date`, el backend reprograma la notificación automáticamente. No hay que hacer nada extra desde el frontend.

**Esperar `200`:** Objeto completo actualizado (mismo shape que GET).

**Acción en frontend:** Reemplazar en el store con la respuesta.

**Errores:** `400`, `401`, `404`, `422`

---

### 🔴 `DELETE /finances/:id`

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Remover del store. Navegar atrás al listado. El backend elimina las notificaciones asociadas automáticamente.

**Errores:** `400`, `401`, `404`

---

### 🟢 `GET /finances/summary`

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
  "total_income_local": 0.0,
  "total_income_usd": 0.0,
  "total_expense_local": 0.0,
  "total_expense_usd": 0.0,
  "net_balance_local": 0.0,
  "net_balance_usd": 0.0,
  "upcoming_expenses": [
    {
      "id": "uuid",
      "title": "string",
      "amount_local": 0.0,
      "amount_usd": 0.0,
      "date": "2026-06-15",
      "priority": "HIGH | null"
    }
  ]
}
```

> `upcoming_expenses` devuelve máximo 3 egresos por vencer. Esto alimenta el Dashboard.

**Acción en frontend:** Renderizar balance neto, ingresos, egresos y los próximos 3 vencimientos en el Dashboard.

**Errores:** `400`, `401`
