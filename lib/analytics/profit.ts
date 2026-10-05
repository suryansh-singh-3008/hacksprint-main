import { PrismaClient } from '@prisma/client';
import { Period, periodToRange } from './period';

export async function profitSummary(db: PrismaClient, merchantId: number, period: Period) {
  const { from, to } = periodToRange(period);

  // Revenue
  const sales = await db.sale.findMany({
    where: { merchantId, createdAt: { gte: from, lte: to } },
    include: { items: true },
  });
  const revenue = sales.reduce((s, sale) => s + sale.totalPaise, 0);

  // COGS — use actual unitCostPaise captured at time of sale
  const cogs = sales.reduce(
    (s, sale) =>
      s + sale.items.reduce((si, item) => si + item.qty * item.unitCostPaise, 0),
    0,
  );

  // Expenses
  const expResult = await db.expense.aggregate({
    where: { merchantId, createdAt: { gte: from, lte: to } },
    _sum: { amountPaise: true },
  });
  const expenses = expResult._sum.amountPaise ?? 0;

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const marginPct = revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

  return { revenue, cogs, grossProfit, expenses, netProfit, marginPct };
}

export async function profitDiagnosis(db: PrismaClient, merchantId: number, period: Period) {
  const { from, to } = periodToRange(period);
  const diff = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - diff);
  const prevTo = new Date(from);

  const curr = await profitSummary(db, merchantId, period);

  // Previous period profit
  const prevSales = await db.sale.findMany({
    where: { merchantId, createdAt: { gte: prevFrom, lte: prevTo } },
    include: { items: { include: { product: true } } },
  });
  const prevRevenue = prevSales.reduce((s, sa) => s + sa.totalPaise, 0);
  const prevCogs = prevSales.reduce(
    (s, sa) => s + sa.items.reduce((si, it) => si + it.qty * it.unitCostPaise, 0),
    0,
  );
  const prevExpResult = await db.expense.aggregate({
    where: { merchantId, createdAt: { gte: prevFrom, lte: prevTo } },
    _sum: { amountPaise: true },
  });
  const prevExpenses = prevExpResult._sum.amountPaise ?? 0;
  const prevProfit = prevRevenue - prevCogs - prevExpenses;

  const changePct =
    prevProfit !== 0 ? Math.round(((curr.netProfit - prevProfit) / Math.abs(prevProfit)) * 100) : 0;

  // Per-product cost comparison
  type ProductCostMap = Map<number, { productName: string; totalCost: number; totalQty: number }>;
  const buildMap = (sales: typeof prevSales): ProductCostMap => {
    const m: ProductCostMap = new Map();
    for (const sa of sales) {
      for (const it of sa.items) {
        const existing = m.get(it.productId);
        if (existing) {
          existing.totalCost += it.unitCostPaise * it.qty;
          existing.totalQty += it.qty;
        } else {
          m.set(it.productId, {
            productName: it.product.name,
            totalCost: it.unitCostPaise * it.qty,
            totalQty: it.qty,
          });
        }
      }
    }
    return m;
  };

  const currSales = await db.sale.findMany({
    where: { merchantId, createdAt: { gte: from, lte: to } },
    include: { items: { include: { product: true } } },
  });
  const currMap = buildMap(currSales);
  const prevMap = buildMap(prevSales);

  type Driver = {
    productName: string;
    type: 'COST_INCREASE' | 'VOLUME_DROP' | 'PRICE_CHANGE';
    impactPaise: number;
    costIncreasePct: number;
  };

  const drivers: Driver[] = [];
  for (const [pid, currData] of currMap) {
    const prevData = prevMap.get(pid);
    if (!prevData || prevData.totalQty === 0 || currData.totalQty === 0) continue;
    const currAvgCost = Math.floor(currData.totalCost / currData.totalQty);
    const prevAvgCost = Math.floor(prevData.totalCost / prevData.totalQty);
    if (currAvgCost > prevAvgCost) {
      const costIncreasePct = Math.round(((currAvgCost - prevAvgCost) / prevAvgCost) * 100);
      const impactPaise = (currAvgCost - prevAvgCost) * currData.totalQty;
      drivers.push({ productName: currData.productName, type: 'COST_INCREASE', impactPaise, costIncreasePct });
    }
  }
  drivers.sort((a, b) => b.impactPaise - a.impactPaise);

  return {
    currentProfit: curr.netProfit,
    prevProfit,
    currentRevenue: curr.revenue,
    prevRevenue,
    changePct,
    revenueChangePct: prevRevenue > 0 ? Math.round(((curr.revenue - prevRevenue) / prevRevenue) * 100) : 0,
    drivers: drivers.slice(0, 3),
  };
}
