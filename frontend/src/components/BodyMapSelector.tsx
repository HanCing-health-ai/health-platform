'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Model, { IMuscleStats, Muscle } from 'react-body-highlighter';

/**
 * BodyMapSelector — V1.5 C組 互動式身體部位標記元件 (High Fidelity Edition)
 * 使用 react-body-highlighter 提供解剖學精確的肌肉輪廓。
 */

export interface BodyMapSelectorProps {
  defaultSelected?: string[];
  onChange?: (selectedLabels: string[]) => void;
  className?: string;
}

/* ============================================================
 * 肌肉對映字典 (肌肉名稱 -> 繁體中文標籤)
 * ============================================================ */
const MUSCLE_TO_LABEL: Record<string, string> = {
  // Front
  head: '頭部',
  neck: '頸部',
  'front-deltoids': '肩部',
  'back-deltoids': '肩部',
  chest: '胸部',
  abs: '腹部',
  obliques: '腰部/側腹',
  biceps: '手臂',
  triceps: '手臂',
  forearm: '手腕',
  quadriceps: '大腿',
  abductors: '大腿外側',
  adductor: '大腿內側',
  knees: '膝部',
  calves: '小腿',
  
  // Back
  trapezius: '上背部',
  'upper-back': '上背部',
  'lower-back': '下背部',
  gluteal: '臀部',
  hamstring: '大腿後側',
  'left-soleus': '腳踝/腳跟',
  'right-soleus': '腳踝/腳跟',
};

// 逆向查詢：由標籤獲取所有對應的肌肉 ID
const LABEL_TO_MUSCLES = Object.entries(MUSCLE_TO_LABEL).reduce(
  (acc, [muscle, label]) => {
    if (!acc[label]) acc[label] = [];
    acc[label].push(muscle);
    return acc;
  },
  {} as Record<string, string[]>
);

export default function BodyMapSelector({ defaultSelected = [], onChange, className = '' }: BodyMapSelectorProps) {
  // 保存的是「標籤名稱」，如 ['頭部', '肩部']
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(
    () => new Set(defaultSelected)
  );

  const [activeTab, setActiveTab] = useState<'anterior' | 'posterior'>('anterior');

  /**
   * 當點擊肌肉時，切換該肌肉所屬標籤的選取狀態
   */
  const handleMuscleClick = useCallback(
    (stats: IMuscleStats) => {
      const muscleName: string = stats.muscle;
      const label = MUSCLE_TO_LABEL[muscleName];

      if (!label) return;

      setSelectedLabels((prev) => {
        const next = new Set(prev);
        if (next.has(label)) {
          next.delete(label);
        } else {
          next.add(label);
        }
        onChange?.(Array.from(next));
        return next;
      });
    },
    [onChange]
  );

  /**
   * 將選取的標籤轉換為 Model 元件所需的亮顯資料格式
   */
  const highlightedData = useMemo(() => {
    const musclesToHighlight: Muscle[] = [];
    selectedLabels.forEach((label) => {
      const muscles = LABEL_TO_MUSCLES[label] || [];
      musclesToHighlight.push(...(muscles as Muscle[]));
    });

    return [
      {
        name: 'Selected',
        muscles: musclesToHighlight,
      },
    ];
  }, [selectedLabels]);

  const labelsArray = Array.from(selectedLabels);

  return (
    <div className={`flex flex-col items-center glass-panel rounded-3xl p-6 relative overflow-hidden ${className}`}>
      
      {/* 科技背景紋路 (裝飾) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '20px 20px' }} />
      
      {/* 數量指示器 */}
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm z-20">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
        <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
          Zones: {labelsArray.length}
        </span>
      </div>

      {/* 視角切換器 (Glassmorphism Tabs) */}
      <div className="flex bg-slate-950/40 border border-white/5 p-1 rounded-2xl mb-8 w-full max-w-xs relative z-10 shadow-inner backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('anterior')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-380 ${
            activeTab === 'anterior' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Anterior 正面
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('posterior')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-380 ${
            activeTab === 'posterior' 
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.02]' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Posterior 背面
        </button>
      </div>

      {/* 互動式人體模型載體 */}
      <div className="relative w-full max-w-[280px] px-2 py-4 mb-6 z-10 group">
        {/* 動態光暈效果 (隨視角變色) */}
        <div className={`absolute inset-0 blur-[60px] opacity-10 transition-colors duration-1000 pointer-events-none ${
          activeTab === 'anterior' ? 'bg-blue-500' : 'bg-purple-500'
        }`} />
        
        <div className="relative z-10 transition-all duration-500 drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] group-hover:scale-[1.01]">
          <Model
            data={highlightedData}
            style={{ width: '100%', height: 'auto' }}
            onClick={handleMuscleClick}
            type={activeTab}
            bodyColor="#0f172a" // 核心深藍
            highlightedColors={
               activeTab === 'anterior' 
                 ? ['#3b82f6', '#22d3ee'] // 藍->青 漸層感
                 : ['#a855f7', '#f472b6'] // 紫->粉 漸層感
            }
          />
        </div>
      </div>

      {/* 選取狀態標籤區 */}
      <div className="w-full relative z-10 flex flex-wrap gap-2 justify-center min-h-[48px]">
        {labelsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase opacity-60">
              Interactive Anatomical Scan
            </span>
            <span className="text-xs text-slate-600 italic">請點擊上方部位進行標記</span>
          </div>
        ) : (
          labelsArray.map(label => (
            <div 
              key={label} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-white/30 hover:bg-white/10"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === 'anterior' ? 'bg-blue-400' : 'bg-purple-400'
              }`} />
              <span className="text-white text-xs font-bold tracking-tight">{label}</span>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedLabels((prev) => {
                    const next = new Set(prev);
                    next.delete(label);
                    onChange?.(Array.from(next));
                    return next;
                  });
                }} 
                className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500/80 hover:text-white transition-all text-[10px] text-slate-500"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
