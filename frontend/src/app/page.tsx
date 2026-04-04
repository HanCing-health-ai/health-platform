"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { submitQuestionnaire } from "./actions";
import { canSubmitNow, setLastSubmitTime } from "../lib/submitGuard";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingState from "../components/LoadingState";

const bodyParts = [
  "頭部/後腦", "頸部 (脖子)", "肩部", "上背部 (膏肓)",
  "下背部 (腰)", "骨盆/臀部", "大腿", "小腿",
  "腳踝/腳底", "手肘/前臂", "手腕/手指"
];

const jobs = [
  "久坐辦公族 (內勤、設計、工程師)",
  "需久站工作 (專櫃、餐飲、老師)",
  "勞力搬重物 (物流、倉儲、工地)",
  "頻繁走動/外勤 (業務、外送)",
  "家管/全職育兒",
  "其他"
];

const durationTypes = [
  "少於一個月",
  "一個月到半年",
  "半年以上",
  "長年痛/老毛病"
];

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

  // Client Info
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
  
  // Questionnaire Data
  const [job, setJob] = useState("");
  const [otherJob, setOtherJob] = useState("");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [primaryComplaint, setPrimaryComplaint] = useState("");
  const [habits, setHabits] = useState("");
  const [duration, setDuration] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [isOnMedication, setIsOnMedication] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{success?: boolean; message?: string} | null>(null);

  // Gate 3 State
  const [showGate3Modal, setShowGate3Modal] = useState(false);
  const [gate3RemainingTime, setGate3RemainingTime] = useState("");

  // Refs for Gate scrolling
  const partsRef = useRef<HTMLDivElement>(null);
  const habitsRef = useRef<HTMLTextAreaElement>(null);

  const togglePart = (part: string) => {
    setSelectedParts(prev => 
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const habitsWordCount = habits.trim().length;
  const isGate1Passed = selectedParts.length > 0;
  const isGate2Passed = habitsWordCount >= 15;

  const validateGates = () => {
    if (!isPhoneVerified) {
      setOtpError("請先完成手機號碼驗證");
      return false;
    }
    if (!isGate1Passed) {
      partsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!isGate2Passed) {
      habitsRef.current?.focus();
      habitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

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
    
    // Import dynamically so it runs client side only
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGates()) return;

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

    const finalJob = job === "其他" && otherJob.trim() !== "" ? `其他: ${otherJob}` : job;

    const result = await submitQuestionnaire({
      name,
      phone,
      occupation_type: finalJob,
      discomfort_areas: selectedParts,
      primary_complaint: primaryComplaint,
      lifestyle_description: habits,
      duration_type: duration,
      special_notes: specialNotes,
      is_on_medication: isOnMedication,
      is_test: isTest
    });

    setIsSubmitting(false);
    
    if (result.success && result.responseId) {
      setLastSubmitTime(phone); // Mark success locally
      setSubmissionResult({ success: true, message: "資料已成功送出！系統正為您產生雙向洞察報告..." });
      router.push(`/result/${result.responseId}`);
    } else {
      setSubmissionResult({ success: false, message: `發生錯誤：${result.error}` });
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
          <div className="animate-pulse flex space-x-2 justify-center">
            <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
            <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
            <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
        
        {/* Header Hero */}
        <div className="bg-slate-900 px-8 py-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            身體使用模式分析問卷
          </h1>
          <p className="text-slate-300 text-sm">
            請花 1 分鐘告訴我們您的日常狀況，建立專屬雙向洞察分析。
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10">
          
          {/* Section 0: 基本資料 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">0</span> 
              基本資料
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-10">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">稱呼 <span className="text-red-500">*必填</span></label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border-slate-200 border-2 p-3 focus:border-indigo-500 focus:ring-0" placeholder="王小明" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">聯絡電話 (身分驗證) <span className="text-red-500">*必填</span></label>
                <div className="flex gap-2">
                  <input readOnly={isPhoneVerified} required pattern="^09\d{8}$" title="請輸入有效的手機號碼，例如：0912345678" type="tel" value={phone} onChange={e => {setPhone(e.target.value); setIsOtpSent(false); setOtpError("");}} className={`w-full rounded-lg border-2 p-3 focus:border-indigo-500 focus:ring-0 ${isPhoneVerified ? 'bg-green-50 border-green-200 text-green-800' : 'border-slate-200'}`} placeholder="0912345678" />
                  {!isPhoneVerified && (
                    <button type="button" onClick={handleSendOtp} disabled={isOtpLoading || !phone.match(/^09\d{8}$/)} className="shrink-0 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium border-2 border-slate-200 hover:bg-slate-200 transition-all disabled:opacity-50">
                      {isOtpLoading ? '請稍候' : (isOtpSent ? '重新發送' : '發送驗證碼')}
                    </button>
                  )}
                </div>
                {isPhoneVerified && <p className="text-sm font-bold text-green-600 flex items-center gap-1">✅ 號碼已成功驗證</p>}
                
                {isOtpSent && !isPhoneVerified && (
                  <div className="mt-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                    <label className="block text-sm font-medium text-indigo-900">輸入收到的 6 位數驗證碼</label>
                    <div className="flex gap-2">
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full rounded-lg border-indigo-200 border p-2 text-center text-lg tracking-widest focus:ring-indigo-500" placeholder="123456" />
                      <button type="button" onClick={handleVerifyOtp} disabled={isOtpLoading || otp.length < 6} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-50">
                        確認
                      </button>
                    </div>
                  </div>
                )}
                {otpError && <p className="text-xs font-semibold text-red-500 mt-1">{otpError}</p>}
              </div>
            </div>
          </section>

          {/* Section 1: 職業與日常負荷 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span> 
              主要職業類型 <span className="text-red-500 text-sm">*必選</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-10">
              {jobs.map((j) => (
                <label key={j} className={`
                  relative flex cursor-pointer rounded-xl border-2 p-4 transition-all focus:outline-none 
                  ${job === j ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}
                `}>
                  <input required={!job} type="radio" name="job" value={j} className="sr-only" onChange={(e) => setJob(e.target.value)} />
                  <span className={`text-sm font-medium ${job === j ? 'text-indigo-900' : 'text-slate-700'}`}>{j}</span>
                </label>
              ))}
            </div>
            {job === "其他" && (
              <div className="mt-4 ml-10">
                <input
                  type="text"
                  required
                  value={otherJob}
                  onChange={(e) => setOtherJob(e.target.value)}
                  placeholder="請輸入您的主要職業"
                  className="w-full sm:w-1/2 rounded-lg border-slate-200 border-2 p-3 focus:border-indigo-500 focus:ring-0 text-sm"
                />
              </div>
            )}
          </section>

          {/* Section 2: 不適部位與持續時間 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span> 
              感覺緊繃或痠痛的狀況
            </h2>
            
            <div className="ml-10 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">最不舒服的部位 (單選主訴) <span className="text-red-500">*必選</span>:</label>
                <select required value={primaryComplaint} onChange={e => setPrimaryComplaint(e.target.value)} className="w-full rounded-lg border-slate-200 border-2 p-3 focus:border-indigo-500">
                  <option value="">請選擇最不舒服的部位</option>
                  {bodyParts.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div ref={partsRef}>
                <label className="block text-sm font-medium text-slate-700 mb-2">有牽連緊繃的部位 (可複選) <span className="text-red-500">*最少需選一項</span>:</label>
                <div className="flex flex-wrap gap-2">
                  {bodyParts.map((part) => (
                    <button key={part} type="button" onClick={() => togglePart(part)}
                      className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 border-2
                        ${selectedParts.includes(part) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
                {!isGate1Passed && (
                  <p className="mt-2 text-sm text-red-500 font-medium">請至少勾選一個身體部位</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">這總狀況持續大約多久了？ <span className="text-red-500">*必選</span></label>
                <div className="flex flex-wrap gap-2">
                  {durationTypes.map((dt) => (
                    <button key={dt} type="button" onClick={() => setDuration(dt)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2
                        ${duration === dt ? 'bg-indigo-100 text-indigo-800 border-indigo-400 font-bold' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: 生活習慣與備註 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span> 
              補充說明與病史
            </h2>
            <div className="ml-10 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">簡單描述生活習慣與狀況 (自由發揮) <span className="text-red-500">*必填</span>:</label>
                <textarea ref={habitsRef} required rows={3} placeholder="例：「每天盯螢幕超過10小時，最近覺得眼睛乾澀連帶脖子很緊」" value={habits} onChange={(e) => setHabits(e.target.value)}
                  className="w-full rounded-xl border-slate-200 border-2 p-4 focus:border-indigo-500 focus:ring-0 text-slate-700 sm:text-sm resize-none"
                />
                <p className={`mt-1 text-sm font-medium ${isGate2Passed ? 'text-green-600' : 'text-red-500'}`}>
                  請描述您的生活習慣（至少 15 字，目前 {habitsWordCount} 字）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">是否有特殊情況或舊傷？ (選填):</label>
                <input type="text" value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} className="w-full rounded-lg border-slate-200 border-2 p-3 focus:border-indigo-500" placeholder="例如：有車禍舊傷、上個月剛開刀..." />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-slate-100 hover:bg-slate-50">
                <input type="checkbox" checked={isOnMedication} onChange={e => setIsOnMedication(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                <span className="text-sm font-medium text-slate-700">目前是否有因為相關症狀而在服用藥物 (止痛藥、肌肉鬆弛劑等)？</span>
              </label>
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-6 border-t border-slate-100">
            {submissionResult?.success === false && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                {submissionResult.message}
              </div>
            )}
            {/* Pseudo-disabled button implementation for UX requirement (enables scrolling on invalid click) */}
            <button
              type="submit"
              onClick={e => {
                const isFormValidBasic = name && phone.match(/^09\d{8}$/) && job && primaryComplaint && duration;
                if (!isFormValidBasic) return; // let html required tags do their job
                if (!isGate1Passed || !isGate2Passed) {
                  e.preventDefault();
                  validateGates();
                }
              }}
              disabled={isSubmitting}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 
                ${(!isGate1Passed || !isGate2Passed || !name || !phone.match(/^09\d{8}$/) || !job || !primaryComplaint || !duration) 
                  ? 'bg-slate-300 cursor-not-allowed opacity-80' 
                  : 'bg-slate-900 hover:bg-slate-800'}`}
              title={(!isGate1Passed || !isGate2Passed) ? "未達提交條件（請檢查紅色提示）" : ""}
            >
              {isSubmitting ? '資料傳送中...' : '送出並開始分析'}
            </button>
            <p className="text-center text-xs text-slate-400 mt-5">
              本系統定位為亞健康行為模式分析工具，不提供醫療診斷與治療指示。
            </p>
          </div>
        </form>
      </div>

      {showGate3Modal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">分析頻率限制</h3>
            <p className="text-slate-600 mb-4">
              您今日已完成分析，明天再來查看新的建議吧。
            </p>
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 font-medium mb-6">
              距離下次分析還有 {gate3RemainingTime}
            </div>
            <button
              onClick={() => setShowGate3Modal(false)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all"
            >
              了解
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
