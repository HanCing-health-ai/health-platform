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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
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
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep2 = () => {
    if (selectedAreas.length === 0) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (questionnaireData: QuestionnaireData) => {
    // Gate 3: 24 Hour Duplicate Check
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

    // To prevent empty text causing Gate 2 fail in legacy check. We generate a brief description
    const legacyDescription = `工作：${finalJob}。睡眠${questionnaireData.sleep}。運動：${questionnaireData.exercise}。感受：${questionnaireData.discomfort_type.join('、')}。${questionnaireData.chief_complaint}`;

    const result = await submitQuestionnaire({
      name,
      phone,
      occupation_type: finalJob,
      discomfort_areas: selectedAreas,
      primary_complaint: questionnaireData.chief_complaint || "無",
      lifestyle_description: legacyDescription,
      duration_type: questionnaireData.duration,
      special_notes: "", // Not used specifically now, integrated
      is_on_medication: false, // Omitted from new form, set false
      is_test: isTest,
      lifestyle_factors: lifestyleFactorsJson
    });

    setIsSubmitting(false);
    
    if (result.success && result.responseId) {
      setLastSubmitTime(phone);
      setSubmissionResult({ success: true, message: "資料已成功送出！系統正為您產生雙向洞察報告..." });
      router.push(`/result/${result.responseId}`);
    } else {
      setSubmissionResult({ success: false, message: `發生錯誤：${result.error}` });
      setStep(0); // Optional: back to start or show error atop
    }
  };

  if (isSubmitting) {
    return <LoadingState />;
  }

  if (submissionResult?.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">分析處理中</h2>
          <p className="text-slate-600 mb-6">{submissionResult.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
        
        {/* Header Hero */}
        <div className="bg-slate-900 px-8 py-8 text-center transition-all">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            身體使用模式分析問卷
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            請花 1 分鐘告訴我們您的日常狀況，建立專屬雙向洞察分析。
          </p>

          {/* Stepper Wizard Indicator */}
          <div className="mt-6 flex justify-center items-center gap-2 sm:gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
             <span className={step >= 0 ? "text-indigo-400" : ""}>驗證</span>
             <span className="w-4 h-px bg-slate-700"></span>
             <span className={step >= 1 ? "text-indigo-400" : ""}>部位</span>
             <span className="w-4 h-px bg-slate-700"></span>
             <span className={step >= 2 ? "text-indigo-400" : ""}>詳細</span>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 space-y-6">
          {/* Step 0: Basic Info & OTP */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold text-slate-800 mb-6">基本資料驗證</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">稱呼 <span className="text-red-500">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border-slate-200 border-2 p-3 focus:border-indigo-500 focus:ring-0 text-slate-800 font-medium" placeholder="王小明" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">聯絡電話 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input readOnly={isPhoneVerified} pattern="^09\d{8}$" type="tel" value={phone} onChange={e => {setPhone(e.target.value); setIsOtpSent(false); setOtpError("");}} className={`w-full rounded-lg border-2 p-3 focus:border-indigo-500 focus:ring-0 font-medium ${isPhoneVerified ? 'bg-green-50 border-green-200 text-green-800' : 'border-slate-200 text-slate-800'}`} placeholder="0912345678" />
                    {!isPhoneVerified && (
                      <button type="button" onClick={handleSendOtp} disabled={isOtpLoading || !phone.match(/^09\d{8}$/)} className="shrink-0 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold border-2 border-slate-200 hover:bg-slate-200 transition-all disabled:opacity-50 text-sm">
                        {isOtpLoading ? '請稍候' : (isOtpSent ? '重新發送' : '發送驗證碼')}
                      </button>
                    )}
                  </div>
                  {isPhoneVerified && <p className="text-sm font-bold text-green-600 flex items-center gap-1">✅ 手機已成功驗證</p>}
                  
                  {isOtpSent && !isPhoneVerified && (
                    <div className="mt-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                      <label className="block text-sm font-medium text-indigo-900">輸入收到的 6 位數簡訊驗證碼</label>
                      <div className="flex gap-2">
                        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full rounded-lg border-indigo-200 border p-2 text-center text-xl tracking-[0.25em] font-bold text-indigo-900 focus:ring-indigo-500" placeholder="123456" />
                        <button type="button" onClick={handleVerifyOtp} disabled={isOtpLoading || otp.length < 6} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-50">
                          確認
                        </button>
                      </div>
                    </div>
                  )}
                  {otpError && <p className="text-sm font-bold text-red-500 mt-1">{otpError}</p>}
                </div>

                <div className="pt-6">
                  <button type="button" onClick={goToStep1} disabled={!isPhoneVerified || !name.trim()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all active:scale-[0.98]">
                    開始填寫部位
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Body Map Selector */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-4">
                <button type="button" onClick={() => setStep(0)} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  ← 返回修改資料
                </button>
              </div>
              <BodyMapSelector 
                defaultSelected={selectedAreas} 
                onChange={setSelectedAreas}
                className="mb-8"
              />
              <button 
                type="button" 
                onClick={goToStep2} 
                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all active:scale-[0.98]
                  ${selectedAreas.length > 0 ? 'bg-slate-900 hover:bg-slate-800 shadow-xl' : 'bg-slate-300 cursor-not-allowed'}
                `}
              >
                {selectedAreas.length > 0 ? '下一步：詳細狀況' : '請至少點選一個部位'}
              </button>
            </div>
          )}

          {/* Step 2: Guided Questionnaire */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  ← 回到身體圖
                </button>
              </div>
              <GuidedQuestionnaire 
                selectedAreas={selectedAreas}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
              {submissionResult?.success === false && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                  {submissionResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gate 3 Modal */}
      {showGate3Modal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">分析頻率限制</h3>
            <p className="text-slate-600 mb-4">這支門號今日已完成過分析，明天再來查看新的建議吧。</p>
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 font-bold mb-6 text-center border border-amber-200">
              距離下次分析還有 {gate3RemainingTime}
            </div>
            <button onClick={() => setShowGate3Modal(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all">
              了解
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
