import * as React from "react"
import { NewsCard } from "@/components/ui/news-card"
import { Skeleton } from "@/components/ui/skeleton"

interface NewsItem {
  id: string
  title: string
  description?: string
  source: string
  date: string
  readTime?: string
  imageUrl?: string
  category?: string
  url?: string
}

interface NewsListProps {
  newsItems: NewsItem[]
  loading?: boolean
  itemsPerPage?: number
  onItemClick?: (id: string) => void
}

export function NewsList({
  newsItems = [],
  loading = false,
  itemsPerPage = 6,
  onItemClick,
  ...props
}: NewsListProps) {
  // 显示加载骨架屏
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" {...props}>
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 如果没有数据
  if (newsItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" {...props}>
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V7.5L17.5 2H6a2 2 0 0 0-2 2v4" />
            <path d="M14 2v6h6" />
            <path d="M10 18v-1" />
            <path d="M14 18v-1" />
            <path d="M2 13h2" />
            <path d="M20 13h2" />
            <path d="M2 17h2" />
            <path d="M20 17h2" />
            <path d="M5 17a3 3 0 1 0 6 0c0-.7-.3-1.4-.8-2" />
            <path d="M8.3 10a3 3 0 1 0-2.6-4.5" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">暂无新闻</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          当前没有可用的新闻内容，请稍后再试或尝试刷新页面。
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" {...props}>
      {newsItems.map((item) => (
        <NewsCard
          key={item.id}
          title={item.title}
          description={item.description}
          source={item.source}
          date={item.date}
          readTime={item.readTime}
          imageUrl={item.imageUrl}
          category={item.category}
          className="cursor-pointer hover:translate-y-[-2px] transition-transform"
          onClick={() => onItemClick?.(item.id)}
        />
      ))}
    </div>
  )
}
