# 🛒 Shopping Lists — `/shopping-lists`

> CRUD de listas de compras con items en batch y comparadora de métricas.
> Solo el rol KASHY consume estos endpoints. El GUEST opera en AsyncStorage.

---

## Resumen

| Emoji | Método   | Ruta                      | Auth | Descripción                                      |
| :---: | -------- | ------------------------- | :--: | ------------------------------------------------ |
|  🟡   | `POST`   | `/shopping-lists`         |  ✅  | Crear lista con todos sus items.                 |
|  🟡   | `POST`   | `/shopping-lists/search`  |  ✅  | Listar listas con filtros y paginación.          |
|  🟢   | `GET`    | `/shopping-lists/:id`     |  ✅  | Obtener detalle con items.                       |
|  🟠   | `PATCH`  | `/shopping-lists/:id`     |  ✅  | Actualizar lista y sincronizar items por upsert. |
|  🔴   | `DELETE` | `/shopping-lists/:id`     |  ✅  | Eliminar lista y sus items.                      |
|  🟡   | `POST`   | `/shopping-lists/compare` |  ✅  | Comparar productos entre 2 listas.               |

> **Nota:** Todas las rutas llevan el prefijo `/api/v1` (ya incluido en `API_BASE_URL`). Los headers `Authorization`, `X-Device-Id` y `X-Device-Name` son obligatorios en todos los endpoints.

> **Convención de nombrado:** Request y response usan **camelCase** en los keys JSON (`storeName`, `unitPriceLocal`, `subtotalLocal`, etc.). Los valores enum permanecen en `UPPER_SNAKE_CASE` (`TEMPLATE`, `RECEIPT`) y los discriminantes de comparación en `snake_case` (`list_a`, `list_b`, `equal`).

---

## Endpoints

### 🟡 `POST /shopping-lists`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "name": "string",
  "storeName": "string | null",
  "listType": "TEMPLATE | RECEIPT",
  "countryCode": "string",
  "currencyCode": "string",
  "exchangeRateSnapshot": 0.0,
  "ivaEnabled": false,
  "scheduledDate": "timestamp | null",
  "latitude": 0.0,
  "longitude": 0.0,
  "items": [
    {
      "productName": "string",
      "category": "string",
      "quantity": 1,
      "unitPriceLocal": 0.0,
      "unitPriceUsd": 0.0,
      "isChecked": false
    }
  ]
}
```

> El `exchangeRateSnapshot` se obtiene del endpoint `/exchange-rate/current` antes de crear la lista. El backend valida que esté dentro de ±1% de la tasa actual — si excede, responde `422`.

**Esperar `201`:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "storeName": "string | null",
  "listType": "TEMPLATE",
  "countryCode": "string",
  "currencyCode": "string",
  "exchangeRateSnapshot": 0.0,
  "ivaEnabled": false,
  "scheduledDate": "timestamp | null",
  "latitude": 0.0,
  "longitude": 0.0,
  "isActive": true,
  "subtotalLocal": 0.0,
  "subtotalUsd": 0.0,
  "ivaLocal": 0.0,
  "ivaUsd": 0.0,
  "totalLocal": 0.0,
  "totalUsd": 0.0,
  "items": [
    {
      "id": "uuid",
      "listId": "uuid",
      "productName": "string",
      "category": "string",
      "quantity": 1,
      "unitPriceLocal": 0.0,
      "unitPriceUsd": 0.0,
      "isChecked": false
    }
  ]
}
```

> **Totales calculados en backend:** el cliente no recalcula. Usar `subtotalLocal`, `subtotalUsd`, `ivaLocal`, `ivaUsd`, `totalLocal` y `totalUsd` directamente de la respuesta. Los campos `*Usd` pueden ser `null` si algún item carece de `unitPriceUsd`.

**Acción en frontend:** Agregar la lista al store. Navegar al detalle de la lista creada.

**Errores:**

| Código | Qué hacer                                                                                      |
| :----- | :--------------------------------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                                           |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.                          |
| `422`  | Validación fallida (incluye `exchangeRateSnapshot` fuera de rango). Mapear `fields[]` al form. |

---

### 🟡 `POST /shopping-lists/search`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "listType": "TEMPLATE | RECEIPT | null",
    "storeName": "string | null",
    "isActive": "boolean | null",
    "scheduledDateFrom": "timestamp | null",
    "scheduledDateTo": "timestamp | null"
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
      "storeName": "string | null",
      "listType": "TEMPLATE",
      "currencyCode": "string",
      "isActive": true,
      "scheduledDate": "timestamp | null",
      "itemsCount": 12,
      "checkedCount": 5,
      "totalLocal": 0.0,
      "totalUsd": 0.0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

> El listado devuelve resúmenes, no el detalle de items. Usar `GET /:id` para el detalle. `totalUsd` puede ser `null` si algún item carece de `unitPriceUsd`.

**Acción en frontend:** Renderizar la lista. Usar `itemsCount` y `checkedCount` para mostrar progreso. Usar `totalLocal` / `totalUsd` para mostrar el costo total.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                  |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |

---

### 🟢 `GET /shopping-lists/:id`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar `200`:** Objeto completo de la lista con todos sus items y totales calculados (mismo shape que el response de create).

**Acción en frontend:** Cargar en el store de detalle. Renderizar los items.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Lista no encontrada. Mostrar mensaje y navegar atrás al listado.      |

---

### 🟠 `PATCH /shopping-lists/:id`

> El array de `items` usa **upsert por `id`**: items con `id` existente se actualizan, items sin `id` se crean, items existentes no incluidos se eliminan. Si `items` se omite del body, los items existentes se conservan sin cambios.

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:** Solo los campos que cambian.

```json
{
  "name": "string | null",
  "storeName": "string | null",
  "listType": "TEMPLATE | RECEIPT | null",
  "currencyCode": "string | null",
  "exchangeRateSnapshot": "number | null",
  "ivaEnabled": "boolean | null",
  "scheduledDate": "timestamp | null",
  "latitude": "number | null",
  "longitude": "number | null",
  "isActive": "boolean | null",
  "items": [
    {
      "id": "uuid | null",
      "productName": "string",
      "category": "string",
      "quantity": 1,
      "unitPriceLocal": 0.0,
      "unitPriceUsd": 0.0,
      "isChecked": false
    }
  ]
}
```

> **Lógica de items:**
>
> - Item con `id` existente en la lista → se actualizan sus campos.
> - Item sin `id` (o `id` desconocido) → se crea con un nuevo UUID.
> - Item existente cuyo `id` no aparece en el array → se elimina.
> - Siempre incluir el `id` de los items que no cambiaron para que no se eliminen.

> **Validación de `exchangeRateSnapshot`:**
>
> - `listType = TEMPLATE`: se valida ±1% respecto a la tasa actual.
> - `listType = RECEIPT`: el backend responde `422` (snapshot inmutable post-compra).
> - Si se omite del body, se preserva el valor existente sin re-validar.

**Esperar `200`:** Objeto completo actualizado con totales recalculados (mismo shape que GET).

**Acción en frontend:** Reemplazar la lista en el store con la respuesta.

**Errores:**

| Código | Qué hacer                                                                                    |
| :----- | :------------------------------------------------------------------------------------------- |
| `400`  | Body malformado. Bug del frontend — revisar payload.                                         |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático.                        |
| `404`  | Lista no encontrada. Mostrar mensaje y navegar atrás al listado.                             |
| `422`  | Validación fallida (incluye snapshot inmutable en RECEIPT). Mapear `fields[]` al formulario. |

---

### 🔴 `DELETE /shopping-lists/:id`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Esperar:** `204 No Content` (sin body).

**Acción en frontend:** Remover la lista del store. Navegar atrás al listado.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Lista no encontrada. Ya fue eliminada — actualizar UI.                |

---

### 🟡 `POST /shopping-lists/compare`

**Headers:** `Authorization`, `X-Device-Id`, `X-Device-Name`

**Enviar:**

```json
{
  "listAId": "uuid",
  "listBId": "uuid"
}
```

**Esperar `200`:**

```json
{
  "listA": {
    "id": "uuid",
    "name": "string",
    "storeName": "string | null"
  },
  "listB": {
    "id": "uuid",
    "name": "string",
    "storeName": "string | null"
  },
  "matchedItems": [
    {
      "productName": "string",
      "category": "string",
      "listAPriceLocal": 0.0,
      "listAPriceUsd": 0.0,
      "listAQuantity": 1,
      "listBPriceLocal": 0.0,
      "listBPriceUsd": 0.0,
      "listBQuantity": 1,
      "priceDiffLocal": 0.0,
      "priceDiffUsd": 0.0,
      "cheaperIn": "list_a | list_b | equal"
    }
  ],
  "unmatchedItems": {
    "onlyInListA": [
      {
        "productName": "string",
        "category": "string",
        "quantity": 1,
        "unitPriceLocal": 0.0,
        "unitPriceUsd": 0.0
      }
    ],
    "onlyInListB": [
      {
        "productName": "string",
        "category": "string",
        "quantity": 1,
        "unitPriceLocal": 0.0,
        "unitPriceUsd": 0.0
      }
    ]
  },
  "summary": {
    "totalMatched": 8,
    "totalUnmatchedA": 2,
    "totalUnmatchedB": 3,
    "listATotalLocal": 0.0,
    "listBTotalLocal": 0.0,
    "savingsLocal": 0.0,
    "savingsUsd": 0.0,
    "recommended": "list_a | list_b | equal"
  }
}
```

> **Lógica de match:** se cruzan productos por `productName` (case-insensitive, trim). Los discriminantes `cheaperIn` y `recommended` retornan `'list_a'`, `'list_b'` o `'equal'`.

**Acción en frontend:** Renderizar la comparadora con 3 secciones: productos en común (con diferencia de precio resaltada), productos solo en lista A, productos solo en lista B. Mostrar el `summary` con la recomendación.

**Errores:**

| Código | Qué hacer                                                             |
| :----- | :-------------------------------------------------------------------- |
| `400`  | Body malformado o IDs inválidos. Bug del frontend.                    |
| `401`  | Token expirado. El interceptor debería manejar el refresh automático. |
| `404`  | Una o ambas listas no existen. Mostrar mensaje y actualizar UI.       |
