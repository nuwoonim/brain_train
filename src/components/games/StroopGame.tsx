import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Clock, HelpCircle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface StroopGameProps {
  isTestMode?: boolean;
  onFinish: (scoreObj: { score: number; timePlayed: number; isCorrectPercent: number }) => void;
  onExit: () => void;
}

interface StroopOption {
  id: string;
  name: string;
  colorClass: string;
  hex: string;
}

const COLOR_OPTIONS: StroopOption[] = [
  { id: 'red', name: '빨강', colorClass: 'text-red-500 bg-red-50 hover:bg-red-100/80 border-red-200', hex: '#EF4444' },
  { id: 'blue', name: '파랑', colorClass: 'text-blue-500 bg-blue-50 hover:bg-blue-100/80 border-blue-200', hex: '#3B82F6' },
  { id: 'yellow', name: '노랑', colorClass: 'text-amber-500 bg-amber-50 hover:bg-amber-100/80 border-amber-200', hex: '#F59E0B' },
  { id: 'green', name: '초록', colorClass: 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200', hex: '#10B981' },
  { id: 'purple', name: '보라', colorClass: 'text-purple-500 bg-purple-50 hover:bg-purple-100/80 border-purple-200', hex: '#8B5CF6' },
];

interface StroopQuestion {
  wordText: string;     // e.g. "빨강"
  inkOption: StroopOption;  // Color it is rendered in
}

export default function StroopGame({ isTestMode = false, onFinish, onExit }: StroopGameProps) {
  const TOTAL_QUESTIONS = 10;
  const [questions, setQuestions] = useState<StroopQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [isDone, setIsDone] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    // Generate randomized questions
    const list: StroopQuestion[] = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const textIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
      const inkIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
      
      const wordText = COLOR_OPTIONS[textIndex].name;
      const inkOption = COLOR_OPTIONS[inkIndex];

      list.push({ wordText, inkOption });
    }
    setQuestions(list);
  }, []);

  // Timer
  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isDone]);

  const handleAnswer = (option: StroopOption) => {
    if (feedback !== null || isDone) return;

    const currentQ = questions[currentIndex];
    const isCorrect = option.id === currentQ.inkOption.id;

    if (isCorrect) {
      setFeedback('correct');
      setCorrectCount((prev) => prev + 1);
      audio.playCorrect();
    } else {
      setFeedback('wrong');
      audio.playWrong();
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < TOTAL_QUESTIONS - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsDone(true);
        const accuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / TOTAL_QUESTIONS) * 100);
        const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        // Stroke metrics: highly speed-sensitive
        const finalScore = Math.max(10, Math.round((accuracy * 0.7) + (Math.max(0, 100 - finalTime) * 0.3)));
        
        setTimeout(() => {
          onFinish({
            score: finalScore,
            timePlayed: finalTime,
            isCorrectPercent: accuracy,
          });
        }, 800);
      }
    }, 700);
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <div id="stroop-game-container" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-zinc-900 px-4 py-2 border rounded-xl shadow-xs">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block">스트룹 인지 트레이닝</span>
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">
            문제 {currentIndex + 1} <span className="text-sm font-normal text-slate-400">/ {TOTAL_QUESTIONS}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {elapsedTime}초
        </div>
      </div>

      {/* Guide Note Box */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 mb-4 text-center">
        <p className="text-xs md:text-sm text-amber-800 dark:text-amber-400 font-medium flex items-center justify-center gap-1.5">
          <HelpCircle className="w-4 h-4 inline text-amber-600 shrink-0" />
          글자의 <strong className="text-red-600 dark:text-red-400 underline">의미(뜻)</strong>가 아닌, 실제 화면에 보이는 <strong className="text-indigo-600 dark:text-indigo-400 underline">색상</strong>을 맞추세요!
        </p>
      </div>

      {/* Primary Display Card */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden min-h-[220px]">
        {/* Progress Dots */}
        <div className="absolute top-2 left-2 flex gap-1">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-1.5 rounded-full transition-all ${
                idx < currentIndex
                  ? 'bg-emerald-500'
                  : idx === currentIndex
                  ? 'bg-indigo-500 h-2 w-3 animate-pulse'
                  : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Big Word to Match */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ color: currentQ.inkOption.hex }}
            className="text-6xl md:text-7xl font-sans font-black tracking-widest my-8 filter drop-shadow-md select-none text-center"
          >
            {currentQ.wordText}
          </motion.div>
        </AnimatePresence>

        {/* Visual Feedback Overlays */}
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/10"
            >
              <div className="border-8 border-emerald-500 text-emerald-500 rounded-full p-6 animate-ping">
                <Check className="w-16 h-16" />
              </div>
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-rose-500/10"
            >
              <div className="border-8 border-rose-500 text-rose-500 rounded-full p-6">
                <X className="w-16 h-16" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Answer Button Container (Color Selector) */}
      <div className="flex flex-col gap-2.5 max-w-sm mx-auto w-full">
        <label className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider block">실제 무슨 색상인가요?</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`stroop-option-${opt.id}`}
              onClick={() => handleAnswer(opt)}
              disabled={feedback !== null}
              className={`flex-1 py-3 text-sm font-black rounded-xl border-2 transition-transform transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer select-none col-span-1 last:col-span-2 sm:last:col-span-1 shadow-xs ${opt.colorClass}`}
            >
              <div className="w-3.5 h-3.5 rounded-full shadow-inner border" style={{ backgroundColor: opt.hex }} />
              {opt.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quit Button */}
      <div className="mt-4 flex justify-center max-w-sm mx-auto w-full">
        <button
          id="btn-quit-stroop-game"
          onClick={onExit}
          className="text-center py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
        >
          트레이닝 중단하기
        </button>
      </div>
    </div>
  );
}
