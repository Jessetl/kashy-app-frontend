export const parsePriceInput = (raw: string): number | null => {
  const sanitized = raw.replace(/\s/g, '').replace(/[^0-9.,]/g, '');
  if (!sanitized) {
    return null;
  }

  const lastDot = sanitized.lastIndexOf('.');
  const lastComma = sanitized.lastIndexOf(',');

  // If both separators exist, use whichever appears last as decimal separator.
  if (lastDot !== -1 && lastComma !== -1) {
    const decimalSeparator = lastDot > lastComma ? '.' : ',';
    const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
    const normalized = sanitized
      .split(thousandsSeparator)
      .join('')
      .replace(decimalSeparator, '.');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  // If only one separator exists, decide if it's decimal or thousands.
  const separator = lastDot !== -1 ? '.' : lastComma !== -1 ? ',' : null;
  if (!separator) {
    const value = Number(sanitized);
    return Number.isFinite(value) ? value : null;
  }

  const firstIndex = sanitized.indexOf(separator);
  const lastIndex = sanitized.lastIndexOf(separator);
  const hasMultiple = firstIndex !== lastIndex;

  if (hasMultiple) {
    const left = sanitized.slice(0, lastIndex).split(separator).join('');
    const right = sanitized.slice(lastIndex + 1);
    const normalized = `${left}.${right}`;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  const left = sanitized.slice(0, firstIndex);
  const right = sanitized.slice(firstIndex + 1);

  // Treat exactly 3 trailing digits as thousands grouping (e.g. 1,234).
  if (right.length === 3) {
    const normalized = `${left}${right}`;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  const normalized = `${left}.${right}`;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};
