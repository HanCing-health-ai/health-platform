'use client';

import React, { useState, useCallback } from 'react';

/**
 * BodyMapSelector — V1.5 C組 互動式身體部位標記元件 (Refined MedTech)
 * 升級為科技風格、高亮光暈、適應暗色背景版本。
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

const BACK_REGIONS: BodyRegionDef[] = [
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

  const currentRegions = activeTab === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  const selectedList = Array.from(selected);

  return (
    <div className={`flex flex-col items-center glass-panel rounded-3xl p-6 relative overflow-hidden ${className}`}>
      
      {/* 科技背景紋路 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '20px 20px' }}></div>
      
      {/* 數量提示 */}
      <div className="absolute top-4 right-4 bg-indigo-500/20 border border-[var(--accent-primary)] px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-secondary)] animate-pulse"></div>
        <span className="text-[10px] font-black tracking-widest text-[var(--accent-secondary)] uppercase">ZONES: {selectedList.length}</span>
      </div>

      <div className="flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl mb-8 w-full max-w-xs relative z-10 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('front')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'front' ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
        >
          ANTERIOR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('back')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'back' ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
        >
          POSTERIOR
        </button>
      </div>

      {/* SVG Image Container */}
      <div className="relative w-full max-w-[240px] px-4 touch-none z-10 mx-auto group">
        {/* Glow behind the svg */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 blur-3xl transition-opacity bg-gradient-to-br from-indigo-500/30 to-cyan-500/30"></div>
        
        <svg viewBox="0 0 200 450" className="w-full relative z-10 drop-shadow-2xl select-none" role="img">
          {/* Default ambient body silhouette (optional, could implement later if full body needed) */}
          
          {currentRegions.map((region) => {
            const isSelected = selected.has(region.label);
            const isHovered = hoveredId === region.id;
            
            // Medtech specific colors
            let fill = 'rgba(255,255,255,0.03)';
            let stroke = 'rgba(255,255,255,0.1)';
            
            if (isSelected) {
              fill = 'var(--accent-primary)';
              stroke = 'var(--accent-secondary)';
            } else if (isHovered) {
              fill = 'rgba(255,255,255,0.15)';
              stroke = 'rgba(255,255,255,0.3)';
            }

            return (
              <g
                key={region.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleRegion(region.label)}
                onMouseEnter={() => setHoveredId(region.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer outline-none transition-all origin-center"
                style={{ 
                  filter: isSelected ? 'drop-shadow(0 0 8px var(--accent-primary)) drop-shadow(0 0 12px var(--accent-secondary))' : (isHovered ? 'drop-shadow(0 0 5px rgba(255,255,255,0.4))' : 'none') 
                }}
              >
                {region.elements.map((el, i) => {
                  const common = {
                    fill, stroke, strokeWidth: 1.5,
                    style: { transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
                  };
                  switch (el.type) {
                    case 'ellipse': return <ellipse key={i} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} {...common} />;
                    case 'rect': return <rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx ?? 0} {...common} />;
                    case 'path': return <path key={i} d={el.d} {...common} />;
                  }
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Tags list below */}
      <div className="w-full mt-8 relative z-10">
        <div className="flex flex-wrap gap-2 justify-center min-h-[48px]">
          {selectedList.length === 0 ? (
            <span className="text-xs text-[var(--text-secondary)] tracking-widest font-bold border border-[var(--border)] px-4 py-2 rounded-full uppercase bg-[var(--bg-primary)]/50">
              Awaiting Input
            </span>
          ) : (
            selectedList.map(label => (
              <span key={label} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] text-xs font-bold border border-[var(--accent-primary)]/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] backdrop-blur-md">
                {label}
                <button type="button" onClick={() => toggleRegion(label)} className="text-[var(--accent-secondary)] hover:text-white transition-colors ml-1 focus:outline-none">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
