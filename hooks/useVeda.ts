import { useState, useEffect, useRef, useCallback } from 'react';
import { detectWakeWord } from '@/lib/wake-words';

export type VedaState = 'IDLE_LISTENING' | 'WAKE_DETECTED' | 'CAPTURING' | 'THINKING' | 'SPEAKING' | 'PAUSED' | 'UNSUPPORTED' | 'ERROR';

export function useVeda() {
  const [state, setState] = useState<VedaState>('UNSUPPORTED');
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [lastAction, setLastAction] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationHistory, setHistory] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);
  const wakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = useCallback(() => {
    if (isMuted || state === 'SPEAKING' || state === 'THINKING') return;
    try {
      if (recognitionRef.current) recognitionRef.current.start();
    } catch (e) {
      // already started
    }
  }, [isMuted, state]);

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setState('UNSUPPORTED');
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    // We could pull lang from settings here
    recognition.lang = 'en-IN'; 
    recognitionRef.current = recognition;

    let localTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) localTranscript += t + ' ';
        else interimTranscript += t;
      }
      
      const fullText = (localTranscript + interimTranscript).trim();
      setTranscript(fullText);

      // Check barge-in
      if (state === 'SPEAKING') {
        if (/stop|ruko|chup/i.test(interimTranscript)) {
          window.speechSynthesis.cancel();
          setState('IDLE_LISTENING');
          localTranscript = '';
          return;
        }
      }

      // Check wake word if IDLE
      if (state === 'IDLE_LISTENING') {
        const { found, commandAfter } = detectWakeWord(fullText);
        if (found) {
          // Play a soft chime
          playChime();
          if (commandAfter.length > 5) {
            // Inline command "Veda, what's the sales"
            if (event.results[event.results.length - 1].isFinal) {
              processCommand(commandAfter);
              localTranscript = '';
            }
          } else {
            // Wake only
            setState('WAKE_DETECTED');
            setTimeout(() => setState('CAPTURING'), 500);
            localTranscript = '';
            
            // Timeout if no command follows
            if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
            wakeTimeoutRef.current = setTimeout(() => {
              setState('IDLE_LISTENING');
            }, 8000);
          }
        }
      } else if (state === 'CAPTURING') {
        if (event.results[event.results.length - 1].isFinal) {
          if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
          processCommand(fullText);
          localTranscript = '';
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') setState('ERROR');
      // On other errors (no-speech, network), it will naturally restart via onend
    };

    recognition.onend = () => {
      // Auto-restart if we're not explicitly stopped
      if (state !== 'UNSUPPORTED' && state !== 'ERROR' && state !== 'SPEAKING' && !isMuted) {
        setTimeout(() => startListening(), 1000);
      }
    };

    // First visit gate logic would check localStorage here, simplified for demo
    setState('IDLE_LISTENING');
    startListening();

    return () => {
      if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
      recognition.stop();
    };
  }, [state, isMuted, startListening]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;
    setState('THINKING');
    setLastCommand(text);
    if (recognitionRef.current) recognitionRef.current.stop();

    try {
      const res = await fetch('/api/veda/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: 'en' })
      });
      const data = await res.json();
      
      setHistory(h => [...h, { user: text, intent: data.intent, reply: data.replyText, action: data.uiAction, provider: data.provider }]);
      setLastAction(data.uiAction);
      
      if (data.replyText) {
        setState('SPEAKING');
        setLastReply(data.replyText);
        const utterance = new SpeechSynthesisUtterance(data.replyText);
        utterance.lang = 'en-IN';
        utterance.onend = () => {
          setState('IDLE_LISTENING');
          startListening();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setState('IDLE_LISTENING');
        startListening();
      }
    } catch (e) {
      setState('IDLE_LISTENING');
      startListening();
    }
  };

  const submitText = (text: string) => {
    processCommand(text);
  };

  return {
    state,
    transcript,
    lastCommand,
    lastReply,
    lastAction,
    isMuted,
    toggleMute: () => setIsMuted(m => !m),
    submitText,
    isSupported: state !== 'UNSUPPORTED',
    conversationHistory
  };
}

function playChime() {
  try {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}
