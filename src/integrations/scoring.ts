export function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n))}
export function normalizeTo100(nums:number[]): number[] {
  if (!nums.length) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max === min) return nums.map(() => 50);
  return nums.map(n => ((n - min) / (max - min)) * 100);
}
export function safeNumber(n:unknown, fallback=0){const x=Number(n);return Number.isFinite(x)?x:fallback}
