import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, RefreshCw, Send, Award, Zap } from 'lucide-react';
import { audio } from '../../utils/audio';

interface CountFlashGameProps {
  onFinish: (scoreObj: { score: number; timePlayed: number; isCorrectPercent: number }) => void;
  onExit: () => void;
}

interface DotPosition {
  x: number; // percentage
  y: number; // percentage
  size: number;
}

export default function CountFlashGame({ onFinish, onExit }: CountFlashGameProps) {
  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [dots, setDots] = useState<DotPosition[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [showDots, setShowDots] = useState(false);
  const [userGuess, setUserGuess] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctAnswersRoundCount, setCorrectAnswersRoundCount] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [isDone, setIsDone] = useState(false);

  const startRound = (roundNum: number) => {
    setShowDots(false);
    setUserGuess(null);
    setHasAnswered(false);

    // Number of dots based on round complexity (e.g. 3 to 10 dots)
    const count = Math.floor(Math.random() * 4) + 2 + roundNum; // Round 1: 3-5, Round 5: 7-10

    // Random non-overlapping positions
    const list: DotPosition[] = [];
    const minDistance = 15; // minimum distance percentage to avoid overlap

    while (list.length < count) {
      const rx = Math.floor(Math.random() * 70) + 15; // 15% to 85%
      const ry = Math.floor(Math.random() * 70) + 15;
      const size = Math.floor(Math.random() * 10) + 24; // size in pixels (24px to 34px)

      // check overlap
      const tooClose = list.some((dot) => {
        const dist = Math.sqrt(Math.pow(dot.x - rx, 2) + Math.pow(dot.y - ry, 2));
        return dist < minDistance;
      });

      if (!tooClose) {
        list.push({ x: rx, y: ry, size });
      }
    }

    setDots(list);

    // Calculate dynamic options
    const target = count;
    const choicesSet = new Set<number>();
    choicesSet.add(target);
    while (choicesSet.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2; // -2 to +2
      const fake = target + offset;
      if (fake > 1 && fake < 15) {
        choicesSet.add(fake);
      }
    }
    setOptions(Array.from(choicesSet).sort((a, b) => a - b));

    // Flash dots after a tiny delay
    setTimeout(() => {
      audio.playBeep(440, 0.15, 'sawtooth');
      setShowDots(true);

      // Duration of flash (e.g. 1.2s in Round 1, scaling down to 0.65s in Round 5)
      const flashDuration = Math.max(650, 1500 - roundNum * 180);

      setTimeout(() => {
        setShowDots(false);
        audio.playBeep(260, 0.1, 'sine');
      }, flashDuration);
    }, 800);
  };

  useEffect(() => {
    startRound(currentRound);
  }, [currentRound]);

  // Overall stopwatch
  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isDone]);

  const handleChoice = (num: number) => {
    if (hasAnswered || isDone) return;

    setUserGuess(num);
    setHasAnswered(true);

    const isCorrect = num === dots.length;
    if (isCorrect) {
      setCorrectAnswersRoundCount((prev) => prev + 1);
      audio.playCorrect();
    } else {
      audio.playWrong();
    }

    // Move to next or complete
    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS) {
        setCurrentRound((prev) => prev + 1);
      } else {
        setIsDone(true);
        const accuracy = Math.round((correctAnswersRoundCount + (isCorrect ? 1 : 0)) / TOTAL_ROUNDS * 100);
        const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const finalScore = Math.max(10, Math.round(accuracy + Math.max(0, 100 - finalTime) * 0.12));

        setTimeout(() => {
          onFinish({
            score: finalScore,
            timePlayed: finalTime,
            isCorrectPercent: accuracy,
          });
        }, 800);
      }
    }, 1200);
  };

  const getFlashTimeText = () => {
    return (Math.max(650, 1500 - currentRound * 180) / 1000).toFixed(2);
  };

  return (
    <div id="count-flash-game-container" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-zinc-900 px-4 py-2 border rounded-xl shadow-xs">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block">순간 직관적 개수 세기</span>
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">
            라운드 {currentRound} <span className="text-sm font-normal text-slate-400">/ {TOTAL_ROUNDS}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {elapsedTime}초
        </div>
      </div>

      {/* Guide notes */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-2.5 rounded-2xl text-center mb-4">
        <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
          <Zap className="w-4 h-4 text-emerald-600 animate-bounce" />
          화면에 노란색 별이 <strong className="text-amber-500">{getFlashTimeText()}초</strong> 동안 깜빡입니다. 순간적으로 세어보세요!
        </p>
      </div>

      {/* Visual Canvas containing flashing stars */}
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 shadow-inner mb-6 relative overflow-hidden min-h-[250px]">
        {showDots ? (
          <div className="absolute inset-0 w-full h-full">
            {dots.map((dot, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                style={{
                  position: 'absolute',
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  marginLeft: `-${dot.size / 2}px`,
                  marginTop: `-${dot.size / 2}px`,
                }}
                className="bg-amber-400 dark:bg-yellow-400 rounded-full shadow-lg shadow-amber-500/50 border-2 border-white flex items-center justify-center text-white font-bold select-none text-md"
              >
                ★
              </motion.div>
            ))}
          </div>
        ) : !hasAnswered ? (
          <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
            <div className="w-12 h-12 rounded-full border-4 border-dashed border-zinc-700 animate-spin" />
            <span className="text-sm font-bold tracking-wide">도형이 가려졌습니다!</span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center gap-3"
          >
            <span className="text-lg font-bold text-zinc-400">정답</span>
            <div className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center text-4xl font-extrabold shadow-md border-4 border-indigo-300">
              {dots.length}
            </div>
            {userGuess === dots.length ? (
              <span className="text-emerald-400 font-black text-xl">정답입니다! (+1)</span>
            ) : (
              <span className="text-rose-400 font-black text-xl">
                틀렸습니다! (선택: {userGuess})
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Option Buttons */}
      <div id="count-flash-options" className="flex flex-col gap-2.5 max-w-sm mx-auto w-full">
        <label className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider block">방금 본 것은 몇 개입니까?</label>
        <div className="grid grid-cols-4 gap-2 w-full">
          {options.map((opt) => (
            <button
              key={opt}
              id={`count-opt-${opt}`}
              onClick={() => handleChoice(opt)}
              disabled={hasAnswered}
              className={`py-3.5 text-lg font-black rounded-xl border-2 cursor-pointer transition-colors active:scale-95 ${
                hasAnswered
                  ? opt === dots.length
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : opt === userGuess
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-zinc-900 dark:border-zinc-800'
                  : 'bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {opt}개
            </button>
          ))}
        </div>
      </div>

      {/* Exit */}
      <div className="mt-4 flex justify-center max-w-sm mx-auto w-full">
        <button
          id="btn-quit-count-game"
          onClick={onExit}
          className="text-center py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
        >
          트레이닝 중단하기
        </button>
      </div>
    </div>
  );
}
