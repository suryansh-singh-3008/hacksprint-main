import { PrismaClient } from '@prisma/client';

export async function expiryRisk(db: PrismaClient, merchantId: number) {
  const batches = await db.stockBatch.findMany({
    where: { remainingQty: { gt: 0 }, expiryDate: { not: null }, product: { merchantId } },
    include: { product: true, supplier: true }
  });

  const now = Date.now();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const enrichedBatches = await Promise.all(batches.map(async (batch) => {
    // 14-day sales velocity for this specific product
    const recentSales = await db.saleItem.aggregate({
      where: { 
        productId: batch.productId,
        sale: { createdAt: { gte: fourteenDaysAgo } }
      },
      _sum: { qty: true }
    });
    
    const qtySold = recentSales._sum.qty || 0;
    const avgDailySales = qtySold / 14;
    
    const daysToExpiry = Math.max(0, Math.ceil((batch.expiryDate!.getTime() - now) / (1000 * 60 * 60 * 24)));
    
    const predictedUnsold = Math.max(0, Math.floor(batch.remainingQty - (avgDailySales * daysToExpiry)));
    const valueAtRiskPaise = predictedUnsold * batch.unitCostPaise;
    
    return {
      ...batch,
      daysToExpiry,
      avgDailySales,
      predictedUnsold,
      valueAtRiskPaise
    };
  }));

  enrichedBatches.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  return enrichedBatches;
}

export function discountSuggestion(batch: { unitCostPaise: number; sellingPricePaise: number; daysToExpiry: number; predictedUnsold: number }) {
  let discountPct = 0;
  if (batch.daysToExpiry > 7) discountPct = 10;
  else if (batch.daysToExpiry >= 4) discountPct = 20;
  else discountPct = 30;
  
  let suggestedPricePaise = Math.floor(batch.sellingPricePaise * (1 - discountPct / 100));
  
  // Never go below cost
  if (suggestedPricePaise < batch.unitCostPaise) {
    suggestedPricePaise = batch.unitCostPaise;
    discountPct = Math.floor(((batch.sellingPricePaise - suggestedPricePaise) / batch.sellingPricePaise) * 100);
  }
  
  const expectedRecoveryPaise = suggestedPricePaise * batch.predictedUnsold;
  return { discountPct, suggestedPricePaise, expectedRecoveryPaise };
}
