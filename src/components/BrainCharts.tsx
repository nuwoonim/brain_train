import React from 'react';
import { motion } from 'motion/react';
import { BrainAgeRecord, GameType } from '../types';
import { TrendingDown, Award, Sparkles, HelpCircle } from 'lucide-react';

interface BrainChartsProps {
  history: BrainAgeRecord[];
  highScores: { [key in GameType]?: number };
}

export default function BrainCharts({ history, highScores }: BrainChartsProps) {
  // Translate Game Type IDs to readable names
  const getGameName = (type: GameType) => {
    switch (type) {
      case GameType.MATH:
        return '계산 트레이닝 20';
      case GameType.STROOP:
        return '스트룹 색상 맞추기';
      case GameType.SEQUENCE:
        return '순간 공간 순서 터치';
      case GameType.MEMORY:
        return '카드 매칭 기억력';
      case GameType.FLASH:
        return '순간 개수 세기';
      default:
        return '게임';
    }
  };

  // Safe parsing helper
  const parsedHistory = [...history].sort(
    (a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime()
  );

  return (
    <div id="brain-charts-and-records" className="space-y-6">
      {/* 1. Brain Age Curve */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
        <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 mb-1 font-sans">
          <TrendingDown className="w-5 h-5 text-indigo-500" />
          두뇌 연령 변동 추이
        </h3>
        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          두뇌 연령은 <strong className="text-indigo-600 dark:text-indigo-400">20세(가장 젊음)</strong>에 가까울수록 좋습니다.
        </p>

        {parsedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-zinc-950/20 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
            <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-xs text-slate-400 font-bold">아직 두뇌 연령 테스트 기록이 없습니다.</span>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">대시보드에서 '두뇌 연령 테스트'를 완료해 첫 연령 성적표를 받아보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visual Custom Chart Bar */}
            <div className="flex items-end gap-2 h-36 border-b border-l border-slate-200 dark:border-zinc-800 pb-2 px-2 pt-4">
              {parsedHistory.slice(-7).map((record, index) => {
                // Calculate percentage height: 20 is 100% height, 80 is 0% height
                // Formula: height = (80 - val) / (80 - 20) * 100 = (80 - val) / 60 * 100
                const age = record.brainAge;
                const percentage = Math.max(10, Math.min(100, ((80 - age) / 60) * 100));

                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                    {/* Tooltip age */}
                    <div className="absolute -top-6 bg-slate-800 dark:bg-zinc-800 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {age}세
                    </div>

                    {/* Bar visual representation */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      className="w-full max-w-[24px] bg-indigo-500 hover:bg-indigo-600 rounded-t-md relative flex items-start justify-center text-white"
                    >
                      <span className="text-[9px] font-black mt-1 font-mono">{age}세</span>
                    </motion.div>

                    {/* Short Date caption */}
                    <span className="text-[9px] text-slate-400 mt-1.5 font-mono">
                      {record.testedAt.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
              <span>← 과거 기록</span>
              <span>최근 기록 (최대 7개) →</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. High Scores per Game Modality */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
        <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          과목별 최고 기록 명예의 전당
        </h3>

        <div className="space-y-3.5">
          {[GameType.MATH, GameType.STROOP, GameType.SEQUENCE, GameType.MEMORY, GameType.FLASH].map((type) => {
            const hasScore = highScores[type] !== undefined;
            const score = highScores[type] || 0;
            // Percent for horizontal fill
            const fillPercent = Math.min(100, Math.max(15, score));

            return (
              <div key={type} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1">
                    {type === GameType.MATH && '🧮'}
                    {type === GameType.STROOP && '🎨'}
                    {type === GameType.SEQUENCE && '🔢'}
                    {type === GameType.MEMORY && '🃏'}
                    {type === GameType.FLASH && '💫'}
                    {getGameName(type)}
                  </span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {hasScore ? `${score}점` : '미기록'}
                  </span>
                </div>

                <div className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800 relative">
                  {hasScore ? (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-end pr-2"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse uppercase" />
                    </motion.div>
                  ) : (
                    <div className="h-full bg-slate-200/50 dark:bg-zinc-900/40 w-full flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-normal">트레이닝에서 최고 점수를 받아보세요!</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
