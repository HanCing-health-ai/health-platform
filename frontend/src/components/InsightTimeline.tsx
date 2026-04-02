'use client';

import React, { useMemo } from 'react';

/**
 * InsightTimeline — 歷史 AI 分析時間軸元件
 * 顯示客戶過去的所有 AI 分析記錄，支援縱向回訪週期標記
 * 每筆記錄包含：日期、主要標籤、改善分數變化
 */

/* ============================================================
 * 型別定義
 * ============================================================ */

/** 單筆 AI 分析記錄（對應 insight_reports + follow_up_responses） */
export interface InsightRecord {
  /** 報告 UUID */
  id: string;
  /** 分析建立日期（ISO string） */
  created_at: string;
  /** 行為模式類型（如：久坐累積型） */
  pattern_type: string | null;
  /** 行為模式標籤陣列 */
  lifestyle_tags: string[];
  /** AI 信心分數 0-1 */
  confidence_score: number | null;
  /** 回訪改善分數 1-5（來自 follow_up_responses，若無回訪則為 null） */
  improvement_score: number | null;
  /** 師傅版分析摘要（截短顯示） */
  analysis_summary: string | null;
}

/** InsightTimeline 元件的 Props */
export interface InsightTimelineProps {
  /** 分析記錄陣列（元件內部會依時間排序） */
  records: InsightRecord[];
  /** 附加的 CSS class */
  className?: string;
  /** 第一次記錄的日期（用於計算回訪週期，若不提供則取 records 中最早日期） */
  baselineDate?: string;
}

/* ============================================================
 * 常數
 * ============================================================ */

/** 回訪週期天數 */
const FOLLOWUP_CYCLES = [28, 56, 84] as const;

/** 改善分數標籤對照（避免使用醫療用語） */
const SCORE_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: '尚無改善', color: 'text-red-500' },
  2: { text: '略有感受', color: 'text-orange-500' },
  3: { text: '持平穩定', color: 'text-yellow-600' },
  4: { text: '明顯改善', color: 'text-emerald-500' },
  5: { text: '大幅改善', color: 'text-teal-600' },
};

/* ============================================================
 * 輔助函式
 * ============================================================ */

/** 格式化日期為繁中易讀格式 */
function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}/${m.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

/** 計算兩個日期之間的天數差 */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
  );
}

/** 取得改善分數的變化箭頭與文字 */
function getScoreChange(
  current: number | null,
  previous: number | null,
): { arrow: string; label: string; color: string } | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (diff > 0) return { arrow: '↑', label: `+${diff}`, color: 'text-emerald-500' };
  if (diff < 0) return { arrow: '↓', label: `${diff}`, color: 'text-red-500' };
  return { arrow: '→', label: '±0', color: 'text-slate-400' };
}

/* ============================================================
 * InsightTimeline 主元件
 * ============================================================ */
export default function InsightTimeline({
  records,
  className = '',
  baselineDate,
}: InsightTimelineProps) {
  /** 依時間倒序排列的記錄 */
  const sortedRecords = useMemo(
    () => [...records].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    [records],
  );

  /** 基準日期（用於計算回訪週期） */
  const baseline = useMemo(() => {
    if (baselineDate) return baselineDate;
    if (sortedRecords.length === 0) return null;
    return sortedRecords[sortedRecords.length - 1].created_at;
  }, [baselineDate, sortedRecords]);

  /** 計算回訪週期標記位置 */
  const cycleMarkers = useMemo(() => {
    if (!baseline) return [];
    return FOLLOWUP_CYCLES.map((days) => {
      const markerDate = new Date(baseline);
      markerDate.setDate(markerDate.getDate() + days);
      return { days, date: markerDate.toISOString() };
    });
  }, [baseline]);

  /* ---- 空狀態 ---- */
  if (sortedRecords.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
            <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm font-medium">尚無分析記錄</p>
        <p className="text-slate-400 text-xs mt-1">完成首次問卷後將顯示時間軸</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          📊 歷次分析紀錄
        </h3>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
          共 {sortedRecords.length} 筆
        </span>
      </div>

      {/* 回訪週期圖例 */}
      {baseline && (
        <div className="flex gap-3 mb-4 text-xs">
          {FOLLOWUP_CYCLES.map((days) => (
            <span key={days} className="inline-flex items-center gap-1 text-slate-500">
              <span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block" />
              {days} 天週期
            </span>
          ))}
        </div>
      )}

      {/* 時間軸主體 */}
      <div className="relative">
        {/* 垂直軸線 */}
        <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-slate-200" />

        {sortedRecords.map((record, index) => {
          /* 計算與前一筆的改善分數變化（時間順序上的「前一筆」= 索引 +1） */
          const previousRecord = index < sortedRecords.length - 1
            ? sortedRecords[index + 1]
            : null;
          const scoreChange = getScoreChange(
            record.improvement_score,
            previousRecord?.improvement_score ?? null,
          );

          /* 計算距基準日的天數 */
          const daysFromBaseline = baseline
            ? daysBetween(baseline, record.created_at)
            : null;

          /* 判斷此記錄是否落在某個回訪週期附近（±3 天） */
          const matchedCycle = cycleMarkers.find((marker) => {
            const diff = Math.abs(daysBetween(marker.date, record.created_at));
            return diff <= 3;
          });

          return (
            <div key={record.id} className="relative pl-12 pb-6 last:pb-0">
              {/* 時間軸節點圓點 */}
              <div
                className={`absolute left-[10px] top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center
                  ${matchedCycle
                    ? 'border-amber-400 bg-amber-50'
                    : record.improvement_score && record.improvement_score >= 4
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-300 bg-white'
                  }`}
              >
                {matchedCycle && (
                  <span className="text-[8px] font-bold text-amber-600">
                    {matchedCycle.days}
                  </span>
                )}
              </div>

              {/* 記錄卡片 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* 第一行：日期 + 天數標記 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {formatDate(record.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    {daysFromBaseline !== null && daysFromBaseline > 0 && (
                      <span className="text-xs text-slate-400">
                        第 {daysFromBaseline} 天
                      </span>
                    )}
                    {matchedCycle && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {matchedCycle.days}天回訪
                      </span>
                    )}
                  </div>
                </div>

                {/* 第二行：行為模式類型 */}
                {record.pattern_type && (
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="text-slate-400">模式：</span>
                    {record.pattern_type}
                  </p>
                )}

                {/* 第三行：標籤陣列 */}
                {record.lifestyle_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {record.lifestyle_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 第四行：改善分數 + 變化 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {record.improvement_score !== null ? (
                      <>
                        <span className="text-xs text-slate-400">改善程度：</span>
                        <span className={`text-sm font-semibold ${SCORE_LABELS[record.improvement_score]?.color ?? 'text-slate-600'}`}>
                          {SCORE_LABELS[record.improvement_score]?.text ?? `${record.improvement_score}/5`}
                        </span>
                        {scoreChange && (
                          <span className={`text-xs font-medium ${scoreChange.color}`}>
                            {scoreChange.arrow} {scoreChange.label}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-300 italic">尚無回訪資料</span>
                    )}
                  </div>

                  {/* 信心分數指示器 */}
                  {record.confidence_score !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">信心：</span>
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${record.confidence_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {Math.round(record.confidence_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* 第五行：分析摘要（截短） */}
                {record.analysis_summary && (
                  <p className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 line-clamp-2">
                    {record.analysis_summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
