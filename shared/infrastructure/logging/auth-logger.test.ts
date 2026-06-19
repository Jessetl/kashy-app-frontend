import { mask } from './auth-logger';

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    throw new Error(`mask failed: ${msg}`);
  }
};

// null/undefined → literal, sin reventar.
assert(mask(null) === 'null', 'null');
assert(mask(undefined) === 'undefined', 'undefined');

// Token corto: solo largo, nunca el valor.
assert(mask('abc') === '…(3)…', 'corto');
assert(!mask('shortsecret1').includes('shortsecret1'), 'corto no filtra');

// Token largo: huella (inicio+fin+largo), NUNCA el token completo.
const token = 'eyJhbGciOiJexampleMIDDLEsecretXYZa9Qk';
const out = mask(token);
assert(!out.includes('MIDDLE'), 'no filtra el medio');
assert(!out.includes(token), 'no filtra el token completo');
assert(out.startsWith('eyJhbG'), 'muestra primeros 6');
assert(out.endsWith('a9Qk'), 'muestra últimos 4');
assert(out.includes(`(${token.length})`), 'muestra largo');

// eslint-disable-next-line no-console
console.log('auth-logger mask ✓');

export {};
