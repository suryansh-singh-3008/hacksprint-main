import { PrismaClient } from '@prisma/client';

export async function supplierCostAnalysis(db: PrismaClient, merchantId: number) {
  const now = Date.now();
  const last30From = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const prev30From = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const suppliers = await db.supplier.findMany({ where: { merchantId } });

  const results = await Promise.all(
    suppliers.map(async (sup) => {
      // Last 30 days spend = sum of (qty * unitCostPaise) from StockBatches received
      const last30Batches = await db.stockBatch.findMany({
        where: { supplierId: sup.id, receivedAt: { gte: last30From } },
        include: { product: true },
      });
      const prev30Batches = await db.stockBatch.findMany({
        where: { supplierId: sup.id, receivedAt: { gte: prev30From, lt: last30From } },
        include: { product: true },
      });

      const last30Spend = last30Batches.reduce((s, b) => s + b.qty * b.unitCostPaise, 0);
      const prev30Spend = prev30Batches.reduce((s, b) => s + b.qty * b.unitCostPaise, 0);
      const changePct =
        prev30Spend > 0 ? Math.round(((last30Spend - prev30Spend) / prev30Spend) * 100) : 0;

      // Products with rising unit costs (compare batch avg cost per product)
      type ProductCostEntry = { last30Avg: number; prev30Avg: number; productName: string };
      const productCosts = new Map<number, ProductCostEntry>();
      for (const b of last30Batches) {
        const e = productCosts.get(b.productId) ?? { last30Avg: 0, prev30Avg: 0, productName: b.product.name };
        e.last30Avg = b.unitCostPaise; // last batch is most recent
        productCosts.set(b.productId, e);
      }
      for (const b of prev30Batches) {
        const e = productCosts.get(b.productId);
        if (e) { e.prev30Avg = b.unitCostPaise; productCosts.set(b.productId, e); }
      }
      const risingProducts = [...productCosts.values()].filter(
        (e) => e.prev30Avg > 0 && e.last30Avg > e.prev30Avg,
      );

      return { supplierId: sup.id, name: sup.name, last30Spend, prev30Spend, changePct, risingProducts };
    }),
  );

  results.sort((a, b) => b.last30Spend - a.last30Spend);
  const costliestSupplier = results.reduce((best, cur) => (cur.changePct > best.changePct ? cur : best), results[0] ?? { supplierId: 0, name: 'N/A', last30Spend: 0, prev30Spend: 0, changePct: 0, risingProducts: [] });

  return { suppliers: results, costliestSupplier };
}
