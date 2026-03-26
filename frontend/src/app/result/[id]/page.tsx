"use client";

import { useEffect, useState, use } from "react";
import { getInsightReport } from "../../actions";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const responseId = unwrappedParams.id;
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'client' | 'master'>('client');
  const [isAdopted, setIsAdopted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!responseId) return;

    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const result = await getInsightReport(responseId);
        
        if (!result.success) {
          setError(result.error || "無法取得報告資料，請稍後再試。");
          return;
        }

        if (result.isReady && result.data) {
          setReportData(result.data);
          setIsReady(true);
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    };

    // 初始檢查
    checkStatus();

    // 如果還沒有準備好，就開始輪詢
    pollInterval = setInterval(() => {
      if (!isReady) {
        checkStatus();
      }
    }, 5000); // 每 5 秒檢查一次

    return () => clearInterval(pollInterval);
  }, [responseId, isReady]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-red-50 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">發生錯誤</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-100 relative overflow-hidden">
          {/* Subtle background animation */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"></div>
          
          <div className="relative mb-8 mt-4">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="text-indigo-600 text-2xl">✨</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">AI 洞察分析中</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            系統正在整合您的身體使用模式，<br/>並生成雙向洞察報告，請稍候片刻...
          </p>
          
          <div className="flex flex-col gap-3 max-w-[200px] mx-auto opacity-70">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 w-1/2 animate-[pulse_2s_ease-in-out_infinite] rounded-full"></div>
            </div>
            <div className="h-2 w-3/4 bg-slate-100 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-purple-400 w-2/3 animate-[pulse_2.5s_ease-in-out_infinite] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    analysis_client,
    analysis_master,
    pattern_type,
    primary_load_source,
    lifestyle_tags,
    risk_class
  } = reportData;

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim());
    const elements = [];
    let i = 0;
    
    while (i < lines.length) {
      if (lines[i].startsWith('## ')) {
        const title = lines[i].replace('## ', '');
        const contentLines = [];
        i++;
        while (i < lines.length && lines[i] !== '' && !lines[i].startsWith('**')) {
          contentLines.push(lines[i]);
          i++;
        }
        elements.push(
          <div key={`focus-${i}`} className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-5 mb-8 shadow-sm">
            <h3 className="font-bold text-indigo-900 text-lg mb-2 flex items-center gap-2">
              <span className="text-2xl">🎯</span> {title}
            </h3>
            <p className="text-indigo-800/80 font-medium text-lg leading-relaxed">
              {contentLines.join('\n')}
            </p>
          </div>
        );
        continue;
      }
      
      if (lines[i].startsWith('**') && lines[i].endsWith('**')) {
        const title = lines[i].replace(/\*\*/g, '');
        elements.push(
          <h4 key={`title-${i}`} className="font-bold text-slate-800 mt-8 mb-4 text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block shadow-sm"></span>
            {title}
          </h4>
        );
        i++;
        continue;
      }
      
      if (lines[i].startsWith('- ')) {
        const listItems = [];
        while (i < lines.length && lines[i].startsWith('- ')) {
          listItems.push(lines[i].substring(2));
          i++;
        }
        elements.push(
          <div key={`list-${i}`} className="flex flex-col gap-3 mb-6">
            {listItems.map((item, idx) => {
              const isRed = item.includes('🔴');
              const isYellow = item.includes('🟡');
              const cleanItem = item.replace(/[🔴🟡]/g, '').trim();
              if (isRed || isYellow) {
                return (
                  <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border ${isRed ? 'bg-red-50/80 border-red-100' : 'bg-amber-50/80 border-amber-100'} shadow-sm`}>
                    <span className="text-xl flex-shrink-0">{isRed ? '🔴' : '🟡'}</span>
                    <span className={`font-semibold ${isRed ? 'text-red-900' : 'text-amber-900'} leading-relaxed`}>{cleanItem}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-100"></div>
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0 font-bold ml-2">•</span>
                  <span className="text-slate-700 leading-relaxed font-medium">{cleanItem}</span>
                </div>
              );
            })}
          </div>
        );
        continue;
      }
      
      if (lines[i] !== '') {
        const paraLines = [];
        while (i < lines.length && lines[i] !== '' && !lines[i].startsWith('**') && !lines[i].startsWith('- ') && !lines[i].startsWith('## ')) {
          paraLines.push(lines[i]);
          i++;
        }
        elements.push(
          <p key={`para-${i}`} className="text-slate-700 leading-relaxed mb-6 font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
            {paraLines.join('\n')}
          </p>
        );
        continue;
      }
      i++;
    }
    return elements;
  };

  // Determine colors based on risk class
  const getRiskColors = (risk: string) => {
    switch (risk) {
      case 'C': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800 border-red-200' };
      case 'B': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
      default: return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const colors = getRiskColors(risk_class);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">專屬分析報告已生成</h1>
          <p className="text-slate-500 text-lg">感謝您的耐心等候，以下是我們為您綜合評估的結果</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          
          {/* Top Banner (Status) */}
          <div className={`${colors.bg} px-8 py-6 border-b ${colors.border} flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">風險等級判定</p>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black ${colors.text}`}>{risk_class}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
                  {risk_class === 'A' ? '一般亞健康' : risk_class === 'B' ? '複雜代償期' : '需醫療評估'}
                </span>
              </div>
            </div>
            <div className="text-right flex-1 w-full sm:w-auto">
              <div className="flex flex-wrap gap-2 justify-end">
                {lifestyle_tags?.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-sm font-medium text-slate-700 shadow-sm border border-black/5">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Core Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">身體使用模式</h3>
                </div>
                <p className="text-slate-700 font-medium text-lg">{pattern_type || "資料分析中..."}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">主要負荷來源</h3>
                </div>
                <p className="text-slate-700 font-medium text-lg">{primary_load_source || "資料分析中..."}</p>
              </div>
            </div>

            {/* Analysis Text Request */}
            <div className="bg-indigo-50/50 rounded-3xl p-6 sm:p-8 border border-indigo-100">
              
              <div className="flex border-b border-indigo-200 mb-6 font-medium text-sm">
                <button 
                  onClick={() => setActiveTab('client')} 
                  className={`flex-1 py-4 text-center transition-colors ${activeTab === 'client' ? 'text-indigo-700 border-b-2 border-indigo-600 font-bold' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  客戶版解說
                </button>
                <button 
                  onClick={() => setActiveTab('master')} 
                  className={`flex-1 py-4 text-center transition-colors ${activeTab === 'master' ? 'text-indigo-700 border-b-2 border-indigo-600 font-bold' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  師傅版洞察
                </button>
              </div>

              <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> {activeTab === 'client' ? '專家洞察與建議' : '根源代償分析與處置建議'}
              </h3>
              
              <div className="text-slate-700 leading-relaxed w-full">
                {renderFormattedText(activeTab === 'client' ? analysis_client : analysis_master)}
              </div>

              {activeTab === 'master' && (
                <div className="mt-8 pt-6 border-t border-indigo-100 flex justify-center">
                  <button 
                    onClick={() => {
                      if (!isAdopted) {
                        setIsAdopted(true);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                      }
                    }}
                    disabled={isAdopted}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-sm
                      ${isAdopted 
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500 cursor-default opacity-90' 
                        : 'bg-white text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-50 active:scale-95'}`}
                  >
                    {isAdopted ? (
                      <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 已採納此建議</>
                    ) : (
                      '採納此調理建議'
                    )}
                  </button>
                </div>
              )}
            </div>

            {risk_class !== 'A' && (
              <div className={`p-6 rounded-2xl border ${colors.border} ${colors.bg}`}>
                <h4 className={`font-bold ${colors.text} mb-2`}>給您的特別提醒</h4>
                <p className="text-slate-700 text-sm">
                  {risk_class === 'B' 
                    ? "您的狀況屬於「複雜代償期」，表示身體已經為了適應您日常的負荷，產生了多處緊繃的連動關係。建議在預約服務時，提前告知您的師傅，以便進行更詳盡的評估。"
                    : "您的症狀描述包含了較具風險的特徵（如伴隨輻射痛、長時間無法緩解或疑似發炎反應）。我們強烈建議您優先尋求醫療專業人員進行影像學或進一步的檢查。"}
                </p>
              </div>
            )}
            
          </div>
          
          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-xs text-slate-400">本報告由 ConditionAI 行為模式分析引擎生成，僅供調理師傅參考使用。</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-4 sm:mt-0 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
            >
              返回首頁重新填寫 &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl z-50 flex items-center justify-center gap-3 w-11/12 max-w-sm transition-all duration-300 transform translate-y-0 opacity-100 border border-slate-700">
          <div className="bg-emerald-500 rounded-full p-1 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-wide">已記錄｜調理洞察已加入顧客歷程</span>
        </div>
      )}

    </div>
  );
}
