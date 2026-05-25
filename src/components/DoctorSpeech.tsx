import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { audio } from '../utils/audio';

interface DoctorSpeechProps {
  text: string;
  isTalking?: boolean;
  expression?: 'neutral' | 'happy' | 'thinking' | 'sad' | 'surprised';
  onComplete?: () => void;
  actions?: React.ReactNode;
}

export default function DoctorSpeech({
  text,
  isTalking = false,
  expression = 'neutral',
  onComplete,
  actions,
}: DoctorSpeechProps) {
  const [typedText, setTypedText] = useState('');
  const [index, setIndex] = useState(0);
  const [talkingState, setTalkingState] = useState(isTalking);
  const [isMuted, setIsMuted] = useState(audio.getMute());

  // Handle typing effect
  useEffect(() => {
    setTypedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      setTalkingState(true);
      const timer = setTimeout(() => {
        setTypedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);

        // Play soft subtle beep for speech (classic typewriter)
        if (index % 2 === 0 && !isMuted) {
          audio.playBeep(450, 0.03, 'triangle');
        }
      }, 35); // Typing speed
      return () => clearTimeout(timer);
    } else {
      setTalkingState(false);
      if (onComplete) onComplete();
    }
  }, [index, text, isMuted]);

  // Sync isTalking prop with internal talking state
  useEffect(() => {
    if (index >= text.length) {
      setTalkingState(isTalking);
    }
  }, [isTalking, index, text.length]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    audio.setMute(nextMuted);
    setIsMuted(nextMuted);
  };

  // Determine eyes and mouth shapes based on expression and talking
  const getEyePath = () => {
    switch (expression) {
      case 'happy':
        // Happy arch eyes ^^
        return (
          <>
            <path d="M 18,36 Q 24,30 30,36" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 50,36 Q 56,30 62,36" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'sad':
        // Sad droop eyes
        return (
          <>
            <path d="M 18,34 Q 24,40 30,36" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 50,34 Q 56,40 62,36" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'surprised':
        // Wide circle eyes
        return (
          <>
            <circle cx="24" cy="35" r="4" fill="currentColor" />
            <circle cx="56" cy="35" r="4" fill="currentColor" />
          </>
        );
      case 'thinking':
        // One focused, one narrowed
        return (
          <>
            <line x1="18" y1="35" x2="30" y2="35" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="56" cy="35" r="3.5" fill="currentColor" />
          </>
        );
      case 'neutral':
      default:
        // Normal eyes
        return (
          <>
            <circle cx="24" cy="35" r="3" fill="currentColor" />
            <circle cx="56" cy="35" r="3" fill="currentColor" />
          </>
        );
    }
  };

  const getEyebrowPath = () => {
    switch (expression) {
      case 'happy':
        return (
          <>
            <path d="M 15,28 Q 24,20 33,28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 47,28 Q 56,20 65,28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'sad':
        return (
          <>
            <path d="M 16,24 L 32,30" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 48,30 L 64,24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        return (
          <>
            <path d="M 15,24 L 31,27" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 48,22 Q 56,18 64,24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'surprised':
        return (
          <>
            <path d="M 15,20 Q 24,14 33,20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 47,20 Q 56,14 65,20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <line x1="15" y1="26" x2="31" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="49" y1="26" x2="65" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <div id="doctor-speech-wrapper" className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
      {/* Sound Controller in corner */}
      <button
        id="btn-voice-toggle"
        onClick={toggleMute}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition"
        title={isMuted ? '소리 켜기' : '소리 끄기'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
      </button>

      {/* Doctor Animated Avatar SVG */}
      <div id="doctor-avatar-container" className="relative flex-none bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-2xl border-2 border-indigo-100 dark:border-indigo-950/60 shadow-inner">
        <svg
          id="doctor-avatar-svg"
          width="90"
          height="90"
          viewBox="0 0 80 80"
          className="text-slate-700 dark:text-slate-200"
        >
          {/* Hair (Gray retro look) */}
          <path d="M 12,42 C 8,18 20,4 40,4 C 60,4 72,18 68,42 C 73,46 71,55 67,52 C 67,61 58,68 40,68 C 22,68 13,61 13,52 C 9,55 7,46 12,42 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          
          {/* Face */}
          <ellipse cx="40" cy="42" rx="26" ry="24" fill="#FEE2E2" />

          {/* Glasses Frame (Cute round double circles) */}
          <circle cx="27" cy="35" r="9" fill="none" stroke="#475569" strokeWidth="2" />
          <circle cx="53" cy="35" r="9" fill="none" stroke="#475569" strokeWidth="2" />
          <line x1="36" y1="35" x2="44" y2="35" stroke="#475569" strokeWidth="2" />

          {/* Eyes & Eyebrows */}
          {getEyePath()}
          {getEyebrowPath()}

          {/* Blush */}
          <circle cx="20" cy="45" r="3" fill="#F87171" opacity="0.4" />
          <circle cx="60" cy="45" r="3" fill="#F87171" opacity="0.4" />

          {/* Nose */}
          <path d="M 40,32 Q 37,42 40,43" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Doctor Mustache / Beard */}
          <path d="M 33,52 Q 40,48 47,52" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />

          {/* Mouth (with speaking motion) */}
          {talkingState ? (
            <motion.path
              d="M 36,55 Q 40,64 44,55 Z"
              fill="#991B1B"
              animate={{ d: ["M 36,55 Q 40,55 44,55 Z", "M 36,55 Q 40,65 44,55 Z", "M 36,55 Q 40,59 44,55 Z"] }}
              transition={{ repeat: Infinity, duration: 0.25, ease: "easeInOut" }}
            />
          ) : expression === 'happy' ? (
            // Smiling mouth
            <path d="M 34,55 Q 40,63 46,55" stroke="#991B1B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : expression === 'sad' ? (
            // Frowning mouth
            <path d="M 34,58 Q 40,51 46,58" stroke="#991B1B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : (
            // Simple line mouth
            <line x1="35" y1="56" x2="45" y2="56" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Dr. Collared Shirt / Lab coat details */}
          <path d="M 22,66 L 40,79 L 58,66" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M 36,66 L 40,79 L 44,66" fill="#0284C7" />
          <circle cx="40" cy="73" r="1.5" fill="#FFFFFF" />
        </svg>

        {/* Status dot */}
        <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-[10px] text-white font-mono px-1.5 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
          두뇌박사
        </div>
      </div>

      {/* Bubble Message */}
      <div id="speech-bubble-body" className="flex-1 w-full">
        <div className="text-xs text-indigo-500 font-bold tracking-wider uppercase mb-1 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 inline" />
          박사님의 맞춤 가이드
        </div>
        <div className="font-sans text-sm md:text-base text-slate-800 dark:text-zinc-200 font-medium leading-relaxed min-h-[48px]">
          {typedText}
          {talkingState && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="inline-block w-2.5 h-4 bg-indigo-600 ml-1 rounded-sm align-middle"
            />
          )}
        </div>

        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-2 justify-end"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  );
}
