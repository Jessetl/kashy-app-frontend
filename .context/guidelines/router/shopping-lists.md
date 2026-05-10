# 🛒 Shopping Lists — `/api/v1/shopping-lists`

> CRUD de listas de compras con items en batch y comparadora de métricas.
> Solo el rol KASHY consume estos endpoints. El GUEST opera en AsyncStorage.

---

## Resumen

| Emoji | Método   | Ruta                      | Auth | Descripción                             |
| :---: | -------- | ------------------------- | :--: | --------------------------------------- |
|  🟡   | `POST`   | `/shopping-lists`         |  ✅  | Crear lista con todos sus items.        |
|  🟡   | `POST`   | `/shopping-lists/search`  |  ✅  | Listar listas con filtros y paginación. |
|  🟢   | `GET`    | `/shopping-lists/:id`     |  ✅  | Obtener detalle con items.              |
|  🟠   | `PATCH`  | `/shopping-lists/:id`     |  ✅  | Actualizar lista y reemplazar items.    |
|  🔴   | `DELETE` | `/shopping-lists/:id`     |  ✅  | Eliminar lista y sus items.             |
|  🟡   | `POST`   | `/shopping-lists/compare` |  ✅  | Comparar productos entre 2 listas.      |

---

## Endpoints

### 🟡 `POST /shopping-lists`

**Enviar:**

```json
{
  "name": "string",
  "store_name": "string | null",
  "list_type": "TEMPLATE | RECEIPT",
  "country_code": "string",
  "currency_code": "string",
  "exchange_rate_snapshot": 0.0,
  "iva_enabled": false,
  "scheduled_date": "timestamp | null",
  "latitude": 0.0,
  "longitude": 0.0,
  "items": [
    {
      "product_name": "string",
      "category": "string",
      "quantity": 1,
      "unit_price_local": 0.0,
      "unit_price_usd": 0.0,
      "is_checked": false
    }
  ]
}
```

> El `exchange_rate_snapshot` se obtiene del endpoint `/exchange-rate/current` antes de crear la lista.

**Esperar `201`:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "store_name": "string | null",
  "list_type": "TEMPLATE",
  "country_code": "string",
  "currency_code": "string",
  "exchange_rate_snapshot": 0.0,
  "iva_enabled": false,
  "scheduled_date": "timestamp | null",
  "latitude": 0.0,
  "longitude": 0.0,
  "is_active": true,
  "items": [
    {
      "id": "uuid",
      "product_name": "string",
      "category": "string",
      "quantity": 1,
      "unit_price_local": 0.0,
      "unit_price_usd": 0.0,
      "is_checked": false
    }
  ]
}
```

**Acción en frontend:** Agregar la lista al store. Navegar al detalle de la lista creada.

**Errores:** `400`, `401`, `422`

---

### 🟡 `POST /shopping-lists/search`

**Enviar:**

```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "list_type": "TEMPLATE | RECEIPT | null",
    "store_name": "string | null",
    "is_active": "boolean | null",
    "scheduled_date_from": "timestamp | null",
    "scheduled_date_to": "timestamp | null"
  }
}
```

**Esperar `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "store_name": "string | null",
      "list_type": "TEMPLATE",
      "currency_code": "string",
      "is_active": true,
      "scheduled_date": "timestamp | null",
      "items_count": 12,
      "checked_count": 5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

> El listado devuelve resúmenes, no el detalle de items. Usar `GET /:id` para el detalle.

**Acción en frontend:** Renderizar la lista. Usar `items_count` y `checked_count` para mostrar progreso.

**Errores:** `400`, `401`

---

### 🟢 `GET /shopping-lists/:id`

**Esperar `200`:** Objeto completo de la lista con todos sus items (mismo shape que el response de create).

**Acción en frontend:** Cargar en el store de detalle. Renderizar los items.

**Errores:** `400`, `401`, `404`

---

### 🟠 `PATCH /shopping-lists/:id`

**Enviar:** Solo los campos que cambian. El array de `items` reemplaza completamente los anteriores.

```json
{
  "name": "string | null",
  "store_name": "string | null",
  "iva_enabled": "boolean | null",
  "is_active": "boolean | null",
  "items": [
    {
      "product_name": "string",
      "category": "string",
      "quantity": 1,
      "unit_price_local": 0.0,
      "unit_price_usd": 0.0,
      "is_checked": false
    }
  ]
}
```

> **Importante:** el array de `items` es un reemplazo total. Siempre enviar la lista completa de items, incluyendo los que no cambiaron.

**Esperar `200`:** Objeto completo actualizado (mismo shape que GET).

**Acción en frontend:** Reemplazar la lista en el store con la respuesta.

**Errores:** `400`, `401`, `404`, `422`

---

### 🔴 `DELETE /shopping-lists/:id`

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Remover la lista del store. Navegar atrás al listado.

**Errores:** `400`, `401`, `404`

---

### 🟡 `POST /shopping-lists/compare`

**Enviar:**

```json
{
  "list_a_id": "uuid",
  "list_b_id": "uuid"
}
```

**Esperar `200`:**

```json
{
  "list_a": {
    "id": "uuid",
    "name": "string",
    "store_name": "string | null"
  },
  "list_b": {
    "id": "uuid",
    "name": "string",
    "store_name": "string | null"
  },
  "matched_items": [
    {
      "product_name": "string",
      "category": "string",
      "list_a_price_local": 0.0,
      "list_a_price_usd": 0.0,
      "list_a_quantity": 1,
      "list_b_price_local": 0.0,
      "list_b_price_usd": 0.0,
      "list_b_quantity": 1,
      "price_diff_local": 0.0,
      "price_diff_usd": 0.0,
      "cheaper_in": "list_a | list_b | equal"
    }
  ],
  "unmatched_items": {
    "only_in_list_a": [
      {
        "product_name": "string",
        "category": "string",
        "quantity": 1,
        "unit_price_local": 0.0,
        "unit_price_usd": 0.0
      }
    ],
    "only_in_list_b": []
  },
  "summary": {
    "total_matched": 8,
    "total_unmatched_a": 2,
    "total_unmatched_b": 3,
    "list_a_total_local": 0.0,
    "list_b_total_local": 0.0,
    "savings_local": 0.0,
    "savings_usd": 0.0,
    "recommended": "list_a | list_b"
  }
}
```

**Acción en frontend:** Renderizar la comparadora con 3 secciones: productos en común (con diferencia de precio resaltada), productos solo en lista A, productos solo en lista B. Mostrar el `summary` con la recomendación.

**Errores:** `400`, `401`, `404`
