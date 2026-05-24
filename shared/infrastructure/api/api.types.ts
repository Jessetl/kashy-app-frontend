export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  /** Si true, no adjunta el token automáticamente (para login/refresh) */
  skipAuth?: boolean;
  /** Si true, no envía los headers `X-Device-Id` / `X-Device-Name`
   *  (para `/auth/register` y `/auth/recover-password`). */
  skipDeviceHeaders?: boolean;
}

export interface ApiEnvelope<TData> {
  success: boolean;
  data: TData;
  timestamp: string;
  message?: string;
}

/** Detalle de error por campo (presente en respuestas 422). */
export interface ApiErrorField {
  field: string;
  value: string | null;
  error: string;
}

export interface ApiErrorDetail {
  statusCode: number;
  code: string;
  message: string;
  fields?: ApiErrorField[];
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
  /** Algunos endpoints devuelven `fields` a nivel raíz en lugar de bajo `error`. */
  fields?: ApiErrorField[];
}

export interface ApiResponse<TData> extends ApiEnvelope<TData> {
  ok: boolean;
  status: number;
}
