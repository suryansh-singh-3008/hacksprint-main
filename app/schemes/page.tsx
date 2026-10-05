import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { schemeMatch, complianceDue } from '@/lib/analytics/schemes';
import { FileText, AlertTriangle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SchemesPage() {
  const { matches } = await schemeMatch(db, 1);
  const { items: compliances } = await complianceDue(db, 1);

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Schemes & Compliance</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3 text-amber-900">
        <AlertTriangle className="shrink-0 mt-0.5 text-amber-600" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Disclaimer</p>
          <p>These eligibility rules are placeholders and provided for guidance only. Always verify with official government sources before applying or taking compliance actions.</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
          <FileText size={20} />
          Compliance Due Soon
        </h2>
        <div className="space-y-3">
          {compliances.map((item) => {
            const daysLeft = Math.ceil((item.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysLeft <= 30;
            return (
              <Card key={item.id} className="p-4 border border-primary-50 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-semibold">{item.type}</h3>
                  <p className="text-sm text-muted-txt">Due: {item.dueDate.toLocaleDateString('en-IN')}</p>
                </div>
                <Badge variant={isUrgent ? "destructive" : "default"} className={isUrgent ? "" : "bg-primary-100 text-primary-800 hover:bg-primary-200"}>
                  {daysLeft} days left
                </Badge>
              </Card>
            );
          })}
          {compliances.length === 0 && <p className="text-muted-txt text-sm">No upcoming compliance items in the next 60 days.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-primary-800 mb-4">Government Schemes</h2>
        <div className="space-y-4">
          {matches.map((m) => (
            <Card key={m.scheme.id} className="p-4 border border-primary-50 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-ink">{m.scheme.name}</h3>
                  <a href={m.scheme.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 flex items-center gap-1 hover:underline mt-1">
                    Official Portal <ExternalLink size={12} />
                  </a>
                </div>
                {m.eligible ? (
                  <Badge className="bg-primary-600 hover:bg-primary-700">Eligible (Estimated)</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent">Not Eligible</Badge>
                )}
              </div>
              
              <div className="text-sm mt-4 space-y-2">
                <p><span className="font-medium text-ink">Reason:</span> <span className="text-muted-txt">{m.reason}</span></p>
                <p><span className="font-medium text-ink">Benefits:</span> <span className="text-muted-txt">{m.benefits}</span></p>
                {m.documents.length > 0 && (
                  <p><span className="font-medium text-ink">Documents needed:</span> <span className="text-muted-txt">{m.documents.join(', ')}</span></p>
                )}
              </div>

              {m.eligible && (
                <div className="mt-4 pt-4 border-t border-primary-50">
                  <button className="w-full md:w-auto text-sm bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors touch-target shadow-sm shadow-primary-500/20">
                    Preview Application Form
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
