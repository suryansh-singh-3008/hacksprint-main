import { PrismaClient } from '@prisma/client';

export type ProductMetric = {
  id: number;
  name: string;
  category: string;
  sellingPricePaise: number;
  avgCostPaise: number;
  marginPct: number;
  velocityPerWeek: number;   // units sold / week (30-day average)
  stockValue: number;        // remainingQty * avgCost
  daysOfStock: number;
  flag: 'STOP_SELLING' | 'SELL_MORE' | 'NORMAL';
};

export async function productPerformance(db: PrismaClient, merchantId: number) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const products = await db.product.findMany({
    where: { merchantId, isActive: true },
    include: {
      saleItems: {
        where: { sale: { createdAt: { gte: thirtyDaysAgo } } },
        include: { sale: true },
      },
      stockBatches: { where: { remainingQty: { gt: 0 } } },
    },
  });

  const metrics: ProductMetric[] = products.map((p) => {
    const totalQtySold = p.saleItems.reduce((s, si) => s + si.qty, 0);
    const totalRevenue = p.saleItems.reduce((s, si) => s + si.qty * si.sellingPricePaise, 0);
    const totalCogs = p.saleItems.reduce((s, si) => s + si.qty * si.unitCostPaise, 0);
    const avgCostPaise =
      totalQtySold > 0 ? Math.floor(totalCogs / totalQtySold) : Math.floor(p.sellingPricePaise * 0.8);

    const velocityPerWeek = Math.round((totalQtySold / 30) * 7 * 10) / 10;
    const marginPct =
      p.sellingPricePaise > 0
        ? Math.round(((p.sellingPricePaise - avgCostPaise) / p.sellingPricePaise) * 1000) / 10
        : 0;

    const remainingQty = p.stockBatches.reduce((s, b) => s + b.remainingQty, 0);
    const stockValue = remainingQty * avgCostPaise;
    const daysOfStock = velocityPerWeek > 0 ? Math.round((remainingQty / (velocityPerWeek / 7))) : 999;

    // Classify: STOP_SELLING if margin < 8% AND velocity < 3/week
    // SELL_MORE if margin > 20% AND velocity > 5/week
    let flag: ProductMetric['flag'] = 'NORMAL';
    if (marginPct < 8 && velocityPerWeek < 3) flag = 'STOP_SELLING';
    else if (marginPct > 20 && velocityPerWeek >= 5) flag = 'SELL_MORE';

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      sellingPricePaise: p.sellingPricePaise,
      avgCostPaise,
      marginPct,
      velocityPerWeek,
      stockValue,
      daysOfStock,
      flag,
    };
  });

  metrics.sort((a, b) => b.velocityPerWeek - a.velocityPerWeek);

  return {
    products: metrics,
    stopSelling: metrics.filter((m) => m.flag === 'STOP_SELLING'),
    sellMore: metrics.filter((m) => m.flag === 'SELL_MORE'),
  };
}
