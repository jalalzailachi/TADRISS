/**
 * Extract a human-readable message from an unknown caught value.
 * Use in `catch (err)` blocks instead of typing the error as `any`.
 */
export function getErrorMessage(
  err: unknown,
  fallback = 'Une erreur inattendue est survenue'
): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback
}
