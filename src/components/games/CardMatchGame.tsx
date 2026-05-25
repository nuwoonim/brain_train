import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, RefreshCw, Award } from 'lucide-react';
import { audio } from '../../utils/audio';

interface CardMatchGameProps {
  onFinish: (scoreObj: { score: number; timePlayed: number; isCorrectPercent: number }) => void;
  onExit: () => void;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SHUFFLED_SYMBOLS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍍'];

export default function CardMatchGame({ onFinish, onExit }: CardMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Generate 12 cards from 6 pairs of symbols
    const pairs = [...SHUFFLED_SYMBOLS, ...SHUFFLED_SYMBOLS];
    // Shuffle the pairs
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    const cardList: Card[] = pairs.map((sym, index) => ({
      id: index,
      symbol: sym,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(cardList);
  }, []);

  // Timer
  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isDone]);

  const handleCardClick = (cardId: number) => {
    if (isDone || selectedCards.length >= 2) return;

    // Check if card is already flipped or matched
    const clickedCard = cards.find((c) => c.id === cardId);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Play click sound
    audio.playBeep(523.25, 0.06, 'sine'); // C5 sound

    // Flip card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    const nextSelection = [...selectedCards, cardId];
    setSelectedCards(nextSelection);

    if (nextSelection.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstId, secondId] = nextSelection;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setSelectedCards([]);
          audio.playCorrect();

          // Check if all are matched
          const isAllMatched = cards.every(
            (c) => (c.id === firstId || c.id === secondId ? true : c.isMatched)
          );

          if (isAllMatched) {
            setIsDone(true);
            const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            // Calculate accuracy based on how few moves were wasted
            const ratio = Math.min(1.0, 6 / moves);
            const accuracy = Math.round(ratio * 100);
            const finalScore = Math.max(15, Math.round(80 * ratio + Math.max(0, 100 - finalTime) * 0.2));

            setTimeout(() => {
              onFinish({
                score: finalScore,
                timePlayed: finalTime,
                isCorrectPercent: accuracy,
              });
            }, 800);
          }
        }, 300);
      } else {
        // No match - Flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
          audio.playWrong();
        }, 1100);
      }
    }
  };

  return (
    <div id="card-match-game-container" className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 p-4">
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-zinc-900 px-4 py-2 border rounded-xl shadow-xs">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block">카드로 기억력 뇌 훈련</span>
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">
            뒤집은 횟수: {moves}회
          </span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {elapsedTime}초
        </div>
      </div>

      {/* Grid Canvas */}
      <div id="card-grid-container" className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm mb-4 min-h-[300px]">
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs md:max-w-md">
          {cards.map((card) => {
            const isShown = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.id}
                id={`memory-card-${card.id}`}
                onClick={() => handleCardClick(card.id)}
                className="relative aspect-[3/4] cursor-pointer"
              >
                <AnimatePresence mode="wait">
                  {!isShown ? (
                    <motion.div
                      key="back"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:brightness-105 active:scale-95 border-2 border-indigo-200 shadow-md rounded-xl flex items-center justify-center text-white"
                    >
                      {/* Back Pattern */}
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-300 opacity-60 flex items-center justify-center">
                        <span className="text-xs font-black">?</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="front"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`absolute inset-0 border-2 rounded-xl flex items-center justify-center text-3xl md:text-4xl shadow-sm ${
                        card.isMatched
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white border-indigo-400'
                      }`}
                    >
                      {card.symbol}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Completion Screen Overlay */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center gap-3 rounded-2xl"
            >
              <Award className="w-12 h-12 text-yellow-500 animate-bounce" />
              <p className="text-xl font-black text-slate-800 dark:text-zinc-100">짝을 모두 맞췄습니다!</p>
              <p className="text-sm text-slate-500">통합 결과창으로 이동 중...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Quit Footer */}
      <div className="flex justify-center max-w-sm mx-auto w-full">
        <button
          id="btn-quit-match-game"
          onClick={onExit}
          className="text-center py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
        >
          트레이닝 중단하기
        </button>
      </div>
    </div>
  );
}
