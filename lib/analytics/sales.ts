import { PrismaClient } from '@prisma/client';
import { Period, periodToRange } from './period';

export async function salesSummary(db: PrismaClient, merchantId: number, period: Period) {
  const { from, to } = periodToRange(period);
  const curr = await db.sale.aggregate({ where: { merchantId, createdAt: { gte: from, lte: to } }, _sum: { totalPaise: true }, _count: true });
  const diff = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - diff);
  const prevTo = new Date(from.getTime());
  const prev = await db.sale.aggregate({ where: { merchantId, createdAt: { gte: prevFrom, lte: prevTo } }, _sum: { totalPaise: true }, _count: true });
  const revenue = curr._sum.totalPaise ?? 0;
  const prevRevenue = prev._sum.totalPaise ?? 0;
  const orderCount = curr._count;
  const avgBillPaise = orderCount > 0 ? Math.floor(revenue / orderCount) : 0;
  const changePct = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
  return { revenue, orderCount, avgBillPaise, prevRevenue, changePct };
}
