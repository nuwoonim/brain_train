import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client on the server side securely
// Never expose this key to client-side code!
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// POST Endpoint to generate personalized dynamic cognitive advice for Seniors
app.post('/api/gemini/advice', async (req, res) => {
  try {
    const { userName, mathScore, stroopScore, seqScore, brainAge } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: 'Gemini API key is not configured on the server. Using local fallback.',
      });
    }

    // Determine the weakest area analytically to feed into the prompt
    let weakest = 'MATH';
    let weakestScore = mathScore || 50;
    if ((stroopScore || 50) < weakestScore) {
      weakest = 'STROOP';
      weakestScore = stroopScore || 50;
    }
    if ((seqScore || 50) < weakestScore) {
      weakest = 'SEQUENCE';
      weakestScore = seqScore || 50;
    }

    const promptText = `
      사용자 성함: ${userName || '사용자'} 님
      최근 두뇌 연령: ${brainAge || '미정'}세
      각 세부 점수(100점 만점):
      - 계산 계산 순발력: ${mathScore || 50}점
      - 색상 스트룹 주의 제어력: ${stroopScore || 50}점
      - 순간 격자 순서 작업 기억: ${seqScore || 50}점
      
      가장 주의 깊게 보강이 필요한 영역: [${weakest}] (점수: ${weakestScore}점)
    `;

    const systemInstruction = `
      당신은 치매 예방전문 '두뇌 건강 길잡이' 인공지능 박사입니다.
      신체/뇌 기능 저하가 진행되는 노인분들을 위한 1:1 맞춤형 두뇌 보완 조언 정보를 생성해야 합니다.
      
      [필수 제약사항 및 준수 사항]
      1. 절대로 '처방', '처방전', '환자', '정밀 진단', '치료', '체위 법률' 과 같은 '의료법 위반 소지'가 있는 임상/진료 의학 용어는 절대적으로 사용하지 마십시오. 대신 '두뇌 조언', '생활 건강 추천', '보강행동 지침', '습관 조언' 등 보편적 행동 강화 수단으로 지칭하십시오.
      2. 노안 혹은 글자가 잘 안보이는 어르신들이 전용 스마트폰이나 태블릿 화면에서 쉽게 읽을 수 있도록 장황한 설명성 문장(소설체)은 완전히 제외하고, 핵심 '키워드(Keyword)'와 '핵심 단어'를 전면에 내세운 단순 명확한 형태로 조언 항목을 요약해 주십시오. 
      3. 결과 수치는 다음 JSON 규격을 엄수하여 반환해야 합니다:
         - areaName: 보강이 시급한 두뇌 영역 이름 (예: "수리 판단 피질 및 순간 연산 속도")
         - detail: 왜 이곳을 개선해야 하는지 한두 문장 요약 (글자를 키우고 가시성이 높게 '키워드 위주'로 작성)
         - actions: 하루에 1회 동네 혹은 거실에서 즉시 실천할 수 있는 행동 지침 3개 (문장이 길지 않고, "어깨 돌리기", "동전 하나씩 센 후 뒤집기" 처럼 눈에 보이는 직관인 실천 목록으로 3개 제시)
         - food: 뇌 회로 윤활에 좋은 안전한 식재료 2~3종 및 한줄 요약
      
      이 JSON 형식은 다음과 같은 스키마 형태로 반환되어야 합니다:
      {
        "areaName": "...",
        "detail": "[집중보완 키워드]: ...",
        "actions": ["실천1: ...", "실천2: ...", "실천3: ..."],
        "food": "꿀팁식품: ... [추천사유]"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            areaName: { type: Type.STRING },
            detail: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            food: { type: Type.STRING },
          },
          required: ['areaName', 'detail', 'actions', 'food'],
        },
      },
    });

    const resultText = response.text || '';
    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Failure inside Gemini custom advice API:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate advice.' });
  }
});

// Setup Vite Dev server or Production static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Serving using Vite middleware in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving static production files from dist directory.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`매일매일 두뇌 학당 server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
