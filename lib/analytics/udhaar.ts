import { PrismaClient } from '@prisma/client';

export async function udhaarSummary(db: PrismaClient, merchantId: number) {
  const customers = await db.customer.findMany({
    where: { merchantId },
    include: { credits: { where: { isUndo: false }, orderBy: { createdAt: 'asc' } } },
  });

  const now = Date.now();

  const entries = customers
    .map((c) => {
      let balancePaise = 0;
      let oldestUnpaidDate: Date | null = null;

      for (const cr of c.credits) {
        if (cr.type === 'GIVEN') {
          balancePaise += cr.amountPaise;
          if (!oldestUnpaidDate) oldestUnpaidDate = cr.createdAt;
        } else if (cr.type === 'RECEIVED') {
          balancePaise -= cr.amountPaise;
        }
      }
      balancePaise = Math.max(0, balancePaise);

      // Ageing bucket based on oldest unpaid entry
      let agingBucket: '<7d' | '7-30d' | '30-60d' | '60d+' = '<7d';
      if (oldestUnpaidDate) {
        const daysDiff = Math.floor((now - oldestUnpaidDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 60) agingBucket = '60d+';
        else if (daysDiff >= 30) agingBucket = '30-60d';
        else if (daysDiff >= 7) agingBucket = '7-30d';
      }

      const reminderDraft =
        balancePaise > 0
          ? `Namaste ${c.name} ji, Ramesh Kirana Store se baat kar rahe hain. Aapka ₹${Math.floor(balancePaise / 100)} baaki hai. Kripya jald se jald chukta karein. Dhanyawad! 🙏`
          : null;

      return {
        id: c.id,
        name: c.name,
        balancePaise,
        agingBucket,
        lastEntry: c.credits[c.credits.length - 1]?.createdAt ?? null,
        reminderDraft,
      };
    })
    .filter((e) => e.balancePaise > 0);

  entries.sort((a, b) => b.balancePaise - a.balancePaise);

  const totalOutstandingPaise = entries.reduce((s, e) => s + e.balancePaise, 0);

  return { customers: entries, totalOutstandingPaise };
}
