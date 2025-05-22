'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Newspaper, TrendingUp, BarChart2, Search, Filter } from 'lucide-react';
import { NewsItem } from '@/lib/api';

interface NewsListProps {
  news: NewsItem[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onNewsClick?: (id: string) => void;
}

export function NewsList({
  news,
  loading,
  pagination,
  onPageChange,
  onNewsClick,
}: NewsListProps) {
  const router = useRouter();
  
  // 处理新闻项点击
  const handleNewsClick = (id: string) => {
    if (onNewsClick) {
      onNewsClick(id);
    } else {
      router.push(`/news/${id}`);
    }
  };

  // 渲染加载状态
  if (loading && news.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // 渲染空状态
  if (!loading && news.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">没有找到相关新闻</h3>
        <p className="text-muted-foreground">尝试调整搜索条件或稍后再试</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
            onClick={() => handleNewsClick(item.id)}
          >
            {item.imageUrl ? (
              <div className="relative h-48 w-full">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 图片加载失败时显示占位图
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                {item.category && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{item.source}</span>
              </div>
            )}
            
            <CardHeader className="flex-1">
              <CardTitle className="line-clamp-2 text-lg font-semibold leading-tight">
                {item.title}
              </CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                  {item.description}
                </p>
              )}
            </CardHeader>
            
            <CardFooter className="flex justify-between items-center pt-0">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.source}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1 || loading}
            >
              上一页
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // 计算要显示的页码
                let pageNum = i + 1;
                if (pagination.totalPages > 5) {
                  if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              )}
              
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.totalPages)}
                  disabled={loading}
                >
                  {pagination.totalPages}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
