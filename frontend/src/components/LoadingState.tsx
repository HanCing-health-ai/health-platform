"use client";

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "INITIALIZING SCAN SEQUENCE...",
  "EXTRACTING BIOMECHANICAL PATTERNS...",
  "CROSS-REFERENCING CONDITIONS...",
  "GENERATING INSIGHT MATRIX..."
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center font-sans z-50 overflow-hidden">
      
      {/* 網格背景 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '40px 40px' }}></div>

      <div className="relative flex flex-col items-center justify-center p-8 max-w-lg w-full z-10">
        
        {/* 脈衝光環核心 */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-12">
          {/* 外圍大波紋 */}
          <div className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
          
          {/* 中層旋轉環 */}
          <div className="absolute inset-4 rounded-full border-t border-[var(--accent-secondary)] animate-spin" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-4 rounded-full border-b border-[var(--accent-primary)] animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
          
          {/* 內核發光體 */}
          <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] shadow-[0_0_50px_var(--accent-primary)] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white opacity-80 shadow-[0_0_20px_white]"></div>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-black text-white mb-8 tracking-[0.2em] uppercase font-heading">
          System Processing
        </h2>
        
        {/* Carousel Container */}
        <div className="w-full h-8 relative flex items-center justify-center overflow-hidden mb-8">
          {LOADING_MESSAGES.map((msg, idx) => (
            <p 
              key={idx}
              className={`absolute text-[var(--accent-secondary)] text-sm font-bold tracking-widest text-center uppercase transition-all duration-700 ease-in-out ${idx === messageIndex ? 'opacity-100 translate-y-0 scale-100 glow-primary' : 'opacity-0 translate-y-4 scale-95'}`}
              style={{ textShadow: idx === messageIndex ? '0 0 10px var(--accent-secondary)' : 'none' }}
            >
              {msg}
            </p>
          ))}
        </div>

        {/* Progress Matrix Dots */}
        <div className="flex gap-2">
          {LOADING_MESSAGES.map((_, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === messageIndex ? 'bg-white shadow-[0_0_8px_white]' : idx < messageIndex ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'}`}></div>
          ))}
        </div>

        <p className="mt-12 text-[10px] text-[var(--text-secondary)] tracking-widest uppercase font-bold text-center border border-[var(--border)] px-4 py-2 rounded">
          Please stand by • Do not close interface
        </p>
      </div>
    </div>
  );
}
