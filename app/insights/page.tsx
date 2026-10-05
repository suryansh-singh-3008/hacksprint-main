import { db } from '@/lib/db';
import { formatRupees } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { profitDiagnosis } from '@/lib/analytics/profit';
import { productPerformance } from '@/lib/analytics/products';
import { supplierCostAnalysis } from '@/lib/analytics/suppliers';
import { TrendingDown, TrendingUp, AlertCircle, ShoppingCart, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const [diagnosis, products, suppliers] = await Promise.all([
    profitDiagnosis(db, 1, 'month'),
    productPerformance(db, 1),
    supplierCostAnalysis(db, 1),
  ]);

  const { stopSelling, sellMore } = products;
  const { costliestSupplier } = suppliers;

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Business Insights</h1>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
          <TrendingDown size={20} className={diagnosis.changePct < 0 ? 'text-danger' : 'text-primary-600 hidden'} />
          <TrendingUp size={20} className={diagnosis.changePct >= 0 ? 'text-primary-600' : 'hidden'} />
          Profit Diagnosis (Last 30 Days)
        </h2>
        
        <Card className="p-4 md:p-6 border border-primary-50 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-txt">Revenue</p>
              <p className="font-bold money text-lg text-ink">{formatRupees(diagnosis.currentRevenue)}</p>
              <p className={`text-xs font-semibold ${diagnosis.revenueChangePct >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                {diagnosis.revenueChangePct >= 0 ? '+' : ''}{diagnosis.revenueChangePct}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-txt">Profit</p>
              <p className="font-bold money text-lg text-ink">{formatRupees(diagnosis.currentProfit)}</p>
              <p className={`text-xs font-semibold ${diagnosis.changePct >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                {diagnosis.changePct >= 0 ? '+' : ''}{diagnosis.changePct}%
              </p>
            </div>
          </div>

          <div className="bg-primary-50/30 rounded-xl p-4 border border-primary-50">
            <h3 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Top Cost Drivers
            </h3>
            {diagnosis.drivers.length > 0 ? (
              <div className="space-y-3">
                {diagnosis.drivers.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{d.productName}</span>
                    <div className="text-right">
                      <span className="text-danger font-semibold money">+{formatRupees(d.impactPaise)}</span>
                      <p className="text-[10px] text-muted-txt">cost up {d.costIncreasePct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-txt">No major cost increases detected.</p>
            )}
          </div>
        </Card>
      </section>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <section>
          <h2 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-danger" />
            Stop Selling Candidates
          </h2>
          <Card className="border border-danger/20 overflow-hidden bg-white">
            <div className="p-4 bg-danger/5 border-b border-danger/10">
              <p className="text-xs text-danger font-medium">Low margin (&lt;8%) & Slow moving</p>
            </div>
            <div className="divide-y divide-gray-100">
              {stopSelling.map((p) => (
                <div key={p.id} className="p-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-ink">{p.name}</span>
                  <div className="text-right">
                    <p className="text-danger font-semibold">{p.marginPct}% margin</p>
                    <p className="text-[10px] text-muted-txt">{p.velocityPerWeek} units/week</p>
                  </div>
                </div>
              ))}
              {stopSelling.length === 0 && <p className="p-4 text-sm text-muted-txt text-center">None found.</p>}
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary-600" />
            Push & Sell More
          </h2>
          <Card className="border border-primary-100 overflow-hidden bg-white">
            <div className="p-4 bg-primary-50/50 border-b border-primary-50">
              <p className="text-xs text-primary-700 font-medium">High margin (&gt;20%) & Fast moving</p>
            </div>
            <div className="divide-y divide-gray-100">
              {sellMore.map((p) => (
                <div key={p.id} className="p-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-ink">{p.name}</span>
                  <div className="text-right">
                    <p className="text-primary-600 font-semibold">{p.marginPct}% margin</p>
                    <p className="text-[10px] text-muted-txt">{p.velocityPerWeek} units/week</p>
                  </div>
                </div>
              ))}
              {sellMore.length === 0 && <p className="p-4 text-sm text-muted-txt text-center">None found.</p>}
            </div>
          </Card>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
          <User size={20} />
          Costliest Supplier
        </h2>
        <Card className="p-4 md:p-6 border border-primary-50 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-ink">{costliestSupplier.name}</h3>
              <p className="text-sm text-muted-txt mt-1">
                Last 30 days spend: <span className="font-semibold text-ink money">{formatRupees(costliestSupplier.last30Spend)}</span>
              </p>
            </div>
            <Badge variant="destructive" className="text-sm">
              +{costliestSupplier.changePct}% Cost
            </Badge>
          </div>
          {costliestSupplier.risingProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
              <p className="text-muted-txt text-xs mb-2">Products with rising costs from this supplier:</p>
              <div className="flex flex-wrap gap-2">
                {costliestSupplier.risingProducts.map((rp, i) => (
                  <span key={i} className="bg-gray-100 px-2 py-1 rounded-md text-ink text-xs font-medium">
                    {rp.productName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
