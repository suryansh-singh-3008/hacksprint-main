import { db } from '@/lib/db';
import { formatRupees } from '@/lib/money';
import { salesSummary } from '@/lib/analytics/sales';
import { profitSummary } from '@/lib/analytics/profit';
import { expiryRisk } from '@/lib/analytics/expiry';
import { udhaarSummary } from '@/lib/analytics/udhaar';
import { Card } from '@/components/ui/card';
import { IndianRupee, TrendingUp, AlertTriangle, BookOpen, Mic } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const merchantId = 1;
  const [sales, profit, expiryBatches, udhaar] = await Promise.all([
    salesSummary(db, merchantId, 'today'),
    profitSummary(db, merchantId, 'today'),
    expiryRisk(db, merchantId),
    udhaarSummary(db, merchantId),
  ]);

  const urgentExpiryCount = expiryBatches.filter(b => b.daysToExpiry <= 7).length;

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900 flex items-center gap-2">
          Veda
        </h1>
        <p className="text-muted-txt">Ramesh Kirana Store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-5 border-l-4 border-l-primary-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-50 rounded-full">
              <IndianRupee size={20} className="text-primary-600" />
            </div>
            <p className="text-sm font-medium text-muted-txt uppercase tracking-wide">Today's Sales</p>
          </div>
          <p className="text-3xl font-bold text-ink money pl-12">{formatRupees(sales.revenue)}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-primary-600 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-50 rounded-full">
              <TrendingUp size={20} className="text-primary-600" />
            </div>
            <p className="text-sm font-medium text-muted-txt uppercase tracking-wide">Today's Profit</p>
          </div>
          <p className="text-3xl font-bold text-ink money pl-12">{formatRupees(profit.netProfit)}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-full">
              <BookOpen size={20} className="text-amber-600" />
            </div>
            <p className="text-sm font-medium text-muted-txt uppercase tracking-wide">Udhaar (Outstanding)</p>
          </div>
          <p className="text-3xl font-bold text-ink money pl-12">{formatRupees(udhaar.totalOutstandingPaise)}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-danger hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-full">
              <AlertTriangle size={20} className="text-danger" />
            </div>
            <p className="text-sm font-medium text-muted-txt uppercase tracking-wide">Expiry Alerts (7 days)</p>
          </div>
          <p className="text-3xl font-bold text-danger pl-12">{urgentExpiryCount} Items</p>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -top-12 opacity-10">
          <Mic size={140} />
        </div>
        <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2 relative z-10">
          <Mic size={20} className="text-primary-600" />
          Try asking Veda...
        </h2>
        <div className="space-y-3 relative z-10">
          <div className="bg-white/80 p-3 rounded-lg text-sm text-ink font-medium shadow-sm border border-white/50 backdrop-blur-sm">
            "Veda, what are today's sales?"
          </div>
          <div className="bg-white/80 p-3 rounded-lg text-sm text-ink font-medium shadow-sm border border-white/50 backdrop-blur-sm">
            "Veda, Ramesh ne 500 ka udhaar liya."
          </div>
          <div className="bg-white/80 p-3 rounded-lg text-sm text-ink font-medium shadow-sm border border-white/50 backdrop-blur-sm">
            "Veda, which products should I stop selling?"
          </div>
        </div>
      </div>
    </main>
  );
}
