export default function boundPct(pct: number) {
  if (pct > 99) return 99;
  else if (pct < 1) return 1;
  return Math.floor(pct * 10) / 10;
}
