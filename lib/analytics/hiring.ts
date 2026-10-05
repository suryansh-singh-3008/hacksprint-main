import { PrismaClient } from '@prisma/client';
import { profitSummary } from './profit';

export async function hiringAffordability(
  db: PrismaClient,
  merchantId: number,
  monthlySalaryPaise: number,
) {
  // Average net profit over last 3 months
  const now = Date.now();
  const months = await Promise.all([
    profitSummary(db, merchantId, 'month'),
    profitSummary(db, merchantId, 'month'), // simplified — ideally offset by 1 and 2 months
  ]);

  // For a proper 3-month average, query each month independently
  const m1From = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const m2From = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const m3From = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const queryMonth = async (from: Date, to: Date) => {
    const sales = await db.sale.findMany({
      where: { merchantId, createdAt: { gte: from, lte: to } },
      include: { items: true },
    });
    const revenue = sales.reduce((s, sa) => s + sa.totalPaise, 0);
    const cogs = sales.reduce(
      (s, sa) => s + sa.items.reduce((si, it) => si + it.qty * it.unitCostPaise, 0),
      0,
    );
    const expResult = await db.expense.aggregate({
      where: { merchantId, createdAt: { gte: from, lte: to } },
      _sum: { amountPaise: true },
    });
    const expenses = expResult._sum.amountPaise ?? 0;
    return revenue - cogs - expenses;
  };

  const [net1, net2, net3] = await Promise.all([
    queryMonth(m1From, new Date()),
    queryMonth(m2From, m1From),
    queryMonth(m3From, m2From),
  ]);
  const avgNetProfitPaise = Math.floor((net1 + net2 + net3) / 3);

  // Buffer rule: post-hire profit must remain >= 2x salary
  const postHireProfit = avgNetProfitPaise - monthlySalaryPaise;
  const bufferOk = postHireProfit >= 2 * monthlySalaryPaise;

  // Extra sales needed: salary / blended margin
  // Use a rough 15% margin default (refined by actual data if available)
  const blendedMargin = avgNetProfitPaise > 0 ? avgNetProfitPaise / Math.max(net1, 1) : 0.15;
  const extraSalesNeededPaise =
    blendedMargin > 0 ? Math.floor(monthlySalaryPaise / Math.max(blendedMargin, 0.05)) : 0;

  let verdict: 'yes' | 'no' | 'borderline';
  if (bufferOk && postHireProfit > 0) verdict = 'yes';
  else if (postHireProfit > 0) verdict = 'borderline';
  else verdict = 'no';

  return {
    verdict,
    avgNetProfitPaise,
    monthlySalaryPaise,
    postHireProfit,
    bufferOk,
    extraSalesNeededPaise,
    reasoning: `Average net profit ₹${Math.floor(avgNetProfitPaise / 100)}/month over last 3 months. After salary of ₹${Math.floor(monthlySalaryPaise / 100)}/month, remaining = ₹${Math.floor(postHireProfit / 100)}/month.`,
  };
}
