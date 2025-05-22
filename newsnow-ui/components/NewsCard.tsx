import { Clock, Tag as TagIcon, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  source: string;
  date: string;
  category?: string;
  imageUrl?: string;
  url?: string;
  author?: string;
  content?: string;
}

interface NewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showSource?: boolean;
  showDate?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export function NewsCard({
  item,
  className,
  showCategory = true,
  showSource = true,
  showDate = true,
  variant = 'default',
}: NewsCardProps) {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md',
        isFeatured && 'md:flex-row',
        className
      )}
    >
      {item.imageUrl && (
        <div
          className={cn(
            'relative overflow-hidden',
            isFeatured
              ? 'h-48 w-full md:h-auto md:w-1/3 lg:w-2/5'
              : 'h-48',
            isCompact && 'h-32'
          )}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div
        className={cn(
          'flex flex-1 flex-col p-4',
          isFeatured && 'md:p-6',
          isCompact && 'p-3'
        )}
      >
        {(showDate || (showCategory && item.category)) && (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {showDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                {formatTimeAgo(item.date)}
              </span>
            )}
            {showCategory && item.category && (
              <>
                {showDate && <span>•</span>}
                <span className="inline-flex items-center gap-1">
                  <TagIcon className="h-3 w-3 flex-shrink-0" />
                  {item.category}
                </span>
              </>
            )}
          </div>
        )}

        <h3
          className={cn(
            'font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary',
            isFeatured ? 'text-xl md:text-2xl' : 'text-lg',
            isCompact && 'text-base',
            isFeatured ? 'mb-3' : 'mb-2',
            isCompact ? 'line-clamp-2' : 'line-clamp-3'
          )}
        >
          {item.title}
        </h3>

        {!isCompact && item.description && (
          <p
            className={cn(
              'flex-1 text-muted-foreground',
              isFeatured ? 'text-base' : 'text-sm',
              isFeatured ? 'line-clamp-4' : 'line-clamp-3'
            )}
          >
            {item.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between pt-3">
          {showSource && item.source && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {item.source}
            </span>
          )}
          <Button
            variant="ghost"
            size={isCompact ? 'sm' : 'default'}
            className="ml-auto group/button"
            asChild
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              阅读更多
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/button:translate-x-1" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

interface NewsCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function NewsCardSkeleton({
  variant = 'default',
  className,
}: NewsCardSkeletonProps) {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
        isFeatured && 'md:flex-row',
        className
      )}
    >
      <div
        className={cn(
          'animate-pulse bg-muted',
          isFeatured
            ? 'h-full w-full md:w-1/3 lg:w-2/5'
            : 'h-48',
          isCompact ? 'h-32' : 'h-48'
        )}
      />

      <div
        className={cn(
          'flex flex-1 flex-col p-4',
          isFeatured && 'md:p-6',
          isCompact && 'p-3'
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-16 rounded-full bg-muted" />
          <div className="h-4 w-16 rounded-full bg-muted" />
        </div>

        <div className="space-y-2">
          <div className={cn('h-6 rounded bg-muted', isCompact ? 'w-4/5' : 'w-3/4')} />
          {!isCompact && (
            <>
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-4/6 rounded bg-muted" />
              {isFeatured && (
                <div className="h-4 w-3/4 rounded bg-muted" />
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between pt-3">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-9 w-24 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
