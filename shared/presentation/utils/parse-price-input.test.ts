import { parsePriceInput } from './parse-price-input';

const assertEqual = (
  actual: number | null,
  expected: number | null,
  input: string,
) => {
  if (actual !== expected) {
    throw new Error(
      `parsePriceInput failed for "${input}": expected ${String(expected)}, got ${String(actual)}`,
    );
  }
};

const cases: { input: string; expected: number | null }[] = [
  { input: '', expected: null },
  { input: '   ', expected: null },
  { input: 'abc', expected: null },
  { input: '2', expected: 2 },
  { input: '2,5', expected: 2.5 },
  { input: '2.5', expected: 2.5 },
  { input: '1.234,56', expected: 1234.56 },
  { input: '1,234.56', expected: 1234.56 },
  { input: '1,234', expected: 1234 },
  { input: '1.234', expected: 1234 },
  { input: '12,34', expected: 12.34 },
  { input: '12.34', expected: 12.34 },
  { input: '$ 2,50', expected: 2.5 },
  { input: '1.234.567,89', expected: 1234567.89 },
  { input: '1,234,567.89', expected: 1234567.89 },
];

cases.forEach(({ input, expected }) => {
  assertEqual(parsePriceInput(input), expected, input);
});

export {};
