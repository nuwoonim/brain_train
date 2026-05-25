import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Award, Zap } from 'lucide-react';
import { audio } from '../utils/audio';

interface DailyCalendarProps {
  stamps: string[];      // Array of date keys e.g. 'YYYY-MM-DD'
  onStampToday: () => void;
  streak: number;
}

export default function DailyCalendar({ stamps, onStampToday, streak }: DailyCalendarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Format today's date key
  const getTodayKey = () => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const hasStampedToday = stamps.includes(getTodayKey());

  // Get number of days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Get start day of month (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Month name in Korean
  const monthNameKo = `${currentMonth + 1}월`;

  // Calendar days array
  const dayItems: { dateNum: number | null; dateKey: string | null }[] = [];

  // Padding for start of month
  for (let i = 0; i < firstDayIndex; i++) {
    dayItems.push({ dateNum: null, dateKey: null });
  }

  // Populate days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dayItems.push({ dateNum: d, dateKey });
  }

  const handleManualStamp = () => {
    if (hasStampedToday) return;
    audio.playStamp();
    onStampToday();
  };

  const weekHeaders = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div id="daily-calendar-card" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 font-sans leading-none">
            <Calendar className="w-5 h-5 text-indigo-500" />
            매일매일 출석 스탬프
          </h3>
          <p className="text-xs text-slate-400 mt-1">{currentYear}년 {monthNameKo} 연습 일지</p>
        </div>

        {/* Dynamic Streak Badge */}
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-3.5 py-1.5 rounded-xl border border-rose-100 dark:border-rose-950/60 shadow-xs">
          <Zap className="w-4 h-4 text-rose-500 fill-rose-500" />
          <div className="text-xs font-bold leading-none">
            연속 학습 <span className="text-sm font-black text-rose-700 dark:text-rose-300 ml-0.5">{streak}</span>일째
          </div>
        </div>
      </div>

      {/* Grid calendar */}
      <div id="calendar-grid-wrapper" className="border border-slate-100 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-950/10 mb-4 p-2">
        <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-400 py-1.5">
          {weekHeaders.map((day, idx) => (
            <div key={idx} className={idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-sky-500' : ''}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mt-1">
          {dayItems.map((item, idx) => {
            if (!item.dateNum || !item.dateKey) {
              return <div key={idx} className="aspect-square" />;
            }

            const isToday = item.dateKey === getTodayKey();
            const isStamped = stamps.includes(item.dateKey);

            return (
              <div
                key={idx}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative border text-xs font-mono font-bold transition-all ${
                  isToday
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-transparent bg-white dark:bg-zinc-900 shadow-3xs'
                }`}
              >
                {/* Date label */}
                <span className={`z-10 relative ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-500 dark:text-zinc-400'}`}>
                  {item.dateNum}
                </span>

                {/* Stamped Ink Graphic */}
                {isStamped && (
                  <motion.div
                    initial={{ scale: 2.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 0.85, rotate: -10 }}
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                  >
                    {/* Cute Red Ink Stamp mimicking traditional approval stamp */}
                    <div className="w-10 h-10 rounded-full border-3 border-red-500/80 border-dashed flex items-center justify-center text-red-500/80 text-[10px] uppercase font-black tracking-tighter transform bg-white/30 backdrop-blur-3xs shadow-3xs">
                      참잘했어요
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual stamping action */}
      <div className="text-center">
        {!hasStampedToday ? (
          <button
            id="btn-manual-stamp"
            onClick={handleManualStamp}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer text-sm md:text-base flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            오늘의 의지 다지기! 스탬프 쾅 찍기
          </button>
        ) : (
          <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-sm font-semibold p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            오늘의 두뇌 훈련 도장을 이미 찍었습니다! 내일 또 오세요!
          </div>
        )}
      </div>
    </div>
  );
}
