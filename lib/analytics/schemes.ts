import { PrismaClient } from '@prisma/client';

export async function schemeMatch(db: PrismaClient, merchantId: number) {
  const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) throw new Error("Merchant not found");
  
  const schemes = await db.scheme.findMany();
  
  const matches = schemes.map(scheme => {
    let eligible = false;
    let reason = "Eligibility undetermined.";
    
    try {
      const rules = JSON.parse(scheme.rulesJson);
      if (scheme.code === 'PM_SVANIDHI') {
        eligible = merchant.annualTurnoverPaise < 50000000; // < 5L
        reason = eligible ? "Turnover is under ₹5L." : "Turnover exceeds PM SVANidhi limit.";
      } else if (scheme.code === 'MUDRA_SHISHU') {
        eligible = merchant.annualTurnoverPaise < 100000000; // < 10L
        reason = eligible ? "Eligible for Shishu loan based on turnover." : "Turnover exceeds Shishu limit.";
      } else if (scheme.code === 'UDYAM') {
        eligible = merchant.annualTurnoverPaise < 2500000000; // < 2.5Cr (simplified)
        reason = eligible ? "Eligible for MSME Udyam registration." : "Exceeds micro-enterprise turnover limits.";
      } else if (scheme.code === 'GST_THRESHOLD') {
        eligible = merchant.annualTurnoverPaise >= 400000000; // >= 40L
        reason = eligible ? "Mandatory GST registration required (turnover >= ₹40L)." : "Below GST mandatory threshold (₹40L).";
      }
      
      return {
        scheme,
        eligible,
        reason,
        documents: rules.documents || [],
        benefits: rules.benefits || '',
        isPlaceholder: rules._placeholder || true,
      };
    } catch (e) {
      return { scheme, eligible: false, reason: "Error parsing scheme rules", documents: [], benefits: '', isPlaceholder: true };
    }
  });

  return { matches };
}

export async function complianceDue(db: PrismaClient, merchantId: number) {
  const sixtyDaysOut = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const items = await db.complianceItem.findMany({
    where: { 
      merchantId, 
      dueDate: { lte: sixtyDaysOut }, 
      status: { not: 'DONE' } 
    },
    orderBy: { dueDate: 'asc' }
  });
  
  return { items };
}
