/**
 * Formats a point delta with an explicit sign, so a correction reads as a
 * deduction rather than a smaller award. Kept free of server imports so both
 * server and client components can use it.
 */
export function formatPoints(points: number) {
  return `${points > 0 ? "+" : "−"}${Math.abs(points).toLocaleString()}`
}
