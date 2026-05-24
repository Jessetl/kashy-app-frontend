import type { ApiErrorField } from './api.types';

export class ApiHttpError extends Error {
  readonly status: number;
  readonly statusCode?: number;
  readonly code?: string;
  readonly timestamp?: string;
  readonly fields?: ApiErrorField[];

  constructor(params: {
    message: string;
    status: number;
    statusCode?: number;
    code?: string;
    timestamp?: string;
    fields?: ApiErrorField[];
  }) {
    super(params.message);
    this.name = 'ApiHttpError';
    this.status = params.status;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.timestamp = params.timestamp;
    this.fields = params.fields;
  }

  /** Devuelve `{ [fieldName]: errorMessage }` listo para `react-hook-form.setError`. */
  toFieldErrorMap(): Record<string, string> {
    const map: Record<string, string> = {};
    this.fields?.forEach(({ field, error }) => {
      map[field] = error;
    });
    return map;
  }
}
