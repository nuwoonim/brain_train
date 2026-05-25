import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, Send, RefreshCw, Award, Clock } from 'lucide-react';
import { audio } from '../../utils/audio';

interface CalculationGameProps {
  isTestMode?: boolean;
  onFinish: (scoreObj: { score: number; timePlayed: number; isCorrectPercent: number }) => void;
  onExit: () => void;
}

interface Question {
  operand1: number;
  operand2: number;
  operator: '+' | '-' | '*';
  answer: number;
}

export default function CalculationGame({ isTestMode = false, onFinish, onExit }: CalculationGameProps) {
  const TOTAL_QUESTIONS = isTestMode ? 10 : 20; // 10 questions in brain test mode, 20 in normal training
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Generate math questions
  useEffect(() => {
    const list: Question[] = [];
    const operators: ('+' | '-' | '*')[] = ['+', '-', '*'];

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const op = operators[Math.floor(Math.random() * (isTestMode ? 2 : 3))]; // Skip multiply in quick tests
      let op1 = 0;
      let op2 = 0;
      let ans = 0;

      if (op === '+') {
        op1 = Math.floor(Math.random() * 20) + 1;
        op2 = Math.floor(Math.random() * 20) + 1;
        ans = op1 + op2;
      } else if (op === '-') {
        op1 = Math.floor(Math.random() * 25) + 5;
        op2 = Math.floor(Math.random() * op1) + 1; // assure positive answer
        ans = op1 - op2;
      } else {
        op1 = Math.floor(Math.random() * 9) + 2;
        op2 = Math.floor(Math.random() * 9) + 2;
        ans = op1 * op2;
      }

      list.push({ operand1: op1, operand2: op2, operator: op, answer: ans });
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

  const handleKeyPress = (num: string) => {
    audio.playBeep(900, 0.05, 'sine');
    if (userAnswer.length < 4) {
      setUserAnswer((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    audio.playBeep(500, 0.05, 'sine');
    setUserAnswer((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (userAnswer === '') return;
    
    const currentQ = questions[currentIndex];
    const isCorrect = parseInt(userAnswer, 10) === currentQ.answer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      audio.playCorrect();
    } else {
      audio.playWrong();
    }

    // Move next or finish
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setUserAnswer('');
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsDone(true);
      const accuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / TOTAL_QUESTIONS) * 100);
      const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      // Base score on correct rate penalized by time
      const baseScore = Math.max(10, 100 - (finalTime * 0.5) + (accuracy * 0.3));
      
      setTimeout(() => {
        onFinish({
          score: Math.round(baseScore),
          timePlayed: finalTime,
          isCorrectPercent: accuracy,
        });
      }, 1000);
    }
  };

  const currentQ = questions[currentIndex];

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyboardPhysical = (e: KeyboardEvent) => {
    if (isDone) return;
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardPhysical);
    return () => window.removeEventListener('keydown', handleKeyboardPhysical);
  }, [userAnswer, currentIndex, questions, isDone]);

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div id="calculation-game-container" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-zinc-900 px-4 py-2 border rounded-xl shadow-xs">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block">계산 트레이닝 20</span>
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">
            문제 {currentIndex + 1} <span className="text-sm font-normal text-slate-400">/ {TOTAL_QUESTIONS}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* Main Quest Board */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm mb-4 relative overflow-hidden min-h-[180px]">
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
              className="flex flex-col items-center justify-center"
            >
              {/* Formula */}
              <div className="flex items-center gap-4 text-4xl md:text-5xl font-mono font-bold text-slate-800 dark:text-zinc-100">
                <span>{currentQ.operand1}</span>
                <span className="text-red-500 dark:text-red-400">{currentQ.operator === '*' ? '×' : currentQ.operator}</span>
                <span>{currentQ.operand2}</span>
                <span className="text-slate-400">=</span>
                <div className="w-24 h-14 border-b-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-md flex items-center justify-center text-4xl font-black text-indigo-600 dark:text-indigo-400">
                  {userAnswer === '' ? (
                    <span className="text-slate-300 dark:text-zinc-700 animate-pulse">?</span>
                  ) : (
                    userAnswer
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <Award className="w-12 h-12 text-yellow-500 animate-bounce" />
              <div className="text-xl font-bold text-slate-800 dark:text-zinc-100">계산 완료!</div>
              <p className="text-sm text-slate-500">채점 중입니다. 잠시만 기다려주세요...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Numeric Custom Touch Keypad for Seniors/Mobile */}
      <div id="calculator-keypad" className="grid grid-cols-3 gap-2 max-w-sm mx-auto w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            id={`numkey-${num}`}
            onClick={() => handleKeyPress(num)}
            className="h-12 border-2 border-slate-200 dark:border-zinc-800 bg-white hover:bg-slate-50 active:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xl font-bold text-slate-700 dark:text-zinc-200 rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          id="numkey-delete"
          onClick={handleDelete}
          className="h-12 border-2 border-slate-200 dark:border-zinc-800 bg-rose-50 hover:bg-rose-100 dark:bg-zinc-900/40 text-rose-500 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
          title="한 글자 지우기"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          id="numkey-0"
          onClick={() => handleKeyPress('0')}
          className="h-12 border-2 border-slate-200 dark:border-zinc-800 bg-white hover:bg-slate-50 active:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xl font-bold text-slate-700 dark:text-zinc-200 rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          0
        </button>
        <button
          id="numkey-submit"
          onClick={handleSubmit}
          className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center cursor-pointer transition-colors font-bold"
          title="정답 입력"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Exit Button */}
      <div className="mt-4 flex justify-between gap-4 max-w-sm mx-auto w-full">
        <button
          id="btn-quit-math-game"
          onClick={onExit}
          className="w-full text-center py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
        >
          트레이닝 중단하기
        </button>
      </div>
    </div>
  );
}
