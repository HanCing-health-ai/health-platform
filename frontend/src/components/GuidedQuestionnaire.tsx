'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * GuidedQuestionnaire — 逐步引導式提問問卷
 * 依序顯示 Q1~Q8，降低使用者的認知負擔。
 */

export interface QuestionnaireData {
  duration: string;
  discomfort_type: string[];
  work_type: string;
  work_other?: string;
  exercise: string;
  sleep: string;
  water: string;
  diet: string;
  chief_complaint: string;
}

interface GuidedQuestionnaireProps {
  selectedAreas: string[];
  onSubmit: (data: QuestionnaireData) => void;
  isSubmitting?: boolean;
}

const QUESTIONS = [
  { id: 'q1', type: 'single', title: '這個不適持續多久了？', options: ['1週內', '1個月內', '3個月內', '超過3個月'] },
  { id: 'q2', type: 'multiple', title: '不適的感覺是？（可多選）', options: ['痠', '緊', '痛', '麻', '沉重感'] },
  { id: 'q3', type: 'single-other', title: '主要工作性質？', options: ['久坐辦公', '久站', '勞力工作', '其他'] },
  { id: 'q4', type: 'single', title: '有沒有運動習慣？', options: ['沒有', '偶爾', '規律運動'] },
  { id: 'q5', type: 'single', title: '睡眠狀況如何？', options: ['充足', '偶爾不足', '長期睡眠不足'] },
  { id: 'q6', type: 'single', title: '平常飲水狀況？', options: ['很少喝水', '普通', '喝水充足'] },
  { id: 'q7', type: 'single', title: '飲食習慣？', options: ['規律正常', '不規律', '偏油膩重口味', '素食'] },
  { id: 'q8', type: 'text', title: '有沒有其他要補充的事？（包含舊傷、開刀紀錄等）' },
];

export default function GuidedQuestionnaire({ selectedAreas, onSubmit, isSubmitting = false }: GuidedQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // States to hold the answers
  const [duration, setDuration] = useState('');
  const [discomfortType, setDiscomfortType] = useState<string[]>([]);
  const [workType, setWorkType] = useState('');
  const [workOther, setWorkOther] = useState('');
  const [exercise, setExercise] = useState('');
  const [sleep, setSleep] = useState('');
  const [water, setWater] = useState('');
  const [diet, setDiet] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Auto-scroll anchor
  const stepEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll down slightly when next step is revealed
    if (currentStep > 0) {
      setTimeout(() => {
        stepEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [currentStep]);

  const toggleMultiple = (val: string) => {
    setDiscomfortType(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]);
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      duration,
      discomfort_type: discomfortType,
      work_type: workType,
      work_other: workOther,
      exercise,
      sleep,
      water,
      diet,
      chief_complaint: chiefComplaint
    });
  };

  /* Validation checks for each step */
  const isValid = (stepIdx: number) => {
    switch (stepIdx) {
      case 0: return duration !== '';
      case 1: return discomfortType.length > 0;
      case 2: return workType !== '' && (workType !== '其他' || workOther.trim() !== '');
      case 3: return exercise !== '';
      case 4: return sleep !== '';
      case 5: return water !== '';
      case 6: return diet !== '';
      case 7: return true; // Q8 is technically optional text, but we let them pass
      default: return false;
    }
  };

  const renderQuestionBody = (idx: number) => {
    const q = QUESTIONS[idx];

    if (q.id === 'q1') {
      return (
        <div className="flex flex-wrap gap-2">
          {q.options?.map(opt => (
            <button key={opt} type="button" onClick={() => { setDuration(opt); setTimeout(() => handleNext(), 300); }}
              className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-all ${duration === opt ? 'bg-indigo-100 text-indigo-700 border-indigo-400 drop-shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    
    if (q.id === 'q2') {
      return (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {q.options?.map(opt => (
              <button key={opt} type="button" onClick={() => toggleMultiple(opt)}
                className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-all ${discomfortType.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600 drop-shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <button type="button" disabled={discomfortType.length === 0} onClick={handleNext}
             className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors">
            確認並繼續
          </button>
        </div>
      );
    }

    if (q.id === 'q3') {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {q.options?.map(opt => (
              <button key={opt} type="button" onClick={() => { setWorkType(opt); if (opt !== '其他') setTimeout(() => handleNext(), 300); }}
                className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-all ${workType === opt ? 'bg-indigo-100 text-indigo-700 border-indigo-400 drop-shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {workType === '其他' && (
            <div className="flex gap-2 items-center mt-2 animate-in fade-in slide-in-from-top-2">
              <input type="text" value={workOther} onChange={e => setWorkOther(e.target.value)} placeholder="請輸入您的工作性質"
                className="w-full sm:w-64 rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-0" 
              />
              <button type="button" disabled={workOther.trim() === ''} onClick={handleNext} className="shrink-0 bg-slate-900 text-white px-4 py-3 rounded-lg font-bold text-sm disabled:opacity-30 transition-colors">
                確認
              </button>
            </div>
          )}
        </div>
      );
    }

    if (['q4', 'q5', 'q6', 'q7'].includes(q.id)) {
      const valueMap: Record<string, string> = { q4: exercise, q5: sleep, q6: water, q7: diet };
      const setMap: Record<string, (val: string) => void> = { q4: setExercise, q5: setSleep, q6: setWater, q7: setDiet };
      const currentVal = valueMap[q.id];
      const setter = setMap[q.id];

      return (
        <div className="flex flex-wrap gap-2">
          {q.options?.map(opt => (
            <button key={opt} type="button" onClick={() => { setter(opt); setTimeout(() => handleNext(), 300); }}
              className={`px-4 py-3 rounded-lg text-sm font-bold border-2 transition-all ${currentVal === opt ? 'bg-indigo-100 text-indigo-700 border-indigo-400 drop-shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (q.id === 'q8') {
      return (
        <div className="space-y-4">
          <textarea rows={3} placeholder="例：兩年前有車禍舊傷、上個月剛開刀、或是任何想告訴師傅的事" value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)}
            className="w-full rounded-xl border-slate-200 border-2 p-4 text-sm focus:border-indigo-500 focus:ring-0 resize-none shadow-inner"
          />
          <button type="button" disabled={isSubmitting} onClick={handleSubmit}
             className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? '資料打包分析中...' : '送出並產生洞察報告'}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 總結區域 (唯讀展示) */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-widest opacity-80">已標記的不適部位</div>
        <div className="flex flex-wrap gap-1.5">
          {selectedAreas.map(area => (
            <span key={area} className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded text-sm font-semibold shadow-sm">{area}</span>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {QUESTIONS.map((q, idx) => {
          // Hide future steps
          if (idx > currentStep) return null;

          const isCompleted = isValid(idx) && currentStep > idx;
          const isActive = currentStep === idx;

          return (
            <div key={q.id} className={`transition-all duration-500 ease-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-60 scale-[0.98]'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isCompleted ? 'bg-green-100 text-green-700' : isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                  {isCompleted ? '✓' : (idx + 1)}
                </div>
                <h3 className={`font-bold ${isActive ? 'text-slate-800 text-lg' : 'text-slate-600 text-base'}`}>
                  {q.title}
                </h3>
              </div>
              
              <div className="ml-11">
                {renderQuestionBody(idx)}
              </div>
            </div>
          );
        })}
        <div ref={stepEndRef} className="h-4" />
      </div>

    </div>
  );
}
