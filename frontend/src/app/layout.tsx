import type { Metadata } from "next";
import { Sora, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora' 
});

const notoSansTC = Noto_Sans_TC({ 
  subsets: ['latin'], 
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-tc' 
});

export const metadata: Metadata = {
  title: "ConditionAI | 智能調理洞察引擎",
  description: "AI賦能的行為模式導向健康管理工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${sora.variable} ${notoSansTC.variable} antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
