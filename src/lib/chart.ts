/** Rounds the axis up to 4 even steps of 1/2/2.5/5 × 10^n (e.g. $0–$200k by $50k). */
export function niceTicks(max: number) {
  if (max <= 0) return [0, 25, 50, 75, 100];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? rough;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}
