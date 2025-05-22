import { NewsItem, type Pagination } from '@/lib/api';
import { NewsCard, NewsCardSkeleton } from './NewsCard';

interface NewsListProps {
  news: NewsItem[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  className?: string;
}

export function NewsList({
  news,
  loading,
  pagination,
  onPageChange,
  className = '',
}: NewsListProps) {
  if (loading) {
    return (
      <div className={`grid gap-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">未找到新闻</h3>
        <p className="text-sm text-muted-foreground">
          没有找到符合您筛选条件的新闻，请尝试其他关键词或筛选条件。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`grid gap-6 ${className}`}>
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
      
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              &lt;
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number | '...' = i + 1;
              
              // 处理大量分页时的省略号
              if (pagination.totalPages > 5) {
                if (pagination.page <= 3) {
                  pageNum = i + 1;
                  if (i === 4) pageNum = pagination.totalPages;
                  if (i === 3) pageNum = '...';
                } else if (pagination.page >= pagination.totalPages - 2) {
                  if (i === 0) pageNum = 1;
                  if (i === 1) pageNum = '...';
                  else pageNum = pagination.totalPages - (4 - i);
                } else {
                  if (i === 0) pageNum = 1;
                  else if (i === 4) pageNum = pagination.totalPages;
                  else if (i === 1) pageNum = '...';
                  else if (i === 3) pageNum = '...';
                  else pageNum = pagination.page;
                }
              }
              
              if (pageNum === '...') {
                return (
                  <span key={i} className="flex h-10 w-10 items-center justify-center text-muted-foreground">
                    {pageNum}
                  </span>
                );
              }
              
              return (
                <button
                  key={i}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    pagination.page === pageNum
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
