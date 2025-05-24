import * as React from "react"
import { useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Clock, ExternalLink, ArrowLeft, Share2, Bookmark, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Head from "next/head"

interface ArticleDetailProps {
  article: {
    id: string
    title: string
    content: string
    source: string
    author?: string
    date: string
    pubDate?: string
    publishedAt?: string
    readTime?: string
    imageUrl?: string
    category?: string
    url?: string
    tags?: string[]
    summary?: string
    aiAnalysis?: {
      summary?: string
      keyPoints?: string[]
      sentiment?: string
      tags?: string[]
      background?: string
      impact?: string
      opinion?: string
      suggestions?: string[]
    }
  } | null
  loading?: boolean
  onBack?: () => void
  className?: string
}

export function ArticleDetail({
  article,
  loading = false,
  onBack,
  className,
  ...props
}: ArticleDetailProps) {
  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy年MM月dd日 HH:mm")
    } catch (e) {
      return dateString
    }
  }

  // 加载状态
  if (loading || !article) {
    return (
      <div className={className} {...props}>
        <Button variant="ghost" size="sm" className="mb-6" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center space-x-4 text-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          
          <Skeleton className="h-64 w-full rounded-lg" />
          
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          <div className="space-y-4 pt-8">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 结构化数据
  useEffect(() => {
    if (article && typeof window !== 'undefined') {
      const publishDate = article.publishedAt || article.pubDate || article.date;
      
      // 创建结构化数据
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "datePublished": publishDate,
        "dateModified": publishDate,
        "description": article.summary || article.aiAnalysis?.summary || "",
        "image": article.imageUrl ? [article.imageUrl] : [],
        "author": {
          "@type": "Person",
          "name": article.author || article.source
        },
        "publisher": {
          "@type": "Organization",
          "name": article.source,
          "logo": {
            "@type": "ImageObject",
            "url": "https://newsnow.example.com/logo.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": article.url || window.location.href
        }
      };
      
      // 添加结构化数据到页面
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [article]);
  
  return (
    <article className={`${className} max-w-4xl mx-auto`} {...props}>
      <Button variant="ghost" size="sm" className="mb-6" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>
      
      <header className="mb-8">
        {article.category && (
          <Badge variant="secondary" className="mb-4">
            {article.category}
          </Badge>
        )}
        
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formatDate(article.publishedAt || article.pubDate || article.date)}</span>
          </div>
          
          {article.readTime && (
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{article.readTime}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <span>来源: </span>
            <span className="ml-1 font-medium text-foreground">
              {article.source}
            </span>
          </div>
          
          {article.author && (
            <div className="flex items-center">
              <span>作者: </span>
              <span className="ml-1 font-medium text-foreground">
                {article.author}
              </span>
            </div>
          )}
        </div>
        
        {/* 社交分享按钮 */}
        <div className="flex space-x-4 mb-6">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" /> 分享
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" /> 收藏
          </Button>
          <Button variant="outline" size="sm">
            <ThumbsUp className="h-4 w-4 mr-2" /> 点赞
          </Button>
        </div>
        
        {article.imageUrl && (
          <div className="relative w-full h-96 rounded-lg overflow-hidden mb-8">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </header>
      
      {/* 顶部广告位 - 适合放置横幅广告 */}
      <div className="my-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <div className="h-20 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">广告位 - 横幅广告</p>
        </div>
      </div>
      
      {/* 文章摘要 */}
      {(article.summary || article.aiAnalysis?.summary) && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="font-semibold mb-2">文章摘要</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {article.summary || article.aiAnalysis?.summary}
          </p>
        </div>
      )}
      
      {/* 文章内容 - 第一部分 */}
      <div className="prose dark:prose-invert max-w-none mb-6">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: article.content.split('</p>').slice(0, Math.ceil(article.content.split('</p>').length / 2)).join('</p>') + '</p>' 
          }} 
          className="[&_p]:leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0
                     [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
                     [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3
                     [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
                     [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
                     [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300"
        />
      </div>
      
      {/* 中间广告位 - 适合放置信息流广告 */}
      <div className="my-8 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <div className="h-60 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">广告位 - 信息流广告</p>
        </div>
      </div>
      
      {/* 文章内容 - 第二部分 */}
      <div className="prose dark:prose-invert max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: article.content.split('</p>').slice(Math.ceil(article.content.split('</p>').length / 2)).join('</p>') 
          }} 
          className="[&_p]:leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0
                     [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
                     [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3
                     [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
                     [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
                     [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300"
        />
      </div>
      
      {/* 原文链接 */}
      {article.url && (
        <div className="mt-8 pt-6 border-t">
          <Button asChild variant="outline">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              阅读原文 <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
      
      {/* 底部广告位 - 适合放置文章末尾广告 */}
      <div className="my-8 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <div className="h-20 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">广告位 - 文章末尾广告</p>
        </div>
      </div>
      
      {/* AI 分析部分 */}
      {article.aiAnalysis && (
        <div className="mt-8 bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              AI 分析
            </span>
            <Badge variant="outline" className="ml-3">
              Beta
            </Badge>
          </h2>
          
          {article.aiAnalysis.keyPoints && article.aiAnalysis.keyPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">关键点</h3>
              <ul className="space-y-2 text-muted-foreground">
                {article.aiAnalysis.keyPoints.map((point, index) => (
                  <li key={index} className="flex">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {article.aiAnalysis.background && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">背景信息</h3>
              <p className="text-muted-foreground">{article.aiAnalysis.background}</p>
            </div>
          )}
          
          {article.aiAnalysis.impact && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">影响分析</h3>
              <p className="text-muted-foreground">{article.aiAnalysis.impact}</p>
            </div>
          )}
          
          {article.aiAnalysis.opinion && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">观点解读</h3>
              <p className="text-muted-foreground">{article.aiAnalysis.opinion}</p>
            </div>
          )}
          
          {article.aiAnalysis.sentiment && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">情感分析</h3>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {article.aiAnalysis.sentiment}
              </div>
            </div>
          )}
          
          {article.aiAnalysis.suggestions && article.aiAnalysis.suggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">投资建议</h3>
              <ul className="space-y-2 text-muted-foreground">
                {article.aiAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex">
                    <span className="text-green-500 mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {article.aiAnalysis.tags && article.aiAnalysis.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">相关标签</h3>
              <div className="flex flex-wrap gap-2">
                {article.aiAnalysis.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 相关推荐卡片 */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">相关推荐</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <h3 className="font-medium line-clamp-2 mb-2">相关推荐文章标题示例</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">这是一个相关推荐文章的简短描述，展示部分内容吸引用户点击...</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>财经新闻</span>
                <span>{format(new Date(), 'yyyy-MM-dd')}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <h3 className="font-medium line-clamp-2 mb-2">另一个相关推荐文章标题</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">这是另一个相关推荐文章的简短描述，展示部分内容吸引用户点击...</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>市场分析</span>
                <span>{format(new Date(), 'yyyy-MM-dd')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 侧边广告位 - 适合放置粘性广告 */}
      <div className="fixed right-4 bottom-4 w-64 h-64 hidden lg:flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">广告位 - 粘性侧边广告</p>
      </div>
    </article>
  )
}
