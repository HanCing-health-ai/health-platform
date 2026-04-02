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
 * 色彩常數
 * ============================================================ */
const COLORS = {
  default: '#e2e8f0',
  hover: '#cbd5e1',
  selected: '#5eead4',
  selectedHover: '#2dd4bf',
  stroke: '#94a3b8',
  selectedStroke: '#14b8a6',
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
    style: { transition: 'fill 0.2s ease, stroke 0.2s ease' },
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
      >
        {BODY_REGIONS.map((region) => {
          const isSelected = selected.has(region.label);
          const isHovered = hoveredId === region.id;

          /* 根據狀態決定填充與邊框色 */
          let fill: string = COLORS.default;
          let stroke: string = COLORS.stroke;
          if (isSelected && isHovered) {
            fill = COLORS.selectedHover;
            stroke = COLORS.selectedStroke;
          } else if (isSelected) {
            fill = COLORS.selected;
            stroke = COLORS.selectedStroke;
          } else if (isHovered) {
            fill = COLORS.hover;
          }

          return (
            <g
              key={region.id}
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
        <div className="flex flex-wrap gap-2 justify-center">
          {selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 text-sm font-medium"
            >
              {label}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => toggleRegion(label)}
                  className="ml-1 text-teal-500 hover:text-teal-700 text-xs leading-none"
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
