import type { AuthTokens } from '@/shared/domain/auth/auth.types';

import type { ApiEnvelope } from './api.types';

interface TokenCandidate {
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
}

function isTokenCandidate(value: unknown): value is TokenCandidate {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.accessToken === 'string' && typeof v.refreshToken === 'string'
  );
}

export function extractAuthTokens(payload: unknown): AuthTokens | null {
  const envelope = payload as Partial<ApiEnvelope<unknown>>;
  const innerData = envelope?.data;

  const candidate = isTokenCandidate(payload)
    ? payload
    : isTokenCandidate(innerData)
      ? innerData
      : null;

  if (!candidate) {
    return null;
  }

  const accessToken = candidate.accessToken as string;
  const refreshToken = candidate.refreshToken as string;
  const expiresIn =
    typeof candidate.expiresIn === 'number' ? candidate.expiresIn : 900;

  return { accessToken, refreshToken, expiresIn };
}
