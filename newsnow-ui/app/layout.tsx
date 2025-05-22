import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NewsNow - 最新财经新闻",
  description: "获取最新的全球财经新闻和市场动态，涵盖股票、外汇、加密货币等金融资讯",
  keywords: ["财经新闻", "股票", "外汇", "加密货币", "金融市场", "投资"],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ffffff",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "NewsNow - 最新财经新闻",
    description: "获取最新的全球财经新闻和市场动态",
    type: "website",
    locale: "zh_CN",
    url: "https://yourdomain.com",
    siteName: "NewsNow",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsNow - 最新财经新闻",
    description: "获取最新的全球财经新闻和市场动态",
    creator: "@yourtwitter",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
