'use client';

import React, { useState, useCallback, useMemo } from 'react';

/**
 * BodyMap — 互動式人體部位標記元件
 * 使用者點擊身體部位即可標記不適區域，選中後變色
 * 回傳結構化的部位名稱陣列（string[]）
 */

/* ============================================================
 * 型別定義
 * ============================================================ */

/** 單一 SVG 元素描述 */
type SvgElementData =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { type: 'path'; d: string };

/** 身體區域定義（雙側部位包含多個 SVG 元素） */
interface BodyRegionDef {
  id: string;
  label: string;
  elements: SvgElementData[];
}

/** BodyMap 元件的 Props */
export interface BodyMapProps {
  /** 預設已選取的部位標籤陣列 */
  defaultSelected?: string[];
  /** 選取狀態變更時的回呼，回傳所有已選取的部位標籤 */
  onChange?: (selectedLabels: string[]) => void;
  /** 附加的 CSS class */
  className?: string;
  /** 是否為唯讀模式 */
  readOnly?: boolean;
}

/* ============================================================
 * 12 個身體區域定義（viewBox: 0 0 200 430）
 * 雙側部位（肩、手臂、手腕、大腿、膝蓋、小腿、腳踝）
 * 點選任一側即選取整組
 * ============================================================ */
const BODY_REGIONS: BodyRegionDef[] = [
  {
    id: 'head',
    label: '頭',
    elements: [{ type: 'ellipse', cx: 100, cy: 38, rx: 26, ry: 30 }],
  },
  {
    id: 'neck',
    label: '頸',
    elements: [{ type: 'rect', x: 86, y: 70, width: 28, height: 18, rx: 5 }],
  },
  {
    id: 'shoulder',
    label: '肩',
    elements: [
      { type: 'path', d: 'M64,90 L36,98 L32,116 L64,112 Z' },
      { type: 'path', d: 'M136,90 L164,98 L168,116 L136,112 Z' },
    ],
  },
  {
    id: 'upper-back',
    label: '上背',
    elements: [{ type: 'rect', x: 66, y: 90, width: 68, height: 56, rx: 4 }],
  },
  {
    id: 'lower-back',
    label: '下背',
    elements: [{ type: 'rect', x: 68, y: 148, width: 64, height: 48, rx: 4 }],
  },
  {
    id: 'arm',
    label: '手臂',
    elements: [
      { type: 'path', d: 'M32,118 L22,190 L42,196 L62,112 Z' },
      { type: 'path', d: 'M168,118 L178,190 L158,196 L138,112 Z' },
    ],
  },
  {
    id: 'wrist',
    label: '手腕',
    elements: [
      { type: 'path', d: 'M22,198 L16,226 L36,232 L42,198 Z' },
      { type: 'path', d: 'M178,198 L184,226 L164,232 L158,198 Z' },
    ],
  },
  {
    id: 'hip',
    label: '臀',
    elements: [
      { type: 'path', d: 'M68,198 L60,236 L64,246 L136,246 L140,236 L132,198 Z' },
    ],
  },
  {
    id: 'thigh',
    label: '大腿',
    elements: [
      { type: 'rect', x: 64, y: 248, width: 34, height: 68, rx: 6 },
      { type: 'rect', x: 102, y: 248, width: 34, height: 68, rx: 6 },
    ],
  },
  {
    id: 'knee',
    label: '膝蓋',
    elements: [
      { type: 'ellipse', cx: 81, cy: 330, rx: 15, ry: 12 },
      { type: 'ellipse', cx: 119, cy: 330, rx: 15, ry: 12 },
    ],
  },
  {
    id: 'calf',
    label: '小腿',
    elements: [
      { type: 'rect', x: 68, y: 344, width: 26, height: 54, rx: 6 },
      { type: 'rect', x: 106, y: 344, width: 26, height: 54, rx: 6 },
    ],
  },
  {
    id: 'ankle',
    label: '腳踝',
    elements: [
      { type: 'ellipse', cx: 81, cy: 410, rx: 14, ry: 10 },
      { type: 'ellipse', cx: 119, cy: 410, rx: 14, ry: 10 },
    ],
  },
];

/* ============================================================
 * 色彩及漸層常數 (3D 透亮風格)
 * ============================================================ */
const COLORS = {
  default: 'url(#baseGradient)',
  hover: 'url(#hoverGradient)',
  selected: 'url(#selectedGradient)',
  selectedHover: 'url(#selectedGradientBright)',
  stroke: 'rgba(255, 255, 255, 0.15)',
  hoverStroke: '#38bdf8',
  selectedStroke: '#c084fc',
} as const;

/* ============================================================
 * SVG 元素渲染輔助函式
 * ============================================================ */
function renderSvgElement(
  el: SvgElementData,
  key: number,
  fill: string,
  stroke: string,
): React.ReactNode {
  const common = {
    fill,
    stroke,
    strokeWidth: 1.2,
    filter: 'url(#internal-volume)',
    style: { transition: 'fill 0.4s ease, stroke 0.4s ease' },
  };

  switch (el.type) {
    case 'ellipse':
      return <ellipse key={key} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} {...common} />;
    case 'rect':
      return (
        <rect
          key={key}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          rx={el.rx ?? 0}
          {...common}
        />
      );
    case 'path':
      return <path key={key} d={el.d} {...common} />;
  }
}

/* ============================================================
 * BodyMap 主元件
 * ============================================================ */
export default function BodyMap({
  defaultSelected = [],
  onChange,
  className = '',
  readOnly = false,
}: BodyMapProps) {
  /* 選取狀態管理 */
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /** 切換指定部位的選取狀態 */
  const toggleRegion = useCallback(
    (label: string) => {
      if (readOnly) return;
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
    },
    [onChange, readOnly],
  );

  /** 依定義順序排列的已選取標籤（確保輸出穩定） */
  const selectedLabels = useMemo(
    () => BODY_REGIONS.filter((r) => selected.has(r.label)).map((r) => r.label),
    [selected],
  );

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 操作提示 */}
      <p className="text-sm text-slate-500 font-medium">
        請點擊不適部位（可複選）
      </p>

      {/* SVG 人體圖 */}
      <svg
        viewBox="0 0 200 430"
        className="w-full max-w-[280px] select-none"
        role="img"
        aria-label="互動式人體部位標記圖"
        style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))' }}
      >
        <defs>
          {/* Base 3D Glassy Texture */}
          <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
          </linearGradient>
          {/* Hover Neon Blue */}
          <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
          </linearGradient>
          {/* Selected MedTech Glow (Indigo-Purple mix) */}
          <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="selectedGradientBright" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>

          {/* 3D Volumetric Bevel and Inner Shadow filter */}
          <filter id="internal-volume" x="-20%" y="-20%" width="140%" height="140%">
            {/* Top-left Highlight (Specular) */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blurHL" />
            <feOffset dx="-1.5" dy="-1.5" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="hlDiff" />
            <feFlood floodColor="rgba(255,255,255,0.7)" floodOpacity="1" />
            <feComposite in2="hlDiff" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" result="highlighted" />
            
            {/* Bottom-right Shadow (Dark core) */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blurSH" />
            <feOffset dx="2.5" dy="2.5" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shDiff" />
            <feFlood floodColor="rgba(0,0,0,0.7)" floodOpacity="1" />
            <feComposite in2="shDiff" operator="in" />
            <feComposite in2="highlighted" operator="over" />
          </filter>
        </defs>

        {BODY_REGIONS.map((region) => {
          const isSelected = selected.has(region.label);
          const isHovered = hoveredId === region.id;

          /* 根據狀態決定填充與邊框色及外層光暈 */
          let fill: string = COLORS.default;
          let stroke: string = COLORS.stroke;
          let glowClass = '';

          if (isSelected && isHovered) {
            fill = COLORS.selectedHover;
            stroke = COLORS.selectedStroke;
            glowClass = 'drop-shadow-[0_0_15px_rgba(167,139,250,0.9)]';
          } else if (isSelected) {
            fill = COLORS.selected;
            stroke = COLORS.selectedStroke;
            glowClass = 'drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]';
          } else if (isHovered) {
            fill = COLORS.hover;
            stroke = COLORS.hoverStroke;
            glowClass = 'drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]';
          }

          return (
            <g
              key={region.id}
              className={`transition-all duration-300 ${glowClass}`}
              role="button"
              tabIndex={readOnly ? undefined : 0}
              aria-label={`${region.label}${isSelected ? '（已選取）' : ''}`}
              aria-pressed={isSelected}
              onClick={() => toggleRegion(region.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleRegion(region.label);
                }
              }}
              onMouseEnter={() => setHoveredId(region.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(region.id)}
              onBlur={() => setHoveredId(null)}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              {region.elements.map((el, i) => renderSvgElement(el, i, fill, stroke))}
            </g>
          );
        })}
      </svg>

      {/* 已選取部位 Badge 列表 */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-sm font-bold tracking-widest shadow-[0_4px_15px_rgba(99,102,241,0.4)] border border-white/20 transition-transform duration-300 hover:scale-105"
            >
              {label}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => toggleRegion(label)}
                  className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all text-[10px] leading-none"
                  aria-label={`移除 ${label}`}
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* 空狀態提示 */}
      {selectedLabels.length === 0 && (
        <p className="text-xs text-slate-400">尚未選取任何部位</p>
      )}
    </div>
  );
}
