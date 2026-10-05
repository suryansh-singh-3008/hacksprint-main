export type Period = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
export function periodToRange(period: Period): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (period === 'today') from.setHours(0, 0, 0, 0);
  else if (period === 'yesterday') {
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() - 1);
    to.setHours(23, 59, 59, 999);
  }
  else if (period === 'week') from.setDate(from.getDate() - 7);
  else if (period === 'month') from.setMonth(from.getMonth() - 1);
  return { from, to };
}
