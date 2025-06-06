import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleAnalytics from "@/components/google-analytics";
import GoogleAdsense from "@/components/google-adsense";
import SchemaOrg from "@/components/schema-org";
import CookieConsent from "@/components/cookie-consent";
import Footer from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F14D42",
};

export const metadata: Metadata = {
  title: {
    default: "NewsNow - 优雅的新闻聚合阅读器",
    template: "%s | NewsNow"
  },
  description: "NewsNow是一款专业的实时新闻聚合阅读器，汇集全球财经、科技、政治等热点新闻，提供AI智能分析和优雅的阅读体验。支持多源新闻聚合，实时更新，让您第一时间掌握最新资讯。",
  keywords: [
    "新闻聚合", "实时新闻", "财经新闻", "科技新闻", "新闻阅读器", 
    "新闻分析", "AI新闻", "热点新闻", "新闻资讯", "NewsNow",
    "股市新闻", "经济分析", "投资资讯", "金融新闻", "市场动态",
    "新闻订阅", "RSS阅读", "新闻推送", "移动新闻", "在线新闻"
  ].join(", "),
  authors: [{ name: "NewsNow Team", url: "https://shishixinwen.news" }],
  creator: "NewsNow",
  publisher: "NewsNow",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: "news",
  classification: "新闻资讯",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#F14D42" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "NewsNow - 优雅的新闻聚合阅读器",
    description: "实时新闻聚合阅读器，汇集全球热点新闻，提供AI智能分析和优雅的阅读体验",
    type: "website",
    locale: "zh_CN",
    url: "https://shishixinwen.news",
    siteName: "NewsNow",
    images: [{
      url: "https://shishixinwen.news/og-image.png",
      width: 1200,
      height: 630,
      alt: "NewsNow - 优雅的新闻聚合阅读器",
      type: "image/png",
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@NewsNowApp",
    creator: "@NewsNowApp",
    title: "NewsNow - 优雅的新闻聚合阅读器",
    description: "实时新闻聚合阅读器，汇集全球热点新闻，提供AI智能分析和优雅的阅读体验",
    images: [{
      url: "https://shishixinwen.news/og-image.png",
      alt: "NewsNow Logo",
    }],
  },
  alternates: {
    canonical: "https://shishixinwen.news",
    languages: {
      'zh-CN': 'https://shishixinwen.news',
      'zh-TW': 'https://shishixinwen.news/zh-tw',
      'en': 'https://shishixinwen.news/en',
    },
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'NewsNow',
    'application-name': 'NewsNow',
    'msapplication-TileColor': '#F14D42',
    'theme-color': '#F14D42',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* 基础SEO标签 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NewsNow" />
        
        {/* 地理位置和语言 */}
        <meta name="geo.region" content="CN" />
        <meta name="geo.country" content="China" />
        <meta name="geo.placename" content="China" />
        <meta name="language" content="zh-CN" />
        <meta name="content-language" content="zh-CN" />
        
        {/* 搜索引擎验证 - 已移除 */}
        
        {/* 社交媒体和分享 */}
        <meta property="fb:app_id" content="your-facebook-app-id" />
        <meta name="twitter:site" content="@NewsNowApp" />
        <meta name="twitter:creator" content="@NewsNowApp" />
        
        {/* DNS预解析 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="//googletagmanager.com" />
        
        {/* 预连接重要资源 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        
        {/* RSS订阅 */}
        <link rel="alternate" type="application/rss+xml" title="NewsNow RSS Feed" href="/rss" />
        <link rel="alternate" type="application/atom+xml" title="NewsNow Atom Feed" href="/atom" />
        
        {/* 搜索引擎优化 */}
        <meta name="revisit-after" content="1 day" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        
        {/* 添加Google Analytics */}
        <GoogleAnalytics />
        {/* 添加Google AdSense */}
        <GoogleAdsense />
        {/* 添加Schema.org结构化数据 */}
        <SchemaOrg />
        {/* 添加Monetag */}
        <meta name="monetag" content="ebe288696efd36779634357501dc2eec" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
