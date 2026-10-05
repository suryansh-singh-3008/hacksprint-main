import { db } from '@/lib/db';
import { formatRupees } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { expiryRisk } from '@/lib/analytics/expiry';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const batches = await expiryRisk(db, 1); // merchantId 1

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Inventory & Expiry</h1>

      <div className="space-y-4">
        {batches.map((batch) => {
          const isUrgent = batch.daysToExpiry <= 3;
          const isSoon = batch.daysToExpiry > 3 && batch.daysToExpiry <= 7;
          
          return (
            <Card key={batch.id} className="p-4 border border-primary-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{batch.product.name}</h3>
                  <p className="text-sm text-muted-txt">Supplier: {batch.supplier?.name || 'Unknown'}</p>
                </div>
                {isUrgent ? (
                  <Badge variant="destructive">Urgent ({batch.daysToExpiry}d)</Badge>
                ) : isSoon ? (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">Soon ({batch.daysToExpiry}d)</Badge>
                ) : (
                  <Badge className="bg-primary-100 text-primary-800 border-transparent hover:bg-primary-200">Safe ({batch.daysToExpiry}d)</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-primary-50/50 p-3 rounded-lg text-sm">
                <div>
                  <p className="text-muted-txt text-xs">Remaining</p>
                  <p className="font-semibold">{batch.remainingQty} units</p>
                </div>
                <div>
                  <p className="text-muted-txt text-xs">Predicted Unsold</p>
                  <p className="font-semibold text-danger">{batch.predictedUnsold} units</p>
                </div>
                <div>
                  <p className="text-muted-txt text-xs">Value at Risk</p>
                  <p className="font-semibold money">{formatRupees(batch.valueAtRiskPaise)}</p>
                </div>
                <div>
                  <p className="text-muted-txt text-xs">Action</p>
                  {batch.predictedUnsold > 0 ? (
                    <button className="text-primary-600 font-medium hover:underline touch-target">
                      Suggest Discount
                    </button>
                  ) : (
                    <span className="text-primary-600">Will sell out</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {batches.length === 0 && (
          <p className="text-muted-txt text-center py-8">No stock batches found.</p>
        )}
      </div>
    </main>
  );
}
