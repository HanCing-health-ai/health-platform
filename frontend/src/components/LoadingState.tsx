"use client";

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "正在分析您的身體使用模式...",
  "正在比對知識庫...",
  "正在生成調理建議..."
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans tracking-wide">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 p-10 flex flex-col items-center">
        {/* Spinner */}
        <div className="w-20 h-20 relative mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">
          AI 智能分析中
        </h2>
        
        {/* Carousel Container */}
        <div className="w-full h-8 relative flex items-center justify-center overflow-hidden">
          {/* Use CSS animation specifically for the text fade/slide or just simple React re-render.
              Using React key forces a re-render and allows simple animate-pulse. */}
          <p 
            key={messageIndex}
            className="text-indigo-600 font-medium text-center animate-pulse transition-opacity duration-500 ease-in-out"
          >
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>

        <p className="mt-8 text-xs text-slate-400 text-center">
          這可能需要 5 到 15 秒的時間，請勿關閉視窗
        </p>
      </div>
    </div>
  );
}
