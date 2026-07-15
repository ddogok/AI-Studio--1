import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  let aiClient: GoogleGenAI | null = null;
  function getGenAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API endpoint for analyzing meeting minutes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { meetingText, modelName } = req.body;
      if (!meetingText) {
        res.status(400).json({ error: "meetingText is required" });
        return;
      }

      // Default to gemini-3.5-flash as per skill.md recommendations
      const model = modelName || "gemini-3.5-flash";

      const ai = getGenAI();

      const prompt = `당신은 비즈니스 및 정보 보안 분야의 실무자용 전문 AI 비서입니다.
제공된 주간 회의록 텍스트를 정밀 분석하여, 작성자 본인('나' 또는 '본인' 또는 회의록에 언급된 담당자 중 사용자 자신에 해당하는 역할)이 처리해야 할 업무를 판별하십시오.

[분석 가이드라인]
1. 회의록 구조화 요약: '핵심 안건', '결정사항', '논의사항'의 구조를 갖춰 마크다운 형식으로 작성해주십시오.
2. 나의 액션 아이템 도출: 회의록에서 본인('나' 또는 '홍길동 사원' 또는 '본인')의 발언이나 지시사항을 바탕으로 본인이 수행해야 할 액션 아이템을 도출하십시오.
   각 액션 아이템은 반드시 "무엇을", "언제까지", "왜(회의록 상 객관적 근거)" 형태가 포함되도록 정밀하게 구성해주십시오.
3. 논리적 단계별 판단 근거 (Reasoning): 액션 아이템을 어떤 문맥이나 발언을 근거로 도출했는지 단계별 사고 과정을 상세히 설명해주십시오.
4. Gmail 임시보관용 메일 초안: 고객사의 보안 담당자 혹은 유관 부서 담당자에게 공유할 결과 메일 초안을 작성해주십시오. 비즈니스 톤앤매너를 지켜 정중하고 군더더기 없는 '간결형'으로 정밀하게 기재해주십시오.

[출력 데이터 규격]
반드시 지정된 JSON 스키마를 만족하는 구조화된 데이터를 출력해야 합니다.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          { text: prompt },
          { text: `이하는 분석할 회의록 텍스트입니다:\n\n${meetingText}` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "회의록의 핵심 안건, 결정사항, 논의사항을 요약한 마크다운 문자열"
              },
              reasoning: {
                type: Type.STRING,
                description: "회의록 내용에서 본인의 액션 아이템을 논리적으로 도출해 낸 단계별 판단 근거 및 생각 과정"
              },
              action_items: {
                type: Type.STRING,
                description: "도출된 본인의 액션 아이템 리스트 (각 항목별로 무엇을, 언제까지, 왜 해야 하는지 명확히 한글 마크다운 번호/글머리 기호 리스트로 작성)"
              },
              email_subject: {
                type: Type.STRING,
                description: "수신자에게 보낼 정중하고 직관적인 메일 제목"
              },
              email_body: {
                type: Type.STRING,
                description: "정중하고 깔끔한 간결형 비즈니스 이메일 본문 내용"
              }
            },
            required: ["summary", "reasoning", "action_items", "email_subject", "email_body"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No text returned from Gemini API");
      }

      const parsed = JSON.parse(responseText.trim());
      res.json(parsed);
    } catch (err: any) {
      console.error("Analysis API Error:", err);
      res.status(500).json({ error: err.message || "An error occurred during analysis" });
    }
  });

  // Serve static/vite files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
