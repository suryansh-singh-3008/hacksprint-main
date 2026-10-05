'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Globe, Info, Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [lang, setLang] = useState('en-IN');

  return (
    <main className="p-4 md:p-8 max-w-2xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Settings</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Mic size={20} className="text-primary-600" />
            Voice Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Wake Word</label>
              <div className="flex items-center justify-between bg-primary-50 px-4 py-3 rounded-lg border border-primary-100">
                <span className="font-semibold text-primary-800">"Veda"</span>
                <Badge className="bg-primary-600">Active</Badge>
              </div>
              <p className="text-xs text-muted-txt mt-2">The assistant constantly listens for this word.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Language & Accent</label>
              <select 
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi</option>
                <option value="kn-IN">Kannada</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Globe size={20} className="text-primary-600" />
            AI Provider Chain
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
              <span className="font-medium text-ink">1. Rule-based Parser (Offline)</span>
              <Badge className="bg-primary-600 hover:bg-primary-700 text-white">Active</Badge>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
              <span className="font-medium text-ink">2. Google Gemini (Flash)</span>
              <Badge variant="outline" className="text-primary-600 border-primary-200">Configured</Badge>
            </div>
            <div className="flex justify-between items-center text-sm pb-2">
              <span className="font-medium text-muted-txt">3. Groq (Llama 3)</span>
              <Badge variant="secondary" className="text-muted-txt">Missing Key</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-txt mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 flex gap-2 items-start">
            <Info size={14} className="shrink-0 mt-0.5" />
            Veda automatically falls back through these providers if internet is lost or API limits are reached.
          </p>
        </Card>
        
        <div className="flex justify-end">
          <button className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </main>
  );
}
