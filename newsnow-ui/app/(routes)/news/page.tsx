'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { Search, Filter, X, Newspaper, ChevronDown, ChevronUp, RefreshCw, ArrowLeft, ArrowRight, ArrowUpDown, SearchX } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination as PaginationComponent } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NewsCardSkeleton } from '@/components/NewsCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsCard } from '@/components/ui/news-card';
import { fetchNewsList, type NewsItem as ApiNewsItem, type Pagination as ApiPagination } from '@/lib/api';

// 定义本地接口，与API返回的类型兼容
interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  source: string;
  publishedAt?: string;
  pubDate?: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  tags?: string[];
  summary?: string;
  date?: string;
  readTime?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 常量定义
const CATEGORIES = [
  { id: 'stock', name: '股市' },
  { id: 'forex', name: '外汇' },
  { id: 'commodity', name: '商品' },
  { id: 'crypto', name: '加密货币' },
  { id: 'economy', name: '宏观经济' },
  { id: 'company', name: '公司新闻' },
];

const SOURCE_NAMES = {
  'jin10': '金十数据',
  'wallstreet': '华尔街见闻',
  'gelonghui': '格隆汇',
  'fastbull': 'FastBull',
};

// 新闻列表组件
const NewsList = ({
  news,
  loading,
  className,
}: {
  news: NewsItem[];
  loading: boolean;
  className?: string;
}) => {
  const router = useRouter();

  // 处理新闻点击
  const handleNewsClick = useCallback((newsId: string) => {
    // 提取ID的最后部分，去除路径前缀
    const idParts = newsId.split('/');
    const simpleId = idParts[idParts.length - 1];
    router.push(`/news/${simpleId}`);
  }, [router]);

  if (loading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {news && news.length > 0 ? news.map((item) => {
        // 提取ID的最后部分，去除路径前缀
        const idParts = item.id.split('/');
        const simpleId = idParts[idParts.length - 1];
        
        return (
          <NewsCard
            key={item.id}
            title={item.title}
            description={item.description}
            source={item.source}
            date={item.publishedAt || ''}
            imageUrl={item.imageUrl}
            category={item.category}
            href={`/news/${simpleId}`}
          />
        );
      }) : (
        <div className="col-span-3 py-10 text-center text-gray-500">
          暂无新闻数据
        </div>
      )}
    </div>
  );
};

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    source: '',
    category: '',
    q: '',
    sort: 'latest',
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });

  // 处理函数
  const handleSourceChange = useCallback((source: string) => {
    setFilters(prev => ({ ...prev, source }));
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setFilters(prev => ({ ...prev, sort }));
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, q: searchQuery }));
  }, [searchQuery]);

  // 加载新闻列表
  const loadNews = useCallback(async () => {
    try {
      console.log('正在加载新闻数据...');
      setLoading(true);
      setError('');
      
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        source: filters.source,
        category: filters.category,
        q: debouncedSearchQuery,
        sort: filters.sort,
      };
      
      console.log('请求参数:', params);
      
      const result = await fetchNewsList(params);
      
      if (result.error) {
        console.error('请求错误:', result.error);
        setError(result.error);
        return;
      }
      
      if (result.data) {
        console.log('获取到新闻数据:', result.data?.data?.length || 0, '条');
        console.log('原始数据:', result.data);
        
        // 将API返回的数据转换为组件需要的格式
        // 注意：API直接返回数据数组，而不是包含在data属性中
        const newsData = Array.isArray(result.data) ? result.data : (result.data?.data || []);
        const paginationData = !Array.isArray(result.data) ? result.data?.pagination : null;
        
        console.log('处理后的新闻数据:', newsData.length, '条');
        console.log('处理后的分页数据:', paginationData);
        
        const formattedNews: NewsItem[] = newsData.map((item: any) => ({
          id: item.id || '',
          title: item.title || '',
          description: item.description || item.content || '',
          source: item.source || '',
          publishedAt: item.publishedAt || item.pubDate || '',
          url: item.url || '',
          imageUrl: item.imageUrl || '',
          category: item.category || '',
          author: item.author || '',
          tags: item.tags || [],
          summary: item.summary || ''
        }));
        
        setNews(formattedNews);
        
        if (paginationData) {
          setPagination(prev => ({
            ...prev,
            total: paginationData.total || 0,
            totalPages: paginationData.totalPages || 1,
          }));
        }
      }
    } catch (err) {
      console.error('加载新闻失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters.source, filters.sort, debouncedSearchQuery]);

  // 处理分页
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 样式常量
  const BUTTON_STYLES = {
    active: 'bg-blue-600 text-white',
    inactive: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600',
    pagination: 'px-3 py-1 mx-1 rounded',
    paginationActive: 'bg-blue-500 text-white',
    paginationInactive: 'bg-gray-200 hover:bg-gray-300',
    paginationDisabled: 'opacity-50 cursor-not-allowed',
  };

  const clearFilters = useCallback(() => {
    setFilters({
      source: '',
      category: '',
      q: '',
      sort: 'latest',
    });
    setSearchQuery('');
  }, []);

  // 使用 useMemo 优化计算值
  const hasFilters = useMemo(() => {
    return Boolean(filters.source || filters.q || filters.category || filters.sort !== 'latest');
  }, [filters]);

  const currentCategoryName = useMemo(() => {
    return CATEGORIES.find(c => c.id === filters.category)?.name || '';
  }, [filters.category]);

  // 加载数据
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* 顶部导航栏 */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="w-7 h-7 mr-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-md flex items-center justify-center text-white text-xs font-bold">财</div>
              <span>财经新闻中心</span>
            </h1>
          </div>
          
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="搜索财经新闻..."
                className="pl-9 pr-4 py-2 text-sm w-full rounded-md border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="submit"
              variant="default"
              size="sm"
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              搜索
            </Button>
          </form>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={loadNews}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
          </div>
        </div>
      </header>
      
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">实时财经资讯平台</h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              获取最新财经资讯，深度解析市场动态，助您把握投资先机
            </p>
          </div>
          
          {/* 移动端搜索框 */}
          <form onSubmit={handleSearch} className="md:hidden mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="搜索财经新闻..."
                className="pl-9 pr-4 py-2 text-sm w-full rounded-md border border-gray-200 dark:border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="submit"
              variant="default"
              size="sm"
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              搜索
            </Button>
          </form>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 侧边栏 */}
          <div className="md:w-64 lg:w-72 shrink-0">
            <div className="sticky top-[80px]">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">筛选条件</CardTitle>
                  {hasFilters && (
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0 h-auto"
                      onClick={clearFilters}
                    >
                      <X className="h-3 w-3 mr-1" />
                      清除筛选
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* 新闻源筛选 */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                      <span>新闻源</span>
                    </h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.source === '' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSourceChange('')}
                      >
                        <Newspaper className="h-4 w-4 mr-2" />
                        全部来源
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.source === 'jin10' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSourceChange('jin10')}
                      >
                        金十数据
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.source === 'wallstreet' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSourceChange('wallstreet')}
                      >
                        华尔街见闻
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.source === 'gelonghui' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSourceChange('gelonghui')}
                      >
                        格隆汇
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.source === 'fastbull' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSourceChange('fastbull')}
                      >
                        FastBull
                      </Button>
                    </div>
                  </div>
                  
                  {/* 分类筛选 */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                      <span>分类</span>
                    </h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.category === '' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleCategoryChange('')}
                      >
                        全部分类
                      </Button>
                      {CATEGORIES.map(category => (
                        <Button 
                          key={category.id}
                          variant="outline" 
                          size="sm"
                          className={cn("w-full justify-start", filters.category === category.id ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                          onClick={() => handleCategoryChange(category.id)}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 排序方式 */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">排序方式</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.sort === 'latest' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSortChange('latest')}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        最新发布
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn("w-full justify-start", filters.sort === 'popular' ? BUTTON_STYLES.active : BUTTON_STYLES.inactive)}
                        onClick={() => handleSortChange('popular')}
                      >
                        <ChevronUp className="h-4 w-4 mr-2" />
                        热门优先
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* 主内容 */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {filters.category ? currentCategoryName : '最新财经资讯'}
                  {filters.source && ` - ${SOURCE_NAMES[filters.source as keyof typeof SOURCE_NAMES] || filters.source}`}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {pagination.total > 0 ? (
                    <>共 {pagination.total} 条新闻，第 {pagination.page}/{pagination.totalPages} 页</>
                  ) : (
                    <>加载中...</>
                  )}
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="md:hidden mr-2 flex items-center"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  筛选
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={loadNews}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  刷新
                </Button>
              </div>
            </div>
            
            {/* 搜索结果提示 */}
            {debouncedSearchQuery && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                <div className="flex items-center text-sm text-blue-700 dark:text-blue-400">
                  <Search className="h-4 w-4 mr-2" />
                  <span>搜索 "<strong>{debouncedSearchQuery}</strong>" 的结果</span>
                </div>
              </div>
            )}
            
            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md">
                <div className="flex items-center text-sm text-red-700 dark:text-red-400">
                  <span>加载失败: {error}</span>
                </div>
              </div>
            )}
            
            {/* 新闻列表 */}
            <div>
              <Card className="shadow-sm overflow-hidden">
                {loading && (
                  <div className="p-5">
                    <div className="grid gap-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden p-4">
                          <div className="flex gap-4">
                            <Skeleton className="h-24 w-24 rounded-md" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!loading && news.length === 0 && (
                  <div className="p-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <SearchX className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">未找到相关新闻</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      {debouncedSearchQuery ? `没有找到与"${debouncedSearchQuery}"相关的新闻` : '暂无新闻数据'}
                    </p>
                    <Button 
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      清除筛选条件
                    </Button>
                  </div>
                )}
                
                {!loading && news.length > 0 && (
                  <div className="p-5">
                    <div className="grid gap-5">
                      {/* 新闻列表 */}
                      {news && news.length > 0 ? news.map((item) => {
                        // 提取ID的最后部分，去除路径前缀
                        const idParts = item.id.split('/');
                        const simpleId = idParts[idParts.length - 1];
                        
                        return (
                          <div 
                            key={item.id}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                            onClick={() => router.push(`/news/${simpleId}`)}
                          >
                          <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row gap-4">
                              {item.imageUrl && (
                                <div className="sm:w-1/4 h-40 sm:h-auto relative rounded-md overflow-hidden border border-gray-100 dark:border-gray-800">
                                  <div 
                                    className="w-full h-full bg-cover bg-center" 
                                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                                  />
                                </div>
                              )}
                              <div className="sm:flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                  {item.description || item.content || ""}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.publishedAt || item.pubDate ? format(new Date(item.publishedAt || item.pubDate || ''), 'yyyy-MM-dd HH:mm') : '无日期'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      }) : null}
                    </div>
                  </div>
                )}
                {!loading && pagination && pagination.totalPages > 1 ? (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-5 py-4">
                    <PaginationComponent
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
