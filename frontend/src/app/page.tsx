"use client";

import { useState, Suspense, useEffect } from "react";
import { submitQuestionnaire } from "./actions";
import { canSubmitNow, setLastSubmitTime } from "../lib/submitGuard";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingState from "../components/LoadingState";
import BodyMapSelector from "../components/BodyMapSelector";
import GuidedQuestionnaire, { QuestionnaireData } from "../components/GuidedQuestionnaire";

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)] font-medium tracking-widest">系統初始化中...</div>}>
      <Questionnaire />
    </Suspense>
  )
}

function Questionnaire() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  
  const isDevMode = role === 'dev' && process.env.NODE_ENV === 'development';
  const isStaffMode = role === 'staff';

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Client Info (Step 0)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isTest, setIsTest] = useState(false);

  useEffect(() => {
    if (isDevMode) {
      setIsPhoneVerified(true);
      setIsTest(true);
    } else if (isStaffMode) {
      import('../lib/supabaseClient').then(({ supabase }) => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            setIsPhoneVerified(true);
          }
        });
      });
    }

    if (!isDevMode && !isStaffMode) {
      const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;
      const stored = localStorage.getItem('conditionai_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          const isValid = Date.now() - session.verified_at < SESSION_DURATION;
          if (isValid) {
            setName(session.name || "");
            setPhone(session.phone || "");
            setIsPhoneVerified(true);
            setStep(1);
          } else {
            localStorage.removeItem('conditionai_session');
          }
        } catch {
          localStorage.removeItem('conditionai_session');
        }
      }
    }
  }, [isDevMode, isStaffMode]);
  
  // Step 1 Data
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{success?: boolean; message?: string} | null>(null);

  // Gate 3 State
  const [showGate3Modal, setShowGate3Modal] = useState(false);
  const [gate3RemainingTime, setGate3RemainingTime] = useState("");

  const formatPhoneForAuth = (p: string) => {
    return "+886" + p.substring(1);
  };

  const handleSendOtp = async () => {
    if (!phone.match(/^09\d{8}$/)) {
      setOtpError("請輸入有效手機號碼");
      return;
    }
    setIsOtpLoading(true);
    setOtpError("");
    
    // Fallback or demo mode simulation could go here for EVERY8D migration prep
    // Currently still uses Twilio fallback in action
    const { supabase } = await import('../lib/supabaseClient');
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhoneForAuth(phone)
    });

    setIsOtpLoading(false);
    if (error) {
      setOtpError("發送失敗: " + error.message);
    } else {
      setIsOtpSent(true);
      setOtpError("");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("請輸入驗證碼");
      return;
    }
    setIsOtpLoading(true);
    setOtpError("");

    const { supabase } = await import('../lib/supabaseClient');
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatPhoneForAuth(phone),
      token: otp.trim(),
      type: 'sms'
    });

    setIsOtpLoading(false);
    if (error) {
      setOtpError("驗證失敗: 驗證碼錯誤或失效");
    } else if (data.session) {
      setIsPhoneVerified(true);
      setOtpError("");
    }
  };

  const goToStep1 = () => {
    if (!name.trim()) {
      setOtpError("請填寫稱呼");
      return;
    }
    if (!isPhoneVerified) {
      setOtpError("請完成手機驗證");
      return;
    }
    setOtpError("");
    
    const sessionData = { name, phone, verified_at: Date.now() };
    localStorage.setItem('conditionai_session', JSON.stringify(sessionData));

    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep2 = () => {
    if (selectedAreas.length === 0) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (questionnaireData: QuestionnaireData) => {
    const bypass = isDevMode || (typeof window !== 'undefined' && window.location.search.includes('bypass=true'));
    if (!bypass) {
      const { allowed, remainingMs } = canSubmitNow(phone);
      if (!allowed) {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        setGate3RemainingTime(`${hours} 小時 ${minutes} 分鐘`);
        setShowGate3Modal(true);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    const finalJob = questionnaireData.work_type === "其他" && questionnaireData.work_other?.trim() ? `其他: ${questionnaireData.work_other}` : questionnaireData.work_type;

    const lifestyleFactorsJson = {
      duration: questionnaireData.duration,
      discomfort_type: questionnaireData.discomfort_type,
      work_type: finalJob,
      exercise: questionnaireData.exercise,
      sleep: questionnaireData.sleep,
      water: questionnaireData.water,
      diet: questionnaireData.diet
    };

    const legacyDescription = `工作：${finalJob}。睡眠${questionnaireData.sleep}。運動：${questionnaireData.exercise}。感受：${questionnaireData.discomfort_type.join('、')}。${questionnaireData.chief_complaint}`;

    const result = await submitQuestionnaire({
      name, phone, occupation_type: finalJob, discomfort_areas: selectedAreas,
      primary_complaint: questionnaireData.chief_complaint || "無",
      lifestyle_description: legacyDescription,
      duration_type: questionnaireData.duration,
      special_notes: "", is_on_medication: false, is_test: isTest,
      lifestyle_factors: lifestyleFactorsJson
    });

    setIsSubmitting(false);
    
    if (result.success && result.responseId) {
      setLastSubmitTime(phone);
      router.push(`/result/${result.responseId}`);
    } else {
      setSubmissionResult({ success: false, message: `發生錯誤：${result.error}` });
      setStep(0);
    }
  };

  if (isSubmitting) {
    return <LoadingState />;
  }

  const STAGES = ['認證', '部位', '詳情'];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 font-sans transition-all duration-500 ease-in-out">
      <div className="max-w-2xl mx-auto glass-panel rounded-3xl shadow-2xl overflow-hidden text-[var(--text-primary)]">
        
        {/* Header Hero */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-[var(--border)] relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--accent-primary)] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--accent-secondary)] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
          
          <h2 className="text-sm font-bold tracking-[0.25em] text-[var(--accent-secondary)] mb-2 uppercase">ConditionAI</h2>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gradient mb-3 font-heading">
            AI 驅動的身體使用模式分析
          </h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium">
            以精密運算透析您的日常累積，建立專屬調理洞察。
          </p>

          {/* MedTech Progress Bar */}
          <div className="mt-8 flex items-center justify-center w-full max-w-sm mx-auto relative z-10">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--border)] rounded-full -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-full -z-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${step * 50}%` }}></div>
            
            <div className="flex justify-between w-full">
              {STAGES.map((label, idx) => {
                const isActive = step >= idx;
                const isCurrent = step === idx;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-lg ${isActive ? 'bg-[var(--accent-primary)] text-white glow-primary' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
                      {isActive ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${isCurrent ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 min-h-[400px]">
          {/* Step 0: Basic Info & OTP */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[var(--accent-secondary)] rounded-full inline-block"></span>
                啟動安全連線
              </h2>
              
              {submissionResult?.success === false && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
                  {submissionResult.message}
                </div>
              )}

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] mb-2 uppercase">Client Name / 稱呼</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full input-underline p-3 text-lg font-bold" placeholder="王小明" />
                </div>
                
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] mb-1 uppercase">Comm Link / 聯絡電話</label>
                  <div className="flex gap-4 items-end">
                    <input readOnly={isPhoneVerified} pattern="^09\d{8}$" type="tel" value={phone} onChange={e => {setPhone(e.target.value); setIsOtpSent(false); setOtpError("");}} className={`w-full input-underline p-3 text-lg font-bold tracking-widest transition-colors ${isPhoneVerified ? 'text-emerald-400 border-emerald-500/50' : 'text-white'}`} placeholder="0912345678" />
                    {!isPhoneVerified && (
                      <button type="button" onClick={handleSendOtp} disabled={isOtpLoading || !phone.match(/^09\d{8}$/)} className="shrink-0 bg-[var(--bg-glass)] text-[var(--accent-secondary)] border border-[var(--accent-secondary)] px-5 py-3 rounded-lg font-bold hover:bg-[var(--accent-secondary)] hover:text-white transition-all disabled:opacity-30 disabled:border-slate-700 disabled:text-slate-500 text-sm glow-primary-hover">
                        {isOtpLoading ? 'TX...' : (isOtpSent ? 'RESEND' : 'TRANSMIT')}
                      </button>
                    )}
                  </div>
                  {isPhoneVerified && <p className="text-xs font-bold text-emerald-400 tracking-wider">◆ VERIFIED</p>}
                  
                  {isOtpSent && !isPhoneVerified && (
                    <div className="mt-4 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl space-y-4 shadow-inner">
                      <label className="block text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">Access Code / 簡訊驗證碼</label>
                      <div className="flex gap-3">
                        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-3 text-center text-2xl tracking-[0.5em] font-black text-white focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]" placeholder="------" />
                        <button type="button" onClick={handleVerifyOtp} disabled={isOtpLoading || otp.length < 6} className="bg-[var(--accent-primary)] text-white px-6 py-3 rounded-lg font-black hover:bg-indigo-500 active:scale-95 disabled:opacity-30 transition-all glow-primary">
                          VERIFY
                        </button>
                      </div>
                    </div>
                  )}
                  {otpError && <p className="text-xs font-bold text-red-400 mt-1">{otpError}</p>}
                </div>

                <div className="pt-8">
                  <button type="button" onClick={goToStep1} disabled={!isPhoneVerified || !name.trim()} className="w-full bg-[var(--accent-primary)] text-white py-4 rounded-xl font-black text-lg tracking-widest disabled:opacity-30 hover:bg-indigo-500 transition-all active:scale-95 glow-primary-hover uppercase">
                    Initialize Scan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Body Map Selector */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <button type="button" onClick={() => setStep(0)} className="text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)] hover:text-white flex items-center gap-2 transition-colors">
                  <span className="text-lg">←</span> Configure
                </button>
                {isPhoneVerified && (
                  <button type="button" onClick={() => {
                    localStorage.removeItem('conditionai_session');
                    setIsPhoneVerified(false); setPhone(""); setOtp(""); setIsOtpSent(false); setStep(0);
                  }} className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/30 px-3 py-1.5 rounded-full hover:bg-[var(--accent-secondary)] hover:text-white transition-all">
                    Reset Session
                  </button>
                )}
              </div>
              <BodyMapSelector 
                defaultSelected={selectedAreas} 
                onChange={setSelectedAreas}
                className="mb-10 !bg-transparent !border-none !shadow-none !p-0"
              />
              <button 
                type="button" 
                onClick={goToStep2} 
                className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest text-white transition-all active:scale-[0.98]
                  ${selectedAreas.length > 0 ? 'bg-[var(--accent-primary)] hover:bg-indigo-500 glow-primary-hover' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                {selectedAreas.length > 0 ? 'Proceed To Details' : 'Select Zones First'}
              </button>
            </div>
          )}

          {/* Step 2: Guided Questionnaire */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="mb-6 border-b border-[var(--border)] pb-4">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-bold tracking-wider uppercase text-[var(--text-secondary)] hover:text-white flex items-center gap-2 transition-colors">
                  <span className="text-lg">←</span> Scan Zones
                </button>
              </div>
              <GuidedQuestionnaire 
                selectedAreas={selectedAreas}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>

      {/* Gate 3 Modal */}
      {showGate3Modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="glass-panel border-red-500/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
            <h3 className="text-xl font-black text-white mb-3">SYSTEM LIMIT REACHED</h3>
            <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">您的通訊識別碼今日已執行過精密分析，為維持全網效能，請於明日再進行掃描。</p>
            <div className="bg-red-950/40 rounded-xl p-4 text-xs tracking-wider text-red-400 font-bold mb-8 text-center border border-red-500/20">
              COOLDOWN REMAINING: <span className="text-white">{gate3RemainingTime}</span>
            </div>
            <button onClick={() => setShowGate3Modal(false)} className="w-full py-4 bg-[var(--text-primary)] text-black rounded-xl font-black hover:bg-white active:scale-95 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
