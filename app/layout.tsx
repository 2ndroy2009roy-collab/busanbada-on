import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "부산바다ON | 오늘의 바다 추천",
  description: "취향과 바다 상태를 분석해 부산의 가장 좋은 바다를 추천합니다.",
  openGraph: {
    title: "부산바다ON | 오늘의 바다 추천",
    description: "오늘, 어떤 바다에서 놀고 싶나요?",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
