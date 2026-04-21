# Anti-Patrones — Referencia

Los errores más comunes al aplicar Clean Architecture en este proyecto, con ejemplos de qué no hacer y la corrección correspondiente. Lee este archivo cuando necesites justificar por qué un patrón dado es problemático.

## Tabla de Contenidos

1. [Lógica o componentes dentro de app/](#1-lógica-o-componentes-dentro-de-app)
2. [fetch/axios en el componente](#2-fetchaxios-en-el-componente)
3. [Lógica de negocio en el hook](#3-lógica-de-negocio-en-el-hook)
4. [Import cruzado entre módulos](#4-import-cruzado-entre-módulos)
5. [God Use Case](#5-god-use-case)

---

## 1. Lógica o componentes dentro de app/

```typescript
// ❌ INCORRECTO — componente dentro de app/
// app/pages/auth/presentation/components/login-form.tsx
export function LoginForm() { /* ... */ }
// → Expo Router lo ve como ruta → warning → ruta fantasma

// ✅ CORRECTO — componente en modules/
// modules/auth/presentation/components/login-form.tsx
export function LoginForm() { /* ... */ }
// → Invisible para Expo Router → solo se importa explícitamente
```

**Por qué**: Expo Router escanea `app/` y trata cualquier archivo con `default export` como ruta. Un componente o hook ahí contamina el route tree y dispara warnings.

---

## 2. fetch/axios en el componente

```typescript
// ❌ INCORRECTO — llamada HTTP directa en la UI
function LoginScreen() {
  const handleLogin = async () => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  };
}

// ✅ CORRECTO — la UI solo conoce el hook
function LoginScreen() {
  const { handleLogin } = useLogin();
}
```

**Por qué**: la UI no debe saber cómo se hace la llamada. El hook encapsula el flujo, el use case orquesta, el datasource ejecuta. Cambiar de REST a GraphQL no debería tocar la screen.

---

## 3. Lógica de negocio en el hook

```typescript
// ❌ INCORRECTO — regla de negocio en el hook
function useDiscount(price: number, user: User) {
  const discount = user.role === 'premium' ? 0.2 : user.purchaseCount > 10 ? 0.1 : 0;
  return price * (1 - discount);
}

// ✅ CORRECTO — la regla vive en domain
// modules/pricing/domain/discount.ts
export function calculateDiscount(user: User): number {
  if (user.role === 'premium') return 0.2;
  if (user.purchaseCount > 10) return 0.1;
  return 0;
}
```

**Por qué**: las reglas de negocio son testeables sin React cuando viven en `domain/`. Un hook depende de React; una función pura no.

---

## 4. Import cruzado entre módulos

```typescript
// ❌ — un módulo importa internals de otro
import { AuthDatasource } from '@/modules/auth/infrastructure/auth.datasource';

// ✅ — expón un hook público o mueve a shared/
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
```

**Por qué**: importar `domain/application/infrastructure` de otro módulo rompe la encapsulación. Si dos módulos necesitan lo mismo, su lugar es `shared/`, no un módulo que "ya lo tiene". El linter marca esto como `[R4]`.

---

## 5. God Use Case

Un use case que valida, calcula, cobra, notifica, factura e inventaría en un solo `execute()`. Descompón en use cases pequeños o extrae lógica a `domain/`.

**Por qué**: si `execute()` supera 20-30 líneas, está haciendo más de una cosa. Cada responsabilidad adicional complica el testing y diluye el propósito del use case.
