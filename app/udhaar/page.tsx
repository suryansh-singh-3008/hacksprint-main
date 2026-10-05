import { db } from '@/lib/db';
import { formatRupees } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { udhaarSummary } from '@/lib/analytics/udhaar';

export const dynamic = 'force-dynamic';

export default async function UdhaarPage() {
  const { customers, totalOutstandingPaise } = await udhaarSummary(db, 1); // merchantId 1

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-900">Udhaar Ledger</h1>
        <div className="text-right">
          <p className="text-sm text-muted-txt">Total Outstanding</p>
          <p className="text-xl font-bold text-accent money">{formatRupees(totalOutstandingPaise)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {customers.map((c) => (
          <Card key={c.id} className="p-4 border border-primary-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{c.name}</h3>
                <p className="text-sm text-muted-txt">
                  Last entry: {c.lastEntry ? c.lastEntry.toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold money text-ink">{formatRupees(c.balancePaise)}</p>
                {c.agingBucket === '60d+' ? (
                  <Badge variant="destructive" className="mt-1">60+ days old</Badge>
                ) : c.agingBucket === '30-60d' ? (
                  <Badge className="bg-amber-500 hover:bg-amber-600 mt-1">30-60 days</Badge>
                ) : (
                  <Badge className="bg-primary-100 text-primary-800 mt-1 hover:bg-primary-200">Recent</Badge>
                )}
              </div>
            </div>

            {c.reminderDraft && (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-muted-txt mb-1">WhatsApp Reminder Draft</p>
                <p className="text-sm italic text-gray-700">"{c.reminderDraft}"</p>
                <div className="mt-2 flex gap-2">
                  <button className="text-xs bg-primary-100 text-primary-800 px-3 py-1.5 rounded font-medium hover:bg-primary-200 transition-colors touch-target">
                    Send WhatsApp
                  </button>
                  <button className="text-xs border border-primary-200 text-primary-800 px-3 py-1.5 rounded font-medium hover:bg-primary-50 transition-colors touch-target">
                    Record Payment
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {customers.length === 0 && (
          <p className="text-muted-txt text-center py-8">No outstanding udhaar.</p>
        )}
      </div>
    </main>
  );
}
