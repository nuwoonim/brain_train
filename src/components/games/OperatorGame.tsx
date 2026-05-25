import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Award, Clock, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { audio } from '../../utils/audio';

interface OperatorGameProps {
  isTestMode?: boolean;
  onFinish: (scoreObj: { score: number; timePlayed: number; isCorrectPercent: number }) => void;
  onExit: () => void;
}

interface OpQuestion {
  num1: number;
  num2: number;
  num3: number;
  op1: '+' | '-';
  op2: '+' | '-';
  target: number;
}

export default function OperatorGame({ isTestMode = false, onFinish, onExit }: OperatorGameProps) {
  const TOTAL_QUESTIONS = isTestMode ? 5 : 10;
  const [questions, setQuestions] = useState<OpQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // User selected operators for the two slots [option1, option2]
  const [selectedOp1, setSelectedOp1] = useState<'+' | '-' | null>(null);
  const [selectedOp2, setSelectedOp2] = useState<'+' | '-' | null>(null);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);

  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Generate Questions
  useEffect(() => {
    const list: OpQuestion[] = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      let num1 = Math.floor(Math.random() * 15) + 5; // 5 ~ 19
      let num2 = Math.floor(Math.random() * 10) + 2; // 2 ~ 11
      let num3 = Math.floor(Math.random() * 8) + 1;  // 1 ~ 8

      const op1: '+' | '-' = Math.random() > 0.5 ? '+' : '-';
      const op2: '+' | '-' = Math.random() > 0.5 ? '+' : '-';

      // Ensure intermediate and final numbers are sane (no negative targets to keep it senior-friendly)
      let inter = op1 === '+' ? num1 + num2 : num1 - num2;
      // If negative intermediate, swap to +
      if (inter < 0) {
        inter = num1 + num2;
      }
      
      let finalVal = op2 === '+' ? inter + num3 : inter - num3;
      if (finalVal < 1) {
        finalVal = inter + num3;
      }

      // Re-run formula if math doesn't check out cleanly
      list.push({
        num1,
        num2,
        num3,
        op1: op1 === '+' && inter === num1 - num2 ? '-' : op1,
        op2: op2 === '+' && finalVal === inter - num3 ? '-' : op2,
        target: finalVal,
      });
    }
    setQuestions(list);
  }, [isTestMode, TOTAL_QUESTIONS]);

  // Game timer
  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isDone]);

  const selectOperator = (op: '+' | '-') => {
    audio.playBeep(880, 0.08, 'sine');
    if (activeSlot === 1) {
      setSelectedOp1(op);
      setActiveSlot(2); // Auto advance to second slot for smoother UX
    } else {
      setSelectedOp2(op);
    }
  };

  const handleClear = () => {
    audio.playBeep(440, 0.1, 'sine');
    setSelectedOp1(null);
    setSelectedOp2(null);
    setActiveSlot(1);
  };

  const currentQ = questions[currentIndex];

  const handleSubmit = () => {
    if (!selectedOp1 || !selectedOp2) return;

    let ansCorrect = false;
    // Evaluate math equation
    let val1 = selectedOp1 === '+' ? currentQ.num1 + currentQ.num2 : currentQ.num1 - currentQ.num2;
    let finalVal = selectedOp2 === '+' ? val1 + currentQ.num3 : val1 - currentQ.num3;

    if (finalVal === currentQ.target) {
      ansCorrect = true;
    }

    if (ansCorrect) {
      setCorrectCount((prev) => prev + 1);
      audio.playCorrect();
    } else {
      audio.playWrong();
    }

    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setSelectedOp1(null);
      setSelectedOp2(null);
      setActiveSlot(1);
      setCurrentIndex((p) => p + 1);
    } else {
      setIsDone(true);
      const accuracy = Math.round(((ansCorrect ? correctCount + 1 : correctCount) / TOTAL_QUESTIONS) * 100);
      const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      // Base score on correct rate penalized by time
      const baseScore = Math.max(10, 100 - (finalTime * 0.4) + (accuracy * 0.35));

      setTimeout(() => {
        onFinish({
          score: Math.round(baseScore),
          timePlayed: finalTime,
          isCorrectPercent: accuracy,
        });
      }, 1000);
    }
  };

  // Keyboard support for seniors with standard keyboards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDone) return;
      if (e.key === '+') {
        selectOperator('+');
      } else if (e.key === '-') {
        selectOperator('-');
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOp1, selectedOp2, activeSlot, currentIndex, questions, isDone]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div id="operator-game-container" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-zinc-900 px-4 py-3 border rounded-xl shadow-xs">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block">연산 부호 채우기 🧠</span>
          <span className="text-lg font-bold text-slate-850 dark:text-zinc-100">
            문제 {currentIndex + 1} <span className="text-sm font-normal text-slate-400">/ {TOTAL_QUESTIONS}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* Main Quest Board with Large Text */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm mb-4 relative overflow-hidden min-h-[220px]">
        <div className="absolute top-2 left-2 flex gap-1">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-1.5 rounded-full transition-colors ${
                idx < currentIndex
                  ? 'bg-emerald-500'
                  : idx === currentIndex
                  ? 'bg-indigo-500 animate-pulse'
                  : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          {!isDone ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col items-center justify-center w-full"
            >
              <div className="bg-amber-50/50 dark:bg-zinc-950/40 px-4 py-2 rounded-lg border border-amber-100 dark:border-zinc-805/45 mb-5 flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold text-center">
                <HelpCircle className="w-4 h-4" />
                <span>빈 칸을 탭하고 아래 [＋] 또는 [－] 기호를 눌러 정답을 완성하세요!</span>
              </div>

              {/* Math Display with big boxes */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4 text-3xl md:text-5xl font-mono font-black text-slate-800 dark:text-zinc-100">
                <span>{currentQ.num1}</span>

                {/* Operator 1 Box */}
                <button
                  id="btn-select-slot-1"
                  onClick={() => {
                    audio.playBeep(600, 0.05, 'sine');
                    setActiveSlot(1);
                  }}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    activeSlot === 1
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 scale-105 shadow-xs'
                      : selectedOp1
                      ? 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800'
                      : 'border-dashed border-slate-300 dark:border-zinc-700 text-slate-300 bg-transparent'
                  }`}
                >
                  {selectedOp1 || '?'}
                </button>

                <span>{currentQ.num2}</span>

                {/* Operator 2 Box */}
                <button
                  id="btn-select-slot-2"
                  onClick={() => {
                    audio.playBeep(600, 0.05, 'sine');
                    setActiveSlot(2);
                  }}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    activeSlot === 2
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 scale-105 shadow-xs'
                      : selectedOp2
                      ? 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800'
                      : 'border-dashed border-slate-300 dark:border-zinc-700 text-slate-300 bg-transparent'
                  }`}
                >
                  {selectedOp2 || '?'}
                </button>

                <span>{currentQ.num3}</span>

                <span className="text-slate-400">=</span>

                <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-1.5 rounded-2xl border border-indigo-100">
                  {currentQ.target}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <Award className="w-12 h-12 text-yellow-500 animate-bounce" />
              <div className="text-xl font-bold text-slate-800 dark:text-zinc-100">연산 추리 완료!</div>
              <p className="text-sm text-slate-500">채점 및 반응 단차를 계산 중입니다...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Operator Keypad designed for ease of use by seniors */}
      {!isDone && (
        <div className="space-y-3 max-w-sm mx-auto w-full">
          <div className="grid grid-cols-2 gap-3">
            <button
              id="btn-operator-plus"
              onClick={() => selectOperator('+')}
              className="py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-98 transition cursor-pointer"
            >
              <span className="text-3xl font-black">＋</span>
              <span className="text-xs font-bold text-emerald-100">더하기</span>
            </button>

            <button
              id="btn-operator-minus"
              onClick={() => selectOperator('-')}
              className="py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-98 transition cursor-pointer"
            >
              <span className="text-3xl font-black">－</span>
              <span className="text-xs font-bold text-rose-100">빼기</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-operator-clear"
              onClick={handleClear}
              className="py-3 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-black transition cursor-pointer"
            >
              🔄 처음부터 다시
            </button>
            <button
              id="btn-operator-submit"
              disabled={!selectedOp1 || !selectedOp2}
              onClick={handleSubmit}
              className={`py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedOp1 && selectedOp2
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-zinc-850/40 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" /> 정답 제출하기
            </button>
          </div>
        </div>
      )}

      {/* Exit Button */}
      <div className="mt-6 flex justify-between gap-4 max-w-sm mx-auto w-full">
        <button
          id="btn-quit-operator-game"
          onClick={onExit}
          className="w-full text-center py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
        >
          트레이닝 중단하기
        </button>
      </div>
    </div>
  );
}
