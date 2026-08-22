export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeOptionalString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}
