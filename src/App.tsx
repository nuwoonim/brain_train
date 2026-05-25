import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Award,
  Calendar as CalendarIcon,
  TrendingUp,
  Settings,
  User,
  Zap,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Home,
  CheckCircle,
  Clock,
  LogOut,
  Dribbble,
} from 'lucide-react';

import { GameType, GameScore, BrainAgeRecord, UserStats, GameState } from './types';
import { audio } from './utils/audio';

// Custom game components
import CalculationGame from './components/games/CalculationGame';
import StroopGame from './components/games/StroopGame';
import SequenceGame from './components/games/SequenceGame';
import CardMatchGame from './components/games/CardMatchGame';
import CountFlashGame from './components/games/CountFlashGame';
import OperatorGame from './components/games/OperatorGame';

// Auxiliary elements
import DoctorSpeech from './components/DoctorSpeech';
import DailyCalendar from './components/DailyCalendar';
import BrainCharts from './components/BrainCharts';

const DOCTOR_TIPS = [
  "매일 아침 10분 동안 계산 20 게임을 즐기는 것만으로도 대뇌 전두엽의 산소 공급량이 20% 이상 향상됩니다!",
  "인지 기능 향상의 최고 꿀팁은 단어의 색깔에 현혹되지 않는 자제력 즉, 스트룹 제어 역량을 키우는 것입니다.",
  "숫자들의 임시 위치를 파악하는 훈련은 기억의 단기 작업대인 '작업 기억 용량(Working Memory)'을 부쩍 넓혀줍니다.",
  "도형 개수를 찰나에 어림잡는 '순간 개수 세기' 훈련은 우뇌의 점적 이미지 처리 신경절을 단련하기에 탁월합니다.",
  "손을 자주 움직이고 뇌를 자극하면, 손상된 뇌 부위를 영리하게 대체하는 '뇌의 신경 가소성 회로'가 새로 생성됩니다.",
  "견과류와 제철 청록 파란 잎 채소들을 드시면서, 매일 출석 스탬프를 가볍게 쿵 쾅 찍으시면 치매는 훌륭히 멀어집니다."
];

export default function App() {
  // Application Data Persistence
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 0,
    lastPlayedDate: '',
    stamps: [],
    brainAgeHistory: [],
    highScores: {},
  });

  const [userName, setUserName] = useState('');
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>('light');

  // AI Advice dynamic state securely powered by server-side Gemini
  const [aiAdvice, setAiAdvice] = useState<{ areaName: string; detail: string; actions: string[]; food: string } | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // Navigation and play state routing
  const [currentView, setCurrentView] = useState<'home' | 'game-select' | 'game-play' | 'brain-test' | 'guide'>('home');
  const [guideTab, setGuideTab] = useState<'manual' | 'advice'>('manual');
  const [activePlayType, setActivePlayType] = useState<GameType | null>(null);

  // Brain Age Test Flow controllers
  const [testStep, setTestStep] = useState<'intro' | 'step1' | 'step2' | 'step3' | 'calculating' | 'result'>('intro');
  const [testResults, setTestResults] = useState<{ [key in GameType]?: { score: number; accuracy: number } }>({});
  const [lastTestedAge, setLastTestedAge] = useState<number | null>(null);

  // Speech bubble text management
  const [doctorSpeechText, setDoctorSpeechText] = useState('매일매일 두뇌 트레이닝 학당에 오신 것을 무궁히 축하드립니다! 반갑습니다.');
  const [doctorExpression, setDoctorExpression] = useState<'neutral' | 'happy' | 'thinking' | 'sad' | 'surprised'>('neutral');

  // Load state on startup
  useEffect(() => {
    const cachedStats = localStorage.getItem('CHIMAE_PREVENTION_STATS');
    const cachedName = localStorage.getItem('CHIMAE_PREVENTION_NAME');

    if (cachedStats) {
      setUserStats(JSON.parse(cachedStats));
    }
    if (cachedName) {
      setUserName(cachedName);
      setIsSetupDone(true);
      // Greet experienced user
      const randTip = DOCTOR_TIPS[Math.floor(Math.random() * DOCTOR_TIPS.length)];
      setDoctorSpeechText(`오랜만입니다, ${cachedName}님! 기력 가득하십니까? 오늘의 훈련 한 판 어떠세요? 오늘의 한 마디: "${randTip}"`);
      setDoctorExpression('happy');
    } else {
      // Guide for freshman setup
      setDoctorSpeechText('반갑습니다! 인지 건강 도우미 두뇌 박사입니다. 본인 성함을 대시보드에 작성해 주시면 두뇌 건강 일지를 정성껏 만들어 드릴게요.');
      setDoctorExpression('happy');
    }
  }, []);

  // Save utility
  const saveStats = (updated: UserStats) => {
    setUserStats(updated);
    localStorage.setItem('CHIMAE_PREVENTION_STATS', JSON.stringify(updated));
  };

  // Perform Gemini AI dynamic feedback generation on the server proxy
  const loadAiAdvice = async (customStats?: UserStats) => {
    const statsSource = customStats || userStats;
    if (statsSource.brainAgeHistory.length === 0) return;
    const latestRecord = statsSource.brainAgeHistory[statsSource.brainAgeHistory.length - 1];
    const mathScore = latestRecord.subScores?.[GameType.MATH] ?? 50;
    const stroopScore = latestRecord.subScores?.[GameType.STROOP] ?? 50;
    const seqScore = latestRecord.subScores?.[GameType.SEQUENCE] ?? 50;
    const age = latestRecord.brainAge;

    setIsLoadingAdvice(true);
    try {
      const isCapacitor = window.location.protocol === 'capacitor:' || 
                          (window.location.hostname === 'localhost' && window.location.port === '');
      const baseApiUrl = isCapacitor ? 'http://192.168.0.30:3000' : '';
      const res = await fetch(`${baseApiUrl}/api/gemini/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          mathScore,
          stroopScore,
          seqScore,
          brainAge: age
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAdvice(data);
      } else {
        throw new Error('Fallback required');
      }
    } catch (e) {
      console.log('Gemini API unreachable or key not configured. Using high-quality client fallbacks.', e);
      setAiAdvice(null);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    localStorage.setItem('CHIMAE_PREVENTION_NAME', userName);
    setIsSetupDone(true);
    audio.playCorrect();

    const welcomeMsg = `환영합니다, ${userName}님! 오늘의 연습과 두뇌 정기 연령 테스트를 시작해 건강한 전두엽 피질을 완성해 보아요!`;
    setDoctorSpeechText(welcomeMsg);
    setDoctorExpression('happy');
  };

  // Stamper
  const handleStampToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (userStats.stamps.includes(todayStr)) return;

    let nextStreak = userStats.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (userStats.lastPlayedDate === yesterdayStr) {
      nextStreak += 1;
    } else if (userStats.lastPlayedDate !== todayStr) {
      nextStreak = 1;
    }

    const updated = {
      ...userStats,
      streak: nextStreak,
      lastPlayedDate: todayStr,
      stamps: [...userStats.stamps, todayStr],
    };

    saveStats(updated);
    setDoctorSpeechText(`훌륭합니다! 오늘자 인지 출석 인증 스탬프가 쾅 찍혔습니다. 뇌 신경 세포가 매우 건강하게 움직이고 있어요!`);
    setDoctorExpression('happy');
  };

  // Game complete handler
  const handleGameEnd = (gameType: GameType, data: { score: number; timePlayed: number; isCorrectPercent: number }) => {
    audio.playFanfare();

    // Auto update highscore
    const prevHigh = userStats.highScores[gameType] || 0;
    const nextHigh = Math.max(prevHigh, data.score);

    const todayStr = new Date().toISOString().split('T')[0];
    // Automatically include stamp on playing games too!
    const newStamps = userStats.stamps.includes(todayStr)
      ? userStats.stamps
      : [...userStats.stamps, todayStr];

    const updated: UserStats = {
      ...userStats,
      stamps: newStamps,
      lastPlayedDate: todayStr,
      streak: userStats.lastPlayedDate === todayStr ? userStats.streak : Math.max(1, userStats.streak),
      highScores: {
        ...userStats.highScores,
        [gameType]: nextHigh,
      },
    };

    saveStats(updated);

    // Dr Kawishima comment summary
    let doctorComment = '';
    if (data.isCorrectPercent >= 90) {
      doctorComment = `놀랍습니다! 정답률 ${data.isCorrectPercent}%의 가속 노련미! 전두엽 연합 전선이 물 흐르듯 가동되고 있군요! 최고 점수 ${data.score}점입니다.`;
      setDoctorExpression('happy');
    } else if (data.isCorrectPercent >= 70) {
      doctorComment = `안정적인 추리력이었습니다! 정답률 ${data.isCorrectPercent}%로 훌륭한 수준입니다. 매일 조금씩 반복하면 반응 시간이 배로 빨라집니다.`;
      setDoctorExpression('neutral');
    } else {
      doctorComment = `연습 게임을 통해 가속을 보태보세요. 정답률 ${data.isCorrectPercent}%도 괜찮은 첫걸음입니다. 치매는 꾸준한 손과 머리 자극으로 반드시 차단됩니다!`;
      setDoctorExpression('thinking');
    }

    setDoctorSpeechText(doctorComment);
    setCurrentView('home');
  };

  // Brain Age Test Flow Sequence
  const startBrainTest = () => {
    audio.playClick();
    setTestStep('intro');
    setTestResults({});
    setCurrentView('brain-test');
    setDoctorSpeechText('두뇌 연령 테스트는 암산 지능, 노이즈 극복력, 순간 공간 기억을 동시에 테스트합니다. 가벼운 마음으로 끝까지 매진해 보세요.');
    setDoctorExpression('happy');
  };

  const handleTestGameEnd = (gameType: GameType, data: { score: number; isCorrectPercent: number }) => {
    setTestResults((prev) => ({
      ...prev,
      [gameType]: { score: data.score, accuracy: data.isCorrectPercent },
    }));

    if (gameType === GameType.MATH) {
      setTestStep('step2');
      setDoctorSpeechText('대단해군요! 잘 마무리하셨습니다. 곧바로 2단계, 글자의 뜻에 방해받지 않고 오직 잉크 색만 맞추는 스트룹 반응 고전 테스트입니다!');
      setDoctorExpression('surprised');
    } else if (gameType === GameType.STROOP) {
      setTestStep('step3');
      setDoctorSpeechText('안정적으로 이탈 주의력을 격퇴했습니다! 마지막 관문인 격자 1부터 순서 터치 기억력 시험입니다. 초강도 초집중력 발휘 요망!');
      setDoctorExpression('thinking');
    } else if (gameType === GameType.SEQUENCE) {
      // Calculate Brain Age
      setTestStep('calculating');
      setDoctorSpeechText('3대 인지 영역 검사가 모두 마감되었습니다. 수집된 속도와 적중률 점수를 토대로 두뇌 연령을 진단하는 중입니다...');
      setDoctorExpression('thinking');

      setTimeout(() => {
        // Average the scores to compute estimated brain age
        // perfect math score 100, stroop 100, sequence 100 -> avg 100
        // mapping formula: Age = 80 - (avg_score/100 * 60)
        // so score 100 gives age 20 (best), score 0 gives age 80 (elderly)
        const calcResults = {
          ...testResults,
          [GameType.SEQUENCE]: { score: data.score, accuracy: data.isCorrectPercent },
        };

        const totalScores =
          (calcResults[GameType.MATH]?.score || 50) +
          (calcResults[GameType.STROOP]?.score || 50) +
          (calcResults[GameType.SEQUENCE]?.score || 50);

        const avgScore = totalScores / 3;
        const calculatedAge = Math.max(20, Math.min(80, Math.round(80 - (avgScore / 100) * 60)));

        const todayStr = new Date().toISOString().split('T')[0];

        const newRecord: BrainAgeRecord = {
          brainAge: calculatedAge,
          testedAt: todayStr,
          subScores: {
            [GameType.MATH]: calcResults[GameType.MATH]?.score || 0,
            [GameType.STROOP]: calcResults[GameType.STROOP]?.score || 0,
            [GameType.SEQUENCE]: calcResults[GameType.SEQUENCE]?.score || 0,
          },
        };

        const updatedHistory = [...userStats.brainAgeHistory, newRecord];

        // Include stamp automatically
        const newStamps = userStats.stamps.includes(todayStr)
          ? userStats.stamps
          : [...userStats.stamps, todayStr];

        const updated: UserStats = {
          ...userStats,
          stamps: newStamps,
          lastPlayedDate: todayStr,
          streak: userStats.lastPlayedDate === todayStr ? userStats.streak : Math.max(1, userStats.streak),
          brainAgeHistory: updatedHistory,
        };

        saveStats(updated);
        setLastTestedAge(calculatedAge);
        setTestStep('result');
        audio.playFanfare();
        loadAiAdvice(updated);

        let ageResponse = `진단이 완성되었습니다! ${userName}님의 오늘자 두뇌 종합 연령은 [${calculatedAge}세]로 성찰되었습니다. `;
        if (calculatedAge <= 30) {
          ageResponse += '세상에나, 2030 영츠 세대 수준의 서슬 퍼런 뇌 회전력입니다! 이 젊은 감각을 그대로 쭉 영위하십시오!';
          setDoctorExpression('happy');
        } else if (calculatedAge <= 50) {
          ageResponse += '아주 중후하고 튼실히 방어 중인 상태입니다! 일일 퀴즈 계산을 추가하시면 금세 20세 명단으로 회귀할 수 있어요.';
          setDoctorExpression('neutral');
        } else {
          ageResponse += '뇌세포 활성도가 침잠된 단계입니다만 안심하세요! 매일 10분만 여기 오시면 눈밭 구르듯 순식간에 젊어집니다!';
          setDoctorExpression('sad');
        }
        setDoctorSpeechText(ageResponse);
      }, 3500);
    }
  };

  // Reset profile
  const handleResetProfile = () => {
    if (confirm('모든 기록과 훈련 달력을 초기화하시겠습니까?')) {
      localStorage.removeItem('CHIMAE_PREVENTION_STATS');
      localStorage.removeItem('CHIMAE_PREVENTION_NAME');
      setUserStats({
        streak: 0,
        lastPlayedDate: '',
        stamps: [],
        brainAgeHistory: [],
        highScores: {},
      });
      setUserName('');
      setIsSetupDone(false);
      setCurrentView('home');
      setDoctorSpeechText('말끔하게 건강 기록부가 비워졌습니다. 새로운 시작을 위해 성함을 작성해주세요!');
      setDoctorExpression('neutral');
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex justify-center py-6 px-3 sm:px-4 md:py-10 transition-colors">
      
      {/* Handheld Device frame style container */}
      <div id="device-screen-frame" className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border-6 border-slate-700 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden relative min-h-[780px]">
        
        {/* Hardware Status bar detail */}
        <div id="hardware-status-bar" className="bg-slate-700 dark:bg-zinc-800 text-slate-300 text-[10px] py-1 px-4 flex justify-between items-center font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-white">COGNITIVE CARE V1</span>
          </div>
          <div className="text-[10px] text-slate-100 flex items-center gap-2">
            <span>{new Date().toISOString().split('T')[0]} 오늘</span>
            <span className="bg-indigo-600 px-1 py-0.2 rounded font-black text-white text-[9px]">SOLO</span>
          </div>
        </div>

        {/* Global Nav Header */}
        <header id="app-main-header" className="bg-gradient-to-r from-indigo-650 to-indigo-800 dark:from-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 py-3.5 flex justify-between items-center bg-indigo-900 text-white">
          <button
            id="logo-brand-btn"
            onClick={() => {
              audio.playClick();
              setCurrentView('home');
            }}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-400/30">
              <Brain className="w-4.5 h-4.5 fill-rose-400 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-md font-black tracking-tight leading-none text-white">매일매일 두뇌 학당</h1>
              <p className="text-[9px] text-indigo-200 font-semibold leading-none mt-1">Nintendo Style 두뇌 트레이닝 교실</p>
            </div>
          </button>

          {/* Setup / Reset in action menu */}
          {isSetupDone && (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-nav-guide"
                onClick={() => {
                  audio.playClick();
                  setCurrentView('guide');
                  setDoctorSpeechText('안내소에 오셨군요! 매일 훈련은 뇌 혈류를 청량하게 자극하고 두뇌 연령 검사는 당신의 노화 방지 척도를 알려줍니다.');
                  setDoctorExpression('happy');
                }}
                className={`p-1.5 rounded-lg hover:bg-indigo-800 transition text-slate-200 hover:text-white cursor-pointer ${currentView === 'guide' ? 'bg-indigo-950 font-bold' : ''}`}
                title="설명책"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              
              <button
                id="btn-nav-reset"
                onClick={handleResetProfile}
                className="p-1.5 rounded-lg hover:bg-rose-900/40 text-rose-300 transition cursor-pointer"
                title="기록부 비우기"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main id="app-scrollable-content" className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-4">
          
          {/* Section A: Greet Character is shown at top of Home and informational areas */}
          {currentView !== 'game-play' && (testStep === 'intro' || testStep === 'result' || currentView === 'home' || currentView === 'guide' || !isSetupDone) && (
            <div className="mb-4">
              <DoctorSpeech
                text={doctorSpeechText}
                expression={doctorExpression}
              />
            </div>
          )}

          {/* View Routing */}

          {/* 1. FRESHMAN PROFILE SETUP */}
          {!isSetupDone ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">두뇌 영리 일지 만들기</h3>
                <p className="text-xs text-slate-500 mt-1">치매 걱정 없는 삶을 위해 먼저 성함을 알려주세요</p>
              </div>

              <form onSubmit={handleSetup} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">사용자의 존함 / 닉네임</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 김덕수 회장님, 고순자 할머니"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-zinc-800 focus:border-indigo-500 font-medium text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 outline-none text-base shadow-3xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer mt-2"
                >
                  기록 작성을 보태고 시작하기
                </button>
              </form>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* 2. MAIN RESOUNDING DASHBOARD */}
              {currentView === 'home' && (
                <motion.div
                  key="home-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Big Brain Age Test Action Banner */}
                  <div className="bg-gradient-to-br from-indigo-550 via-indigo-600 to-indigo-800 text-white rounded-2xl p-5 shadow-md border-2 border-indigo-400 relative overflow-hidden bg-indigo-650">
                    <div className="absolute top-1 right-1 opacity-10">
                      <Brain className="w-40 h-40" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div>
                        <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">정기 검진</span>
                        <h2 className="text-2xl font-black mt-1 leading-tight font-sans text-white">전두엽 두뇌 연령 테스트</h2>
                        <p className="text-xs text-indigo-100 mt-1 max-w-[280px] leading-relaxed">
                          3대 핵심 인지 검사를 빠르게 완료하여 실시간 두뇌 건강 성적표(두뇌 연령)를 갱신하세요!
                        </p>
                      </div>

                      <div className="mt-4 pt-1.5 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-mono font-bold text-indigo-200 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          소요 시간: 약 3분
                        </span>

                        <button
                          id="btn-trigger-brainrange-test"
                          onClick={startBrainTest}
                          className="bg-white hover:bg-slate-50 text-indigo-600 dark:text-zinc-950 px-5 py-2 rounded-xl text-sm font-black shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-indigo-605" />
                          진단 시작하기
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stamp & Streak Row */}
                  <DailyCalendar
                    stamps={userStats.stamps}
                    onStampToday={handleStampToday}
                    streak={userStats.streak}
                  />

                  {/* Individual Game Rooms */}
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 mb-3">
                      <BookOpen className="w-5 h-5 text-indigo-505" />
                      매일매일 두뇌 트레이닝 선택과목
                    </h3>

                    <div id="game-selection-grid" className="grid grid-cols-2 gap-3">
                      {[
                        { type: GameType.MATH, label: '계산 트레이닝 20', emoji: '🧮', desc: '더하기/빼기 속사로 계산 능력과 전두엽 가사 활성화!' },
                        { type: GameType.STROOP, label: '색상 스트룹 제어', emoji: '🎨', desc: '이탈 노이즈를 제어하여 시지각 억제 능력 강화!' },
                        { type: GameType.SEQUENCE, label: '순간 공간 순서터치', emoji: '🔢', desc: '찰나에 가려진 숫자 위치를 암기해 작업기억 확장!' },
                        { type: GameType.MEMORY, label: '카드 매칭 암기력', emoji: '🃏', desc: '쌍둥이 카드를 거뜬히 맞추며 기억 단기창고 연장!' },
                        { type: GameType.FLASH, label: '순간 개수 직관세기', emoji: '💫', desc: '시각 이미지의 사물을 한번에 파악해 우뇌 단련!' },
                        { type: GameType.OPERATOR, label: '연산 기호 맞추기', emoji: '➕', desc: '숫자와 정답을 보고 올바른 기호(+, -)를 채워 넣는 사칙연산 추리 훈련!' },
                      ].map((game) => {
                        const score = userStats.highScores[game.type];
                        return (
                          <button
                            key={game.type}
                            id={`btn-play-game-${game.type.toLowerCase()}`}
                            onClick={() => {
                              audio.playClick();
                              setActivePlayType(game.type);
                              setCurrentView('game-play');
                            }}
                            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col text-left hover:border-indigo-400 dark:hover:border-indigo-605 transition cursor-pointer relative shadow-3xs"
                          >
                            <span className="text-2xl mb-1.5 block">{game.emoji}</span>
                            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">{game.type}</span>
                            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 mt-0.5">{game.label}</h4>
                            <p className="text-[11px] text-slate-400 mt-1 flex-1 leading-normal">{game.desc}</p>
                            
                            <div className="mt-2.5 pt-2 border-t border-slate-50 dark:border-zinc-800/80 flex justify-between items-center w-full">
                              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black">PLAY</span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">
                                최고 {score !== undefined ? `${score}점` : '없음'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress Charts */}
                  <BrainCharts
                    history={userStats.brainAgeHistory}
                    highScores={userStats.highScores}
                  />
                </motion.div>
              )}

              {/* 3. GAME RUNTIME CONTAINER */}
              {currentView === 'game-play' && activePlayType && (
                <motion.div
                  key="playing-game"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1"
                >
                  {activePlayType === GameType.MATH && (
                    <CalculationGame
                      onFinish={(data) => handleGameEnd(GameType.MATH, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}
                  {activePlayType === GameType.STROOP && (
                    <StroopGame
                      onFinish={(data) => handleGameEnd(GameType.STROOP, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}
                  {activePlayType === GameType.SEQUENCE && (
                    <SequenceGame
                      onFinish={(data) => handleGameEnd(GameType.SEQUENCE, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}
                  {activePlayType === GameType.MEMORY && (
                    <CardMatchGame
                      onFinish={(data) => handleGameEnd(GameType.MEMORY, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}
                  {activePlayType === GameType.FLASH && (
                    <CountFlashGame
                      onFinish={(data) => handleGameEnd(GameType.FLASH, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}
                  {activePlayType === GameType.OPERATOR && (
                    <OperatorGame
                      onFinish={(data) => handleGameEnd(GameType.OPERATOR, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}
                </motion.div>
              )}

              {/* 4. CLINICAL INTEGRATED TEST CHAIN */}
              {currentView === 'brain-test' && (
                <motion.div
                  key="brain-testing-flow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {testStep === 'intro' && (
                    <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 text-center space-y-4 max-w-sm mx-auto shadow-sm">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto border animate-bounce">
                        <Brain className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">두뇌 종합 검사</h3>
                        <p className="text-xs text-slate-500 mt-1 lines-relaxed">
                          계산 10문제 → 스트룹 10문제 → 순간 공간 순서 기억 5라운드 과정이 쉼표 없이 연결됩니다. 뇌의 최고속 회전을 이끌어 보세요.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="btn-quit-test-early"
                          onClick={() => {
                            audio.playClick();
                            setCurrentView('home');
                          }}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition"
                        >
                          그만두기
                        </button>
                        <button
                          id="btn-confirm-start-chain-test"
                          onClick={() => {
                            audio.playBeep(800, 0.2, 'sine');
                            setTestStep('step1');
                            setDoctorSpeechText('1단계 평가: 10개 수학 계산 순발력 검사입니다. 계산 입력 후 반드시 우하단 종이비행기 전송(Enter) 버튼을 탭하십시오!');
                            setDoctorExpression('happy');
                          }}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition"
                        >
                          검사 개시
                        </button>
                      </div>
                    </div>
                  )}

                  {testStep === 'step1' && (
                    <CalculationGame
                      isTestMode={true}
                      onFinish={(data) => handleTestGameEnd(GameType.MATH, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}

                  {testStep === 'step2' && (
                    <StroopGame
                      isTestMode={true}
                      onFinish={(data) => handleTestGameEnd(GameType.STROOP, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}

                  {testStep === 'step3' && (
                    <SequenceGame
                      isTestMode={true}
                      onFinish={(data) => handleTestGameEnd(GameType.SEQUENCE, data)}
                      onExit={() => {
                        audio.playClick();
                        setCurrentView('home');
                      }}
                    />
                  )}

                  {testStep === 'calculating' && (
                    <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-8 text-center space-y-4 shadow-sm min-h-[300px] flex flex-col justify-center items-center">
                      <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                      <h4 className="text-lg font-bold text-slate-800 dark:text-zinc-150">정확도 및 전두엽 전자기파 추적 중</h4>
                      <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                        {userName || '사용자'} 님의 연령 진단을 위해 전 영역의 밀리초 반응 단차를 채점하고 있습니다...
                      </p>
                    </div>
                  )}

                  {testStep === 'result' && lastTestedAge !== null && (
                    <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-500 rounded-2xl p-6 text-center space-y-6 shadow-md relative overflow-hidden">
                      {/* Ribbon banner */}
                      <div className="absolute top-0 inset-x-0 h-2.5 bg-indigo-500" />
                      
                      <div className="flex flex-col items-center">
                        <Award className="w-12 h-12 text-yellow-500 animate-bounce mb-1" />
                        <span className="text-[10px] text-indigo-500 uppercase font-black tracking-widest mt-1">BRAIN AGE RESULT</span>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-zinc-100">두뇌 종합 진단 성적표</h4>
                      </div>

                      <div className="bg-slate-50 dark:bg-zinc-950/20 p-5 rounded-2xl border flex flex-col items-center shadow-inner max-w-xs mx-auto">
                        <span className="text-xs font-black text-indigo-500 block mb-1">나의 두뇌 연령</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black text-rose-600 dark:text-rose-400">
                            {lastTestedAge}
                          </span>
                          <span className="text-lg font-bold text-slate-500">세</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4 max-w-sm mx-auto">
                        <p className="text-sm text-slate-650 dark:text-zinc-350 font-medium leading-relaxed">
                          귀하의 반응 민첩도와 정답 정확도를 종합하여 측정되었습니다.<br />
                          아래 '맞춤형 조언 보기'를 클릭하시면 스마트 뇌 조언을 받아보실 수 있습니다.
                        </p>
                      </div>

                      <div className="flex gap-2 max-w-xs mx-auto pt-2">
                        <button
                          type="button"
                          id="btn-return-from-test"
                          onClick={() => {
                            audio.playClick();
                            setTestStep('intro');
                            setCurrentView('home');
                          }}
                          className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-705 dark:text-slate-200 rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          대시보드로
                        </button>
                        <button
                          type="button"
                          id="btn-go-to-guide-from-test"
                          onClick={() => {
                            audio.playClick();
                            setTestStep('intro');
                            setCurrentView('guide');
                            setGuideTab('advice');
                            loadAiAdvice();
                          }}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                        >
                          맞춤형 조언 보기
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REST_OF_GUIDE_INJECTION_POINT */}
                </motion.div>
              )}

              {/* 5. GUIDE VIEW WITH ADVICE AND PREVENTIONS */}
              {currentView === 'guide' && (
                <motion.div
                  key="guide-contents-flow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 animate-in fade-in"
                >
                  <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-lg font-black text-indigo-650 flex items-center gap-1.5 dark:text-indigo-400 font-sans">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        안내 및 맞춤형 뇌 조언
                      </h3>
                    </div>

                    {/* Tab Selector Buttons */}
                  <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      id="tab-guide-manual"
                      onClick={() => {
                        audio.playClick();
                        setGuideTab('manual');
                      }}
                      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        guideTab === 'manual'
                          ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-3xs'
                          : 'text-slate-500 dark:text-zinc-400'
                      }`}
                    >
                      📖 일반 설명서
                    </button>
                    <button
                      type="button"
                      id="tab-guide-advice"
                      onClick={() => {
                        audio.playClick();
                        setGuideTab('advice');
                        loadAiAdvice();
                      }}
                      className={`flex-1 py-1 px-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        guideTab === 'advice'
                          ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-3xs'
                          : 'text-slate-500 dark:text-zinc-400'
                      }`}
                    >
                      🧠 1:1 두뇌 맞춤 조언
                    </button>
                  </div>

                  {guideTab === 'manual' && (
                    <div className="space-y-3.5 text-xs font-sans font-medium text-slate-600 dark:text-zinc-350 leading-relaxed">
                      <div className="space-y-1">
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 block text-sm">💡 왜 전두엽을 일깨워야 할까요?</h4>
                        <p>인지 능력 저하(치매)는 이성과 추리를 담당하는 대뇌 전두엽의 기능 쇠퇴에서 급속히 유발됩니다. 단순 계산, 순간 집중, 노이즈 제어 훈련은 전두엽 피질 혈류량을 극적으로 늘려 신경 퇴화를 능동적으로 막아줍니다.</p>
                      </div>

                      <div className="space-y-1 pt-2">
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 block text-sm">🗓️ 달력 스탬프의 의미</h4>
                        <p>지속성과 동기부여는 뇌 근육 단련의 핵심입니다. 하루에 1회는 무조건 달력 스탬프를 찍는 습관을 기르세요! 연속 스트릭(Streak)을 늘려가며 자존감을 높이실 수 있습니다.</p>
                      </div>

                      <div className="space-y-1 pt-2">
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 block text-sm">🏅 최고 점수 명예의 전당</h4>
                        <p>오답률 and 반응 가속도를 곱 연산하여 각 게임마다 최고 점수(최대 100점)가 누적됩니다. 20세 명품 두뇌를 향해 끊임없이 한계에 도전해보세요!</p>
                      </div>
                    </div>
                  )}

                  {guideTab === 'advice' && userStats.brainAgeHistory.length === 0 && (
                    <div className="text-center py-6 px-3 bg-indigo-50/40 dark:bg-indigo-950/15 rounded-2xl border border-indigo-100 dark:border-indigo-950/40 space-y-3">
                      <span className="text-3xl block">🧠</span>
                      <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300">종합 검사 기록이 필요합니다</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                        {userName || '사용자'} 님의 두뇌 연령 성적표가 아직 존재하지 않습니다. 메인 대시보드에서 <strong>[두뇌 연령 테스트]</strong>를 1회 완료하시면, 사용자의 인지 반응 속도를 분석하여 1:1 맞춤 식단 및 취약 기력 보강행동 지침을 자동으로 생성해 드립니다!
                      </p>
                      <button
                        type="button"
                        id="btn-trigger-test-from-guide"
                        onClick={() => {
                          audio.playClick();
                          startBrainTest();
                        }}
                        className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition inline-block"
                      >
                        지금 바로 테스트 시작하기
                      </button>
                    </div>
                  )}

                  {guideTab === 'advice' && userStats.brainAgeHistory.length > 0 && (
                    isLoadingAdvice ? (
                      <div className="text-center py-12 space-y-4">
                        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                        <h4 className="text-lg font-black text-slate-800 dark:text-zinc-100">AI 두뇌 조언 작성 중...</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">어르신의 인지 성과 비율을 토대로 맞춤 조언을 정성껏 작성 중입니다. 조금만 가만히 기다려 주십시오!</p>
                      </div>
                    ) : (() => {
                      const latestRecord = userStats.brainAgeHistory[userStats.brainAgeHistory.length - 1];
                      const mathScore = latestRecord.subScores?.[GameType.MATH] ?? 50;
                      const stroopScore = latestRecord.subScores?.[GameType.STROOP] ?? 50;
                      const seqScore = latestRecord.subScores?.[GameType.SEQUENCE] ?? 50;

                      let weakestArea = 'MATH';
                      let minScore = mathScore;
                      if (stroopScore < minScore) {
                        weakestArea = 'STROOP';
                        minScore = stroopScore;
                      }
                      if (seqScore < minScore) {
                        weakestArea = 'SEQUENCE';
                        minScore = seqScore;
                      }

                      // Advice dynamic configuration
                      const fallbackConfig = weakestArea === 'MATH' ? {
                        areaName: '수리 판단 피질 및 순간 연산 속도',
                        detail: '[집중보완 키워드]: 수리 사칙연산 제어 속도 저조. 전두엽 산소 보완이 시급히 필요합니다.',
                        actions: [
                          '실천1: [거꾸로 외우기] 구구단을 뒤에서부터 거꾸로 외우기(9단부터 2단까지)를 아침에 크게 실행합니다.',
                          '실천2: [상상 계산] 물건을 지불하기 직전에, 점원에게 받을 동전 한 개까지 먼저 머리로 연산해봅니다.',
                          '실천3: [훈련 반복] 일주일에 3회 전종목 완료하여 손가락 터치 신경 전달 빈도를 높여줍니다.'
                        ],
                        food: '꿀팁식품: 국산 [달걀 노른자] 및 고소한 [호두/땅콩] (대뇌 피질 에너지 물질 전달 가속화)'
                      } : weakestArea === 'STROOP' ? {
                        areaName: '뇌 자제력 제어 및 노이즈 극복 주의력',
                        detail: '[집중보완 키워드]: 정보 혼선 격퇴 필요. 주변 시끄러운 노이즈를 스스로 방어하는 단련 단계입니다.',
                        actions: [
                          '실천1: [바탕색 인지] 공원이나 시장에서 한글 간판을 볼 때 글씨는 무시하고 [간판 바탕색]만 연속으로 이름 부르기.',
                          '실천2: [거꾸로 필사] 신문이나 책에서 마음에 드는 문장을 하나 골라, 끝 자리부터 한 자씩 거꾸로 노트에 기록해보기.',
                          '실천3: [예산 품목] 장보기 바로 전 사고자 하는 실재료 딱 세 개 장보기 수첩에 적고 그 외 충동구매는 완벽 차단하기.'
                        ],
                        food: '꿀팁식품: 푸른 [시금치] 겉절이, 꽃 [브로콜리] 생식 (전두엽 세포막 산화를 차단하는 녹청 야채 구성)'
                      } : {
                        areaName: '작업 기억 단기 창고 용량 (Working Memory)',
                        detail: '[집중보완 키워드]: 정보 단기 임시 저장판 복원 요구. 일상 속 즐거운 건망 증세에 힘찬 예방막을 세웁니다.',
                        actions: [
                          '실천1: [번호 외우기] 친한 친척 전화번호 3개를 한 음절씩 불러보고, 빈 화면에 손가락으로 가상 다이얼링 해보기.',
                          '실천2: [반추 회고] 밤 조용히 자리에 누워, 오늘 점심식사 반찬 구성 혹은 오후 발자취를 역순으로 가만히 그리기.',
                          '실천3: [촉각 탐색] 서랍의 보관 물품들을 보지 않은 채, 오직 촉감만으로 가려내어 찾아보는 촉각 두뇌 자극.'
                        ],
                        food: '꿀팁식품: 생 [들기름] 한 개 생식, [등푸른 생선/연어] (단기 기억 세포들의 윤활유 역할 보강)'
                      };

                      const displayConfig = aiAdvice ? aiAdvice : fallbackConfig;

                      return (
                        <div className="space-y-4">
                          {/* Summary Result Banner */}
                          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border-2 border-indigo-150 dark:border-indigo-900/40 text-left">
                            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">LOCALIZED COGNITIVE BRAIN REPORT</div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-zinc-150">
                              {userName || '사용자'} 님의 1:1 맞춤형 두뇌 조언
                            </h4>
                            <p className="text-base text-slate-650 dark:text-zinc-300 mt-1.5 leading-relaxed font-semibold">
                              종합 검진일(<strong>{latestRecord.testedAt}</strong>) 기준으로 두뇌 연령은 <strong className="text-rose-600 dark:text-rose-400 text-lg">{latestRecord.brainAge}세</strong> 수준으로 검정되었으며, 현재 가장 집중적으로 기름칠해야 할 핵심 분야는 <strong className="text-indigo-600 dark:text-indigo-400 text-lg">[{displayConfig.areaName}]</strong>으로 분류되었습니다.
                            </p>
                          </div>

                          {/* Analysis Detail */}
                          <div className="space-y-1.5 text-left bg-slate-50 dark:bg-zinc-950/20 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-inner">
                            <h5 className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg flex items-center gap-1 border-b pb-1">
                              <span>🚨</span> 인지 징후
                            </h5>
                            <p className="text-base font-bold text-slate-700 dark:text-zinc-200 leading-normal bg-amber-50/30 dark:bg-amber-950/10 p-2.5 rounded border border-amber-100/50">
                              {displayConfig.detail}
                            </p>
                          </div>

                          {/* Action Steps */}
                          <div className="space-y-2 text-left bg-emerald-50/30 dark:bg-zinc-900/40 p-4 rounded-xl border border-emerald-100/40 dark:border-zinc-800 shadow-tiny">
                            <h5 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-lg flex items-center gap-1 border-b pb-1">
                              <span>🌱</span> 치매 예방 생활 실천 지침 (Daily Actions)
                            </h5>
                            <ul className="space-y-2 mt-2">
                              {displayConfig.actions.map((act, i) => (
                                <li key={i} className="flex gap-2 items-start">
                                  <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="text-base font-bold text-slate-700 dark:text-zinc-200 leading-relaxed">
                                    {act}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Food Recommendations */}
                          <div className="space-y-1.5 text-left bg-amber-50/30 dark:bg-zinc-900/40 p-4 rounded-xl border border-amber-100 dark:border-zinc-800">
                            <h5 className="font-extrabold text-amber-600 dark:text-amber-400 text-lg flex items-center gap-1 border-b pb-1">
                              <span>🥗</span> 추천 두뇌 보양 식단
                            </h5>
                            <p className="text-base font-black text-rose-800 dark:text-amber-300 leading-normal bg-amber-100/10 p-2 rounded">
                              {displayConfig.food}
                            </p>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  <button
                    id="btn-return-lobby"
                    onClick={() => {
                      audio.playClick();
                      setCurrentView('home');
                    }}
                    className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-black cursor-pointer transition text-center"
                  >
                    확인완료! 대시보드로 돌아가기
                  </button>
                </div>
              </motion.div>
            )}

</AnimatePresence>
          )}

        </main>

        {/* Universal Footer Logo detail */}
        <footer id="brand-copyright" className="bg-slate-50 dark:bg-zinc-950/40 border-t py-3 text-center text-[10px] text-slate-400 font-sans tracking-wide">
          <span>매일매일 두뇌 학당 © 2026. Designed for Senior Protection.</span>
        </footer>
      </div>

    </div>
  );
}
