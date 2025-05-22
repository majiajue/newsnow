import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ExternalLink } from "lucide-react"
import Image from "next/image"

export interface NewsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  source: string
  date: string
  readTime?: string
  imageUrl?: string
  category?: string
  className?: string
  onClick?: () => void
}

const NewsCard = React.forwardRef<HTMLDivElement, NewsCardProps>(
  (
    {
      title,
      description,
      source,
      date,
      readTime = "3 min read",
      imageUrl,
      category = "财经",
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "group overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-neutral-800/50",
          "h-full flex flex-col",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="relative aspect-video overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{source}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2 text-lg font-semibold leading-tight">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="line-clamp-3 text-sm">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardFooter className="flex flex-col items-start gap-2 pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground w-full">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{readTime}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between w-full mt-2">
            <span className="text-xs font-medium text-muted-foreground">
              来源: {source}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">查看详情</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }
)
NewsCard.displayName = "NewsCard"

export { NewsCard }
