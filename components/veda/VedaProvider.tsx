'use client';
import { useVeda, VedaState } from '@/hooks/useVeda';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VedaProvider({ children }: { children: React.ReactNode }) {
  const veda = useVeda();
  const [started, setStarted] = useState(false);

  // First tap required for browser audio policies
  if (!started) {
    return (
      <div className="fixed inset-0 bg-primary-900 z-50 flex flex-col items-center justify-center text-white" onClick={() => setStarted(true)}>
        <div className="w-24 h-24 rounded-full bg-primary-500 veda-breathe mb-8"></div>
        <h1 className="text-3xl font-bold mb-4">Tap once to start Veda</h1>
        <p className="text-primary-100 opacity-80">After this, just say "Veda" to wake me up anytime.</p>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Floating Status Chip */}
      <div className="fixed top-4 right-4 z-40 bg-surface shadow-md rounded-full px-4 py-2 flex items-center gap-2 border border-primary-100 text-sm font-medium">
        {veda.isMuted ? <MicOff size={16} className="text-muted-txt"/> : <Mic size={16} className="text-primary-600" />}
        <span>
          {veda.state === 'IDLE_LISTENING' ? 'Listening' :
           veda.state === 'CAPTURING' ? 'Listening...' :
           veda.state === 'THINKING' ? 'Thinking...' :
           veda.state === 'SPEAKING' ? 'Speaking...' :
           veda.state === 'ERROR' ? 'Mic Error' : 'Offline'}
        </span>
      </div>

      {/* Veda Orb */}
      <button 
        onClick={veda.toggleMute}
        className={`fixed z-40 bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:-translate-x-0 rounded-full flex items-center justify-center transition-colors shadow-lg
          ${veda.state === 'IDLE_LISTENING' ? 'w-16 h-16 bg-primary-600 veda-breathe' : ''}
          ${veda.state === 'CAPTURING' || veda.state === 'WAKE_DETECTED' ? 'w-16 h-16 bg-primary-500 veda-pulse-ring' : ''}
          ${veda.state === 'THINKING' ? 'w-16 h-16 bg-primary-600 veda-spin border-4 border-t-primary-100' : ''}
          ${veda.state === 'SPEAKING' ? 'w-16 h-16 bg-primary-500' : ''}
          ${veda.state === 'ERROR' || veda.state === 'UNSUPPORTED' || veda.isMuted ? 'w-16 h-16 bg-muted-txt' : ''}
        `}
      >
        {veda.state === 'SPEAKING' && <div className="flex gap-1 items-center justify-center h-full"><div className="w-1 bg-white veda-bar"></div><div className="w-1 bg-white veda-bar" style={{animationDelay: '0.2s'}}></div><div className="w-1 bg-white veda-bar" style={{animationDelay: '0.4s'}}></div></div>}
      </button>

      {/* Conversation Panel (Slide up on desktop/mobile) */}
      {veda.conversationHistory.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:right-8 w-[90%] md:w-96 max-h-[60vh] overflow-y-auto bg-surface shadow-xl rounded-2xl border border-primary-100 z-30 p-4 slide-up">
          <div className="flex flex-col gap-4">
            {veda.conversationHistory.slice(-3).map((msg, i) => (
              <div key={i} className="flex flex-col gap-2 text-sm">
                <div className="self-end bg-primary-100 text-primary-900 px-3 py-2 rounded-2xl rounded-tr-none">
                  {msg.user}
                </div>
                <div className="self-start bg-gray-100 text-ink px-3 py-2 rounded-2xl rounded-tl-none relative">
                  {msg.reply}
                  <div className="text-[10px] text-muted-txt mt-1 opacity-60 flex justify-between">
                    <span>{msg.intent}</span>
                    <span>⚡ {msg.provider}</span>
                  </div>
                </div>
                {/* Render Answer Card if available */}
                {msg.action && <AnswerCard action={msg.action} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AnswerCard({ action }: { action: any }) {
  if (action.type === 'SALES_CARD') {
    return (
      <Card className="p-3 bg-white border-primary-100 mt-2">
        <p className="text-xs text-muted-txt">Sales</p>
        <p className="text-xl font-bold money text-ink">₹{action.payload.revenue / 100}</p>
        <p className="text-xs text-primary-600 mt-1">{action.payload.orderCount} orders</p>
      </Card>
    );
  }
  if (action.type === 'CONFIRM_WRITE') {
    return (
      <Card className="p-3 bg-primary-50 border-primary-200 mt-2 flex items-center justify-between">
        <span className="font-medium">Action saved.</span>
        <button className="text-xs text-danger font-semibold px-2 py-1 bg-white rounded border border-danger/20">Undo</button>
      </Card>
    );
  }
  return null;
}
