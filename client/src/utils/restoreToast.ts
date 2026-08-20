export function formatRestoreToastMessage(count: number): string {
  const safeCount = Math.max(0, Math.floor(count));
  return `${safeCount} evidence item${safeCount === 1 ? "" : "s"} restored successfully`;
}
