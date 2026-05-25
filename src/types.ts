export enum GameType {
  MATH = 'MATH',          // 계산 20 (Speed Arithmetic)
  STROOP = 'STROOP',      // 색상 스트룹 (Stroop Color Match)
  SEQUENCE = 'SEQUENCE',  // 순서 터치 (Ascending Steps)
  MEMORY = 'MEMORY',      // 카드 뒤집기 (Short-term Storage)
  FLASH = 'FLASH',        // 순간 개수 세기 (Flash Visual Estimation)
  OPERATOR = 'OPERATOR',  // 연산 부호 맞추기 (Operator Match Game)
}

export interface GameScore {
  gameType: GameType;
  score: number;       // Accuracy or speed score
  timePlayed: number;  // Seconds
  timestamp: string;   // ISO Date
  isCorrectPercent?: number;
}

export interface BrainAgeRecord {
  brainAge: number;
  testedAt: string; // YYYY-MM-DD
  subScores: {
    [key in GameType]?: number;
  };
}

export interface UserStats {
  streak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  stamps: string[];      // Array of date strings: YYYY-MM-DD
  brainAgeHistory: BrainAgeRecord[];
  highScores: {
    [key in GameType]?: number;
  };
}

export interface GameState {
  currentView: 'home' | 'game-select' | 'game-play' | 'brain-test' | 'stats' | 'guide';
  playingGameType?: GameType;
}
