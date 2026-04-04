'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * GuidedQuestionnaire — 逐步引導式提問問卷 (Refined MedTech)
 * 加入卡片式 hover 發光、Qx/8 進度指示、滑動淡入。
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
  { id: 'q2', type: 'multiple', title: '不適感覺的主要特徵？', options: ['痠', '緊', '痛', '麻', '沉重感'] },
  { id: 'q3', type: 'single-other', title: '主要負荷來源（工作）？', options: ['久坐辦公', '久站', '勞力工作', '其他'] },
  { id: 'q4', type: 'single', title: '有無規律運動習慣？', options: ['沒有', '偶爾', '規律運動'] },
  { id: 'q5', type: 'single', title: '近期睡眠修復狀況？', options: ['充足', '偶爾不足', '長期睡眠不足'] },
  { id: 'q6', type: 'single', title: '日常水分攝取狀況？', options: ['很少喝水', '普通', '喝水充足'] },
  { id: 'q7', type: 'single', title: '飲食攝取模式？', options: ['規律正常', '不規律', '偏油膩重口味', '素食'] },
  { id: 'q8', type: 'text', title: '特殊備註（包含舊傷、開刀紀錄）' },
];

export default function GuidedQuestionnaire({ selectedAreas, onSubmit, isSubmitting = false }: GuidedQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const [duration, setDuration] = useState('');
  const [discomfortType, setDiscomfortType] = useState<string[]>([]);
  const [workType, setWorkType] = useState('');
  const [workOther, setWorkOther] = useState('');
  const [exercise, setExercise] = useState('');
  const [sleep, setSleep] = useState('');
  const [water, setWater] = useState('');
  const [diet, setDiet] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');

  const stepEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentStep > 0) {
      setTimeout(() => {
        stepEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
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
      duration, discomfort_type: discomfortType, work_type: workType, work_other: workOther,
      exercise, sleep, water, diet, chief_complaint: chiefComplaint
    });
  };

  const isValid = (stepIdx: number) => {
    switch (stepIdx) {
      case 0: return duration !== '';
      case 1: return discomfortType.length > 0;
      case 2: return workType !== '' && (workType !== '其他' || workOther.trim() !== '');
      case 3: return exercise !== '';
      case 4: return sleep !== '';
      case 5: return water !== '';
      case 6: return diet !== '';
      case 7: return true;
      default: return false;
    }
  };

  // Helper for rendering uniform tech cards
  const TechOption = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
    <button type="button" onClick={onClick}
      className={`relative px-5 py-4 rounded-xl text-sm font-bold border transition-all duration-300 overflow-hidden group
        ${active ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-secondary)]/50 hover:text-white'}
      `}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-[var(--accent-secondary)]/10 to-transparent transition-opacity ${active && '!opacity-0'}`}></div>
      {label}
    </button>
  );

  const renderQuestionBody = (idx: number) => {
    const q = QUESTIONS[idx];

    if (q.id === 'q1') {
      return (
        <div className="grid grid-cols-2 gap-3">
          {q.options?.map(opt => (
            <TechOption key={opt} active={duration === opt} label={opt} onClick={() => { setDuration(opt); setTimeout(() => handleNext(), 300); }} />
          ))}
        </div>
      );
    }
    
    if (q.id === 'q2') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {q.options?.map(opt => (
              <TechOption key={opt} active={discomfortType.includes(opt)} label={opt} onClick={() => toggleMultiple(opt)} />
            ))}
          </div>
          <button type="button" disabled={discomfortType.length === 0} onClick={handleNext}
             className="w-full flex justify-between items-center px-6 py-4 bg-[var(--accent-primary)] text-white rounded-xl font-black text-sm tracking-widest disabled:opacity-30 disabled:grayscale hover:bg-indigo-500 transition-all active:scale-[0.98] glow-primary border border-indigo-400">
            <span>CONFIRM SELECTION</span>
            <span>&rarr;</span>
          </button>
        </div>
      );
    }

    if (q.id === 'q3') {
      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {q.options?.map(opt => (
              <TechOption key={opt} active={workType === opt} label={opt} onClick={() => { setWorkType(opt); if (opt !== '其他') setTimeout(() => handleNext(), 300); }} />
            ))}
          </div>
          {workType === '其他' && (
            <div className="flex gap-3 items-center mt-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <input type="text" value={workOther} onChange={e => setWorkOther(e.target.value)} placeholder="Type specific pattern..."
                className="w-full input-underline p-3 text-sm font-medium focus:ring-0" 
              />
              <button type="button" disabled={workOther.trim() === ''} onClick={handleNext} className="shrink-0 bg-white/10 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/50 px-5 py-3 rounded-lg font-bold text-xs disabled:opacity-30 transition-all hover:bg-[var(--accent-secondary)] hover:text-white">
                ENTER
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options?.map(opt => (
            <TechOption key={opt} active={currentVal === opt} label={opt} onClick={() => { setter(opt); setTimeout(() => handleNext(), 300); }} />
          ))}
        </div>
      );
    }

    if (q.id === 'q8') {
      return (
        <div className="space-y-6">
          <textarea rows={4} placeholder="例如：車禍舊傷、脊椎側彎、或曾接受過手術..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)}
            className="w-full rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] p-5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-secondary)] focus:ring-1 focus:ring-[var(--accent-secondary)] shadow-inner transition-all resize-none"
          />
          <button type="button" disabled={isSubmitting} onClick={handleSubmit}
             className="w-full py-5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-2xl font-black text-lg tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale glow-primary border border-white/20">
            {isSubmitting ? 'Transmitting Data...' : 'Generate Insight'}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="w-full relative">
      
      {/* 總結區域 */}
      <div className="glass-panel p-5 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-[var(--accent-primary)]/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
        <div>
          <div className="text-[10px] font-black text-[var(--accent-secondary)] mb-1.5 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--accent-secondary)] rounded-full animate-pulse"></span>
            Target Zones Initialized
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map(area => (
              <span key={area} className="text-white text-xs font-bold">{area}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-black text-[var(--accent-primary)] opacity-80 font-heading">
            {Math.min(currentStep + 1, QUESTIONS.length)}<span className="text-[var(--text-secondary)] text-xl">/8</span>
          </div>
        </div>
      </div>

      <div className="space-y-12 relative z-10 pl-4 border-l-2 border-[var(--border)]">
        {QUESTIONS.map((q, idx) => {
          if (idx > currentStep) return null;

          const isCompleted = isValid(idx) && currentStep > idx;
          const isActive = currentStep === idx;

          return (
            <div key={q.id} className={`transition-all duration-700 ease-in-out relative ${isActive ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
              
              {/* Timeline dot */}
              <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 transition-all duration-300 ${isCompleted ? 'bg-[var(--accent-secondary)] border-[var(--accent-secondary)] shadow-[0_0_10px_var(--accent-secondary)]' : isActive ? 'bg-transparent border-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)] animate-pulse' : 'bg-transparent border-[var(--border)]'}`}></div>

              <div className="mb-4">
                <h3 className={`font-black tracking-wide ${isActive ? 'text-white text-lg drop-shadow-md' : 'text-[var(--text-secondary)] text-base'}`}>
                  {q.title}
                </h3>
              </div>
              
              <div className="pl-2">
                {renderQuestionBody(idx)}
              </div>
            </div>
          );
        })}
        <div ref={stepEndRef} className="h-8" />
      </div>

    </div>
  );
}
