import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useEffect, useRef } from 'react';
import { useShoppingStore } from '../store/useShoppingStore';

/**
 * Flow 11 — sync guest → auth post-login.
 *
 * Detecta la transición `isAuthenticated: false → true` y dispara
 * `syncGuestData` para promover las listas locales (`local-*`) creadas en modo
 * invitado a UUIDs del servidor.
 *
 * Se monta en `app/(tabs)/shopping/_layout.tsx` para que la sincronización
 * ocurra cuando el módulo está activo (evita carrera con `useResetShoppingLists`
 * en logout).
 */
export function useGuestSyncOnLogin(): void {
  const { isAuthenticated } = useAuth();
  const syncGuestData = useShoppingStore((s) => s.syncGuestData);
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    const prev = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;
    // Solo dispara en transición guest → auth (no en mount inicial auth).
    if (!prev && isAuthenticated) {
      void syncGuestData();
    }
  }, [isAuthenticated, syncGuestData]);
}
