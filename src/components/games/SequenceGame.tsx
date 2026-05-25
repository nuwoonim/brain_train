import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, RefreshCw, EyeOff, Award, HelpCircle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface SequenceGameProps {
  isTestMode?: boolean;
  onFinish: (scoreObj: { score: number; timePlayed: number; isCorrectPercent: number }) => void;
  onExit: () => void;
}

interface GridCell {
  id: number; // The number to touch (e.g., 1, 2, 3...)
  row: number;
  col: number;
  revealed: boolean;
  isCorrectTouch: boolean | null; // true = tapped correct, false = tapped error, null = untouched
}

export default function SequenceGame({ isTestMode = false, onFinish, onExit }: SequenceGameProps) {
  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [gridSize, setGridSize] = useState(4); // 4x4 grid
  const [cells, setCells] = useState<GridCell[]>([]);
  const [isMemorizing, setIsMemorizing] = useState(true);
  const [countdown, setCountdown] = useState(3.5); // 3.5 seconds to memorize
  const [targetNumber, setTargetNumber] = useState(1);
  const [isFailedRound, setIsFailedRound] = useState(false);
  const [correctRoundCount, setCorrectRoundCount] = useState(0);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [isDone, setIsDone] = useState(false);

  // Set grid cells based on round
  const generateLevel = (roundNum: number) => {
    setIsMemorizing(true);
    setCountdown(Math.max(2, 4.5 - roundNum * 0.4)); // Shorter memorization time in later rounds
    setTargetNumber(1);
    setIsFailedRound(false);

    // Number of elements in this round
    const elementCount = 3 + roundNum; // Round 1: 4 numbers, Round 5: 8 numbers

    // Randomized unique coordinates in a 4x4 grid (16 slots)
    const totalSlots = 16;
    const slots: { row: number; col: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        slots.push({ row: r, col: c });
      }
    }

    // Shuffle slots
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const levelCells: GridCell[] = [];
    for (let num = 1; num <= elementCount; num++) {
      const slot = slots[num - 1];
      levelCells.push({
        id: num,
        row: slot.row,
        col: slot.col,
        revealed: true, // Initially shown for memorizing
        isCorrectTouch: null,
      });
    }

    setCells(levelCells);
  };

  // Build first level
  useEffect(() => {
    generateLevel(currentRound);
  }, [currentRound]);

  // Overall stopwatch
  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isDone]);

  // Memorization countdown timer
  useEffect(() => {
    if (!isMemorizing || isDone) return;

    const interval = 100; // Count every 100ms for responsiveness
    const cdTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0.1) {
          clearInterval(cdTimer);
          setIsMemorizing(false);
          // Hide all cells for playing
          setCells((prevCells) =>
            prevCells.map((c) => ({ ...c, revealed: false }))
          );
          audio.playBeep(400, 0.1, 'triangle');
          return 0;
        }
        return prev - 0.1;
      });
    }, interval);

    return () => clearInterval(cdTimer);
  }, [isMemorizing, currentRound, isDone]);

  const handleCellTap = (cell: GridCell) => {
    if (isMemorizing || isFailedRound || cell.isCorrectTouch !== null || isDone) return;

    if (cell.id === targetNumber) {
      // Correct!
      audio.playBeep(600 + targetNumber * 100, 0.08, 'sine');
      setCells((prev) =>
        prev.map((c) =>
          c.id === cell.id ? { ...c, revealed: true, isCorrectTouch: true } : c
        )
      );

      const maxNumInRound = 3 + currentRound;
      if (targetNumber === maxNumInRound) {
        // Round complete successfully!
        setCorrectRoundCount((prev) => prev + 1);
        audio.playCorrect();
        triggerRoundTransition(false);
      } else {
        setTargetNumber((prev) => prev + 1);
      }
    } else {
      // Incorrect touch!
      audio.playWrong();
      setIsFailedRound(true);
      // Reveal entire grid to show the failure positions
      setCells((prev) =>
        prev.map((c) => ({
          ...c,
          revealed: true,
          isCorrectTouch: c.id === cell.id ? false : c.isCorrectTouch,
        }))
      );
      triggerRoundTransition(true);
    }
  };

  const triggerRoundTransition = (failed: boolean) => {
    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS) {
        setCurrentRound((prev) => prev + 1);
      } else {
        setIsDone(true);
        const accuracy = Math.round((correctRoundCount / TOTAL_ROUNDS) * 100);
        const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const finalScore = Math.max(10, Math.round(accuracy + Math.max(0, 80 - finalTime)));

        setTimeout(() => {
          onFinish({
            score: finalScore,
            timePlayed: finalTime,
            isCorrectPercent: accuracy,
          });
        }, 800);
      }
    }, 1500);
  };

  return (
    <div id="sequence-game-container" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4">
      {/* Header UI */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-zinc-900 px-4 py-2 border rounded-xl shadow-xs">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block">순간 공간 기억 트레이닝</span>
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">
            라운드 {currentRound} <span className="text-sm font-normal text-slate-400">/ {TOTAL_ROUNDS}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {elapsedTime}초
        </div>
      </div>

      {/* Helper Guidance Banner */}
      <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/30 p-2.5 rounded-xl text-center mb-3">
        {isMemorizing ? (
          <p className="text-xs md:text-sm text-sky-800 dark:text-sky-400 font-semibold flex items-center justify-center gap-1.5 animate-pulse">
            <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
            숫자들의 위치를 외우세요! {countdown.toFixed(1)}초 후 가려집니다.
          </p>
        ) : isFailedRound ? (
          <p className="text-xs md:text-sm text-rose-800 dark:text-red-400 font-bold flex items-center justify-center gap-1">
            ❌ 순서가 틀렸습니다! 정답 위치를 보여주며 넘어갑니다.
          </p>
        ) : (
          <p className="text-xs md:text-sm text-indigo-800 dark:text-indigo-400 font-semibold flex items-center justify-center gap-1.5">
            <EyeOff className="w-4 h-4 text-indigo-500" />
            숫자 <strong>1</strong>부터 차례대로 빈 원을 터치하세요! 현재 목표: <strong>{targetNumber}</strong>
          </p>
        )}
      </div>

      {/* 4x4 Grid Board Container */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm mb-4 relative min-h-[300px]">
        <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full max-w-xs aspect-square">
          {Array.from({ length: 16 }).map((_, idx) => {
            const row = Math.floor(idx / 4);
            const col = idx % 4;

            // Find matching cell
            const cell = cells.find((c) => c.row === row && c.col === col);

            if (!cell) {
              // Plain empty space
              return (
                <div key={idx} className="bg-slate-50 dark:bg-zinc-950/10 rounded-xl" />
              );
            }

            // Interactive Circle Cell
            const showValue = cell.revealed || isMemorizing;
            let themeClass = 'bg-slate-100 hover:bg-indigo-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-2 border-slate-300 dark:border-zinc-700';

            if (cell.isCorrectTouch === true) {
              themeClass = 'bg-emerald-500 text-white border-none shadow-md';
            } else if (cell.isCorrectTouch === false) {
              themeClass = 'bg-rose-500 text-white border-none shadow-md animate-shake';
            } else if (!showValue) {
              themeClass = 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-none shadow-md text-transparent cursor-pointer hover:brightness-110 active:scale-95';
            }

            return (
              <button
                key={idx}
                id={`seq-col-${row}-${col}`}
                onClick={() => handleCellTap(cell)}
                className={`w-full aspect-square rounded-full flex items-center justify-center text-xl font-bold font-mono transition-transform duration-100 outline-none select-none ${themeClass}`}
              >
                {showValue ? cell.id : ' '}
              </button>
            );
          })}
        </div>

        {/* Visual Round Transition Banner */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 flex flex-col items-center justify-center gap-3 rounded-2xl"
            >
              <Award className="w-12 h-12 text-yellow-500 animate-bounce" />
              <p className="text-lg font-black text-slate-800 dark:text-zinc-100">모든 라운드 완료!</p>
              <p className="text-sm text-slate-500">결과 분석 화면으로 이동합니다...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Exit Button */}
      <div className="flex justify-center max-w-sm mx-auto w-full">
        <button
          id="btn-quit-seq-game"
          onClick={onExit}
          className="text-center py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
        >
          트레이닝 중단하기
        </button>
      </div>
    </div>
  );
}
