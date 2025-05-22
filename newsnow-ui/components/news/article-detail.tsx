import * as React from "react"
import { format } from "date-fns"
import { Calendar, Clock, ExternalLink, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface ArticleDetailProps {
  article: {
    id: string
    title: string
    content: string
    source: string
    author?: string
    date: string
    readTime?: string
    imageUrl?: string
    category?: string
    url?: string
    aiAnalysis?: {
      summary?: string
      keyPoints?: string[]
      sentiment?: string
      tags?: string[]
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

  return (
    <article className={className} {...props}>
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
            <span>{formatDate(article.date)}</span>
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
      
      <div className="prose dark:prose-invert max-w-none">
        <div 
          dangerouslySetInnerHTML={{ __html: article.content }} 
          className="[&_p]:leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0
                     [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
                     [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3
                     [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
                     [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
                     [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300"
        />
      </div>
      
      {article.url && (
        <div className="mt-8 pt-6 border-t">
          <Button asChild variant="outline">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              阅读原文 <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
      
      {article.aiAnalysis && (
        <div className="mt-12 bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              AI 分析
            </span>
            <Badge variant="outline" className="ml-3">
              Beta
            </Badge>
          </h2>
          
          {article.aiAnalysis.summary && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">内容摘要</h3>
              <p className="text-muted-foreground">{article.aiAnalysis.summary}</p>
            </div>
          )}
          
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
          
          {article.aiAnalysis.sentiment && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">情感分析</h3>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {article.aiAnalysis.sentiment}
              </div>
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
    </article>
  )
}
