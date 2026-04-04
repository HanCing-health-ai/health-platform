'use client';

import React, { useState, useCallback } from 'react';

/**
 * BodyMapSelector — V1.5 C組 互動式身體部位標記元件
 * 取代舊版按鈕式選擇，改為前後人體圖（Front & Back）
 * 可複選23個特定部位
 */

type SvgElementData =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { type: 'path'; d: string };

interface BodyRegionDef {
  id: string;
  label: string;
  view: 'front' | 'back';
  elements: SvgElementData[];
}

export interface BodyMapSelectorProps {
  defaultSelected?: string[];
  onChange?: (selectedLabels: string[]) => void;
  className?: string;
}

// === 正面區域 === 
// 視覺左側為「右」，視覺右側為「左」
const FRONT_REGIONS: BodyRegionDef[] = [
  { id: 'head-front', label: '頭部', view: 'front', elements: [{ type: 'ellipse', cx: 100, cy: 38, rx: 26, ry: 30 }] },
  { id: 'neck-front', label: '頸部', view: 'front', elements: [{ type: 'rect', x: 86, y: 70, width: 28, height: 18, rx: 5 }] },
  { id: 'shoulder-right', label: '右肩', view: 'front', elements: [{ type: 'path', d: 'M64,90 L36,98 L32,116 L64,112 Z' }] },
  { id: 'shoulder-left', label: '左肩', view: 'front', elements: [{ type: 'path', d: 'M136,90 L164,98 L168,116 L136,112 Z' }] },
  { id: 'chest', label: '胸部', view: 'front', elements: [{ type: 'rect', x: 66, y: 90, width: 68, height: 50, rx: 4 }] },
  { id: 'abs', label: '腹部', view: 'front', elements: [{ type: 'rect', x: 68, y: 144, width: 64, height: 50, rx: 4 }] },
  { id: 'arm-right-front', label: '右手臂', view: 'front', elements: [{ type: 'path', d: 'M32,118 L22,190 L42,196 L62,112 Z' }] },
  { id: 'arm-left-front', label: '左手臂', view: 'front', elements: [{ type: 'path', d: 'M168,118 L178,190 L158,196 L138,112 Z' }] },
  { id: 'wrist-right-front', label: '右手腕', view: 'front', elements: [{ type: 'path', d: 'M22,198 L16,226 L36,232 L42,198 Z' }] },
  { id: 'wrist-left-front', label: '左手腕', view: 'front', elements: [{ type: 'path', d: 'M178,198 L184,226 L164,232 L158,198 Z' }] },
  { id: 'thigh-right-front', label: '右大腿', view: 'front', elements: [{ type: 'rect', x: 64, y: 198, width: 34, height: 80, rx: 6 }] },
  { id: 'thigh-left-front', label: '左大腿', view: 'front', elements: [{ type: 'rect', x: 102, y: 198, width: 34, height: 80, rx: 6 }] },
  { id: 'knee-right', label: '右膝', view: 'front', elements: [{ type: 'ellipse', cx: 81, cy: 290, rx: 15, ry: 12 }] },
  { id: 'knee-left', label: '左膝', view: 'front', elements: [{ type: 'ellipse', cx: 119, cy: 290, rx: 15, ry: 12 }] },
  { id: 'calf-right-front', label: '右小腿', view: 'front', elements: [{ type: 'rect', x: 68, y: 306, width: 26, height: 60, rx: 6 }] },
  { id: 'calf-left-front', label: '左小腿', view: 'front', elements: [{ type: 'rect', x: 106, y: 306, width: 26, height: 60, rx: 6 }] },
  { id: 'ankle-right-front', label: '右腳踝', view: 'front', elements: [{ type: 'ellipse', cx: 81, cy: 380, rx: 14, ry: 10 }] },
  { id: 'ankle-left-front', label: '左腳踝', view: 'front', elements: [{ type: 'ellipse', cx: 119, cy: 380, rx: 14, ry: 10 }] },
];

// === 背面區域 ===
// 視覺左側為「左」，視覺右側為「右」
const BACK_REGIONS: BodyRegionDef[] = [
  // 頭與頸部可做成通用，但這邊給獨立背面對應
  { id: 'head-back', label: '頭部', view: 'back', elements: [{ type: 'ellipse', cx: 100, cy: 38, rx: 26, ry: 30 }] },
  { id: 'neck-back', label: '頸部', view: 'back', elements: [{ type: 'rect', x: 86, y: 70, width: 28, height: 18, rx: 5 }] },
  { id: 'upper-back', label: '上背部', view: 'back', elements: [{ type: 'rect', x: 66, y: 90, width: 68, height: 50, rx: 4 }] },
  { id: 'lower-back', label: '下背部', view: 'back', elements: [{ type: 'rect', x: 68, y: 144, width: 64, height: 40, rx: 4 }] },
  { id: 'waist', label: '腰部', view: 'back', elements: [{ type: 'rect', x: 68, y: 188, width: 64, height: 20, rx: 4 }] },
  { id: 'hip-left', label: '左臀', view: 'back', elements: [{ type: 'path', d: 'M68,212 L60,250 L84,250 L100,212 Z' }] },
  { id: 'hip-right', label: '右臀', view: 'back', elements: [{ type: 'path', d: 'M132,212 L140,250 L116,250 L100,212 Z' }] },
  { id: 'shoulder-left-back', label: '左肩', view: 'back', elements: [{ type: 'path', d: 'M64,90 L36,98 L32,116 L64,112 Z' }] },
  { id: 'shoulder-right-back', label: '右肩', view: 'back', elements: [{ type: 'path', d: 'M136,90 L164,98 L168,116 L136,112 Z' }] },
  { id: 'arm-left-back', label: '左手臂', view: 'back', elements: [{ type: 'path', d: 'M32,118 L22,190 L42,196 L62,112 Z' }] },
  { id: 'arm-right-back', label: '右手臂', view: 'back', elements: [{ type: 'path', d: 'M168,118 L178,190 L158,196 L138,112 Z' }] },
  { id: 'wrist-left-back', label: '左手腕', view: 'back', elements: [{ type: 'path', d: 'M22,198 L16,226 L36,232 L42,198 Z' }] },
  { id: 'wrist-right-back', label: '右手腕', view: 'back', elements: [{ type: 'path', d: 'M178,198 L184,226 L164,232 L158,198 Z' }] },
  { id: 'thigh-left-back', label: '左大腿', view: 'back', elements: [{ type: 'rect', x: 64, y: 254, width: 34, height: 80, rx: 6 }] },
  { id: 'thigh-right-back', label: '右大腿', view: 'back', elements: [{ type: 'rect', x: 102, y: 254, width: 34, height: 80, rx: 6 }] },
  { id: 'calf-left-back', label: '左小腿', view: 'back', elements: [{ type: 'rect', x: 68, y: 340, width: 26, height: 60, rx: 6 }] },
  { id: 'calf-right-back', label: '右小腿', view: 'back', elements: [{ type: 'rect', x: 106, y: 340, width: 26, height: 60, rx: 6 }] },
  { id: 'ankle-left-back', label: '左腳踝', view: 'back', elements: [{ type: 'ellipse', cx: 81, cy: 410, rx: 14, ry: 10 }] },
  { id: 'ankle-right-back', label: '右腳踝', view: 'back', elements: [{ type: 'ellipse', cx: 119, cy: 410, rx: 14, ry: 10 }] },
];

const COLORS = {
  default: '#f1f5f9',    // slate-100
  hover: '#e2e8f0',      // slate-200
  selected: '#3b82f6',   // blue-500
  selectedHover: '#2563eb', // blue-600
  stroke: '#cbd5e1',     // slate-300
  selectedStroke: '#1d4ed8', // blue-700
} as const;

export default function BodyMapSelector({ defaultSelected = [], onChange, className = '' }: BodyMapSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');

  const toggleRegion = useCallback((label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      onChange?.(Array.from(next));
      return next;
    });
  }, [onChange]);

  // Combine regions logically so we can map easily
  const currentRegions = activeTab === 'front' ? FRONT_REGIONS : BACK_REGIONS;

  const renderSvgElement = (el: SvgElementData, key: number, fill: string, stroke: string) => {
    const common = {
      fill, stroke, strokeWidth: 1.5,
      style: { transition: 'fill 0.15s ease, stroke 0.15s ease' }
    };
    switch (el.type) {
      case 'ellipse': return <ellipse key={key} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} {...common} />;
      case 'rect': return <rect key={key} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx ?? 0} {...common} />;
      case 'path': return <path key={key} d={el.d} {...common} />;
    }
  };

  const selectedList = Array.from(selected);

  return (
    <div className={`flex flex-col items-center bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
      
      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-full max-w-xs">
        <button
          type="button"
          onClick={() => setActiveTab('front')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${activeTab === 'front' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          正面部位
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('back')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${activeTab === 'back' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          背面部位
        </button>
      </div>

      <div className="text-sm text-slate-500 mb-2 font-medium">請點擊標記不適部位（可複選）</div>

      {/* SVG Image */}
      <div className="relative w-full max-w-[240px] px-4">
        <svg viewBox="0 0 200 450" className="w-full drop-shadow-sm select-none" role="img">
          {currentRegions.map((region) => {
            const isSelected = selected.has(region.label);
            const isHovered = hoveredId === region.id;
            
            let fill: string = COLORS.default;
            let stroke: string = COLORS.stroke;
            if (isSelected) {
              fill = isHovered ? COLORS.selectedHover : COLORS.selected;
              stroke = COLORS.selectedStroke;
            } else if (isHovered) {
              fill = COLORS.hover;
            }

            return (
              <g
                key={region.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleRegion(region.label)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleRegion(region.label);
                  }
                }}
                onMouseEnter={() => setHoveredId(region.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer outline-none focus:ring-2 focus:ring-indigo-300 active:scale-95 origin-center"
              >
                {region.elements.map((el, i) => renderSvgElement(el, i, fill, stroke))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Tags */}
      <div className="w-full mt-6">
        <div className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">已選取部位 ({selectedList.length})</div>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {selectedList.length === 0 ? (
            <span className="text-sm text-slate-400 font-medium">尚無選取部位</span>
          ) : (
            selectedList.map(label => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-200">
                {label}
                <button type="button" onClick={() => toggleRegion(label)} className="text-blue-400 hover:text-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
