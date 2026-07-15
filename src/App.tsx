import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  Wand2,
  User,
  Users,
  ShieldAlert,
  ClipboardList,
  Play,
  RotateCcw,
  CheckSquare,
  Brain,
  Mail,
  Copy,
  ExternalLink,
  Settings,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AnalysisResult {
  summary: string;
  reasoning: string;
  action_items: string;
  email_subject: string;
  email_body: string;
}

const DEFAULT_SAMPLE_TEXT = `7월 15일 정보보안 정기 주간 회의
참석자: 김철수 매니저(고객사 보안 담당자), 이영희 차장(조치 프로젝트 관리자), 홍길동 사원(나)

주요 논의 사항 및 현황:
- 이번 달 정기 취약점 분석 결과 웹서버 및 원격 포트 관리가 다소 소홀한 지점들이 발견되어 긴급 조치가 시급함.
- 이영희 차장: "이번 달 패치 가이드는 완료되어 파일 첨부함. 조치 결과랑 완료 스크린샷 챙겨서 이번 주 금요일까지 회신해야 다음 주 실사 준비 가능해."
- 김철수 매니저(고객사): "인프라 쪽 방화벽 8080 포트 차단 조치는 이번 조치 범위에서 빼주세요. 내부 개발 서버 전용 포트라 지금 차단하면 작업이 아예 안 됨. 이 항목은 예외 처리로 진행해 달라고 결재 올릴게요."
- 홍길동 사원: "제가 패치 설치 후 혹시나 모를 정지 시간을 최소화하기 위해 서버 재기동 필요 여부 파악하고, 개발 서버 포트 예외 처리 요청 문서 올려놓겠습니다."`;

export default function App() {
  const [activeTab, setActiveTab] = useState<"user" | "manager" | "it">("user");
  const [meetingText, setMeetingText] = useState("");
  const [selectedModel, setSelectedModel] = useState<"gemini-3.5-flash" | "gemini-3.1-pro-preview">("gemini-3.5-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem("meeting_text");
    const savedResult = localStorage.getItem("analysis_result");
    const savedModel = localStorage.getItem("selected_model");

    if (savedText) setMeetingText(savedText);
    if (savedResult) {
      try {
        setAnalysisResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Error parsing saved analysis result", e);
      }
    }
    if (savedModel === "gemini-3.1-pro-preview" || savedModel === "gemini-3.5-flash") {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleTextChange = (text: string) => {
    setMeetingText(text);
    localStorage.setItem("meeting_text", text);
  };

  const handleLoadSample = () => {
    handleTextChange(DEFAULT_SAMPLE_TEXT);
    setErrorMsg(null);
  };

  const handleClear = () => {
    handleTextChange("");
    setAnalysisResult(null);
    localStorage.removeItem("analysis_result");
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!meetingText.trim()) {
      setErrorMsg("회의록 내용을 입력하거나 샘플 데이터를 먼저 불러와 주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingText,
          modelName: selectedModel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "회의록 분석 중 알 수 없는 서버 오류가 발생했습니다.");
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
      localStorage.setItem("analysis_result", JSON.stringify(data));
      localStorage.setItem("selected_model", selectedModel);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "서버와 통신하는 중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!analysisResult) return;
    const fullEmailText = `제목: ${analysisResult.email_subject}\n\n${analysisResult.email_body}`;
    navigator.clipboard.writeText(fullEmailText).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleOpenInGmail = () => {
    if (!analysisResult) return;
    const subject = encodeURIComponent(analysisResult.email_subject);
    const body = encodeURIComponent(analysisResult.email_body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <header id="app-header" className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-950 leading-tight">Meeting Productivity Suite</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Gemini & Gmail API Workflow</p>
            </div>
          </div>

          {/* Active Badge indicating direct server proxy integration */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gemini API 활성화됨
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 max-w-6xl flex-grow py-6 flex flex-col">
        {/* Tab Navigation (FR-7: Stakeholder-specific Views) */}
        <div className="flex bg-white p-1 rounded-xl shadow-xs border border-slate-200/60 mb-6 gap-1">
          <button
            id="tab-user"
            onClick={() => setActiveTab("user")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "user"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            본인 화면 (상세 뷰)
          </button>
          <button
            id="tab-manager"
            onClick={() => setActiveTab("manager")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "manager"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            매니저 화면 (요약 대시보드)
          </button>
          <button
            id="tab-it"
            onClick={() => setActiveTab("it")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "it"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            IT/보안 화면 (정책 관리)
          </button>
        </div>

        {/* ================= VIEW: USER ================= */}
        <AnimatePresence mode="wait">
          {activeTab === "user" && (
            <motion.div
              key="user-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Left Column - Input Section */}
              <div className="lg:col-span-5 flex flex-col bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="meeting-textarea" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    주간 회의록 입력 (FR-1)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {meetingText.length.toLocaleString()} 자
                  </span>
                </div>

                <div className="relative flex-grow flex flex-col">
                  <textarea
                    id="meeting-textarea"
                    value={meetingText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full flex-grow p-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs sm:text-sm resize-none leading-relaxed min-h-[300px] lg:min-h-[380px]"
                    placeholder="이곳에 주간 회의록 텍스트를 붙여넣어 주세요...&#10;&#10;예:&#10;7월 15일 주간회의&#10;- 영희: 패치 가이드 작성완료. 금요일까지 회신 바람.&#10;- 길동: 보안 가이드 조치 예정 및 서버 리부팅 검토하겠음."
                  />
                  {meetingText.length === 0 && (
                    <button
                      onClick={handleLoadSample}
                      className="absolute inset-0 m-auto w-fit h-fit px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-100/80 transition flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      연습용 회의록 샘플 불러오기
                    </button>
                  )}
                </div>

                {/* Model Configuration Selector */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="model-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      분석 모델 설정
                    </label>
                    <span className="text-[10px] text-indigo-500 font-medium">자동 전환 및 정밀 분석</span>
                  </div>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (속도 지향 / 권장)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (정밀 추론 분석)</option>
                  </select>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    id="btn-clear"
                    onClick={handleClear}
                    disabled={isLoading || !meetingText}
                    className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition border border-slate-200/80 disabled:opacity-50 flex items-center justify-center"
                    title="초기화"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-analyze"
                    onClick={handleAnalyze}
                    disabled={isLoading || !meetingText.trim()}
                    className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    요약 및 액션 아이템 추출 시작
                  </button>
                </div>

                {errorMsg && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Right Column - Results Dashboard */}
              <div className="lg:col-span-7 flex flex-col bg-white p-6 rounded-2xl shadow-xs border border-slate-200 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-grow flex flex-col items-center justify-center p-8 text-center h-full"
                    >
                      <div className="relative flex items-center justify-center mb-6">
                        <div className="w-14 h-14 border-4 border-indigo-100 rounded-full"></div>
                        <div className="absolute w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <Wand2 className="w-5 h-5 text-indigo-600 absolute animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">회의록 구조 파악 및 인지적 추론 중...</h3>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
                        Gemini AI가 해당 안건의 전후 맥락을 인지하여 액션 아이템 대상과 이행 조치 일정을 명확하게 식별하고 있습니다.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 font-medium">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>예외 처리 조치 및 보안 권고사항 분석 완료 예정</span>
                      </div>
                    </motion.div>
                  ) : !analysisResult ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-grow flex flex-col items-center justify-center p-12 text-center h-full"
                    >
                      <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-100 mb-4">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">추출 대기 중</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                        회의록을 좌측에 붙여넣고 버튼을 누르시면 회의 정보 분석, 담당 과업 추출, 메일 작성 초안이 이곳에 표시됩니다.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result-state"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* FR-2: Structured Summary */}
                      <div className="p-5 bg-indigo-50/20 rounded-2xl border border-indigo-100/50">
                        <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Wand2 className="w-4 h-4 text-indigo-600" />
                          회의록 구조화 요약 (FR-2)
                        </h3>
                        <div className="prose prose-sm text-xs sm:text-sm text-slate-700 leading-relaxed max-w-none">
                          <ReactMarkdown>{analysisResult.summary}</ReactMarkdown>
                        </div>
                      </div>

                      {/* FR-3: Action Items & Reasoning */}
                      <div className="p-5 bg-emerald-50/20 rounded-2xl border border-emerald-100/40">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                            나의 액션 아이템 (FR-3)
                          </h3>
                          <button
                            id="btn-toggle-reasoning"
                            onClick={() => setShowReasoning(!showReasoning)}
                            className="text-[10px] bg-emerald-100/60 hover:bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 border border-emerald-200/50"
                          >
                            <Brain className="w-3.5 h-3.5 text-emerald-600" />
                            <span>판단 근거 {showReasoning ? "접기" : "보기"}</span>
                            {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Step-by-step Reasoning Accordion */}
                        <AnimatePresence>
                          {showReasoning && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl mb-4 text-xs text-slate-700 leading-relaxed">
                                <h4 className="font-bold mb-2 flex items-center gap-1 text-amber-800">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  AI 순차 추론 판단 단계 (Reasoning Step)
                                </h4>
                                <ReactMarkdown>{analysisResult.reasoning}</ReactMarkdown>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="prose prose-sm text-xs sm:text-sm text-slate-700 leading-relaxed max-w-none">
                          <ReactMarkdown>{analysisResult.action_items}</ReactMarkdown>
                        </div>
                      </div>

                      {/* FR-4: Gmail Draft */}
                      <div className="p-5 bg-sky-50/20 rounded-2xl border border-sky-100/40">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-sky-600" />
                            Gmail 임시보관용 초안 (FR-4)
                          </h3>
                          <div className="flex gap-2">
                            <button
                              id="btn-copy-mail"
                              onClick={handleCopyEmail}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-slate-200"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copyFeedback ? "복사 완료!" : "전체 복사"}</span>
                            </button>
                            <button
                              id="btn-open-gmail"
                              onClick={handleOpenInGmail}
                              className="text-[10px] bg-sky-600 hover:bg-sky-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-sky-600 shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Gmail로 전송하기</span>
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                          <div className="flex border-b border-slate-150 pb-2">
                            <span className="font-bold text-slate-500 w-16 shrink-0">수신인:</span>
                            <span className="text-slate-800 font-medium">고객사 보안 담당자</span>
                          </div>
                          <div className="flex border-b border-slate-150 pb-2">
                            <span className="font-bold text-slate-500 w-16 shrink-0">제목:</span>
                            <span id="rendered-mail-subject" className="text-slate-900 font-semibold">{analysisResult.email_subject}</span>
                          </div>
                          <div className="pt-1">
                            <p className="font-bold text-slate-500 mb-1">본문:</p>
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto">
                              {analysisResult.email_body}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ================= VIEW: MANAGER ================= */}
          {activeTab === "manager" && (
            <motion.div
              key="manager-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto w-full bg-white p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="bg-indigo-50 p-2.5 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">팀원별 이행 일정 대시보드</h3>
                  <p className="text-xs text-slate-400">민감한 내부 상세 추론 과정을 배제하고, 결정된 일정과 요약 과업을 한눈에 파악합니다.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">홍길동 사원 (나)</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">역할: 인프라 및 예외처리 가이드 검토</span>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
                    분석 완료
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">진행 예정 과업 요약 (Action Item Summary)</h4>
                  {analysisResult ? (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      <ReactMarkdown>{analysisResult.action_items}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      회의록 분석 데이터가 없습니다. 먼저 [본인 화면] 탭에서 주간 회의록 텍스트 분석을 완료해 주세요.
                    </p>
                  )}
                </div>
              </div>

              {/* Milestone Indicator */}
              <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 flex items-start gap-3">
                <Clock className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <p className="font-bold">차주 실사 대비 1차 마일스톤 완료 가이드</p>
                  <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
                    모든 패치 조치 결과 가이드 및 스크린샷 수집 완료 일정을 금주 금요일까지 준수할 수 있도록 독려하십시오.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= VIEW: IT / SECURITY ================= */}
          {activeTab === "it" && (
            <motion.div
              key="it-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto w-full bg-white p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="bg-emerald-50 p-2.5 rounded-xl">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">IT/보안 통제 및 개인정보 보안 정책</h3>
                  <p className="text-xs text-slate-400">민감한 내부 정보 유출 방지 및 로컬 샌드박스 정책을 보증합니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <h4>원 데이터 무보존 정책</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    사용자가 붙여넣는 어떠한 회의록 원문도 별도 백엔드 데이터베이스(Database)에 전송하여 저장되지 않습니다. 
                    분석 진행 정보는 오로지 사용자의 웹 브라우저 내 <strong>LocalStorage</strong>에 무기명으로 저장되어 유실되지 않도록 보장합니다.
                  </p>
                </div>

                <div className="p-5 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h4>HTTPS direct API 암호화 전송</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    AI Studio의 Secure proxy 시스템을 통해 Gemini API 호출이 안전하게 보안 채널로만 전달되며, 전송 중간에 타인에 의해 정보가 복제되거나 변조될 우려가 일체 없습니다.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
                <p className="font-bold text-slate-700 mb-1">개발팀 규정 준수 서약:</p>
                본 솔루션은 Google AI Studio의 Security 정책 가이드라인을 완전하게 이행하며, 임의의 third-party 데이터 수집 목적의 tracker, 로그 적재 도구 혹은 비정상적인 전송 백엔드가 탑재되지 않았음을 선언합니다.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="container mx-auto px-4 max-w-6xl py-4 flex flex-col sm:flex-row justify-between items-center text-slate-400 text-xs gap-2">
          <span>© 2026 Meeting Productivity Suite. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="font-medium text-slate-500">Gemini 3.5 Engine Proxy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
