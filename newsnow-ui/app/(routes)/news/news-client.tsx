'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// 动态导入图标组件
const ArrowUpDown = dynamic(() => import('lucide-react').then(mod => mod.ArrowUpDown), { ssr: false });
const ChevronDown = dynamic(() => import('lucide-react').then(mod => mod.ChevronDown), { ssr: false });
const ChevronUp = dynamic(() => import('lucide-react').then(mod => mod.ChevronUp), { ssr: false });
const Filter = dynamic(() => import('lucide-react').then(mod => mod.Filter), { ssr: false });
const RefreshCw = dynamic(() => import('lucide-react').then(mod => mod.RefreshCw), { ssr: false });
const Search = dynamic(() => import('lucide-react').then(mod => mod.Search), { ssr: false });
const SearchX = dynamic(() => import('lucide-react').then(mod => mod.SearchX), { ssr: false });
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
import { CardHeader } from '../../../components/ui/card';
import { CardTitle } from '../../../components/ui/card';
import { CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { cn } from '../../../lib/utils';
import { useDebounce } from '../../../hooks/use-debounce';
import { Pagination } from '../../../components/ui/pagination';
import { fetchNewsList } from '../../../actions/news';

// 类型定义
interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  source: string;
  publishedAt?: string;
  pubDate?: string;
  url: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  tags?: string[];
  summary?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 常量
const SOURCE_NAMES: Record<string, string> = {
  'jin10': '金十数据',
  'wallstreet': '华尔街见闻',
  'gelonghui': '格隆汇',
  'fastbull': 'FastBull',
};

const CATEGORIES = [
  { id: 'stock', name: '股市' },
  { id: 'forex', name: '外汇' },
  { id: 'commodity', name: '商品' },
  { id: 'crypto', name: '加密货币' },
  { id: 'economy', name: '宏观经济' },
  { id: 'company', name: '公司新闻' },
];

// 新闻页面内容组件
function NewsPageContent() {
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
    sortBy: 'date',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // 从URL参数中获取初始状态
  useEffect(() => {
    if (!searchParams) return;
    
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '1', 10) : 1;
    const query = searchParams.get('q') || '';
    const source = searchParams.get('source') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
    
    setSearchQuery(query);
    setFilters({
      source,
      category,
      sortBy,
      sortOrder,
    });
    setPagination(prev => ({
      ...prev,
      page,
    }));
  }, [searchParams]);

  // 更新URL参数
  const updateUrlParams = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // 更新或删除参数
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    // 构建新的URL
    const newUrl = `${pathname}?${newParams.toString()}`;
    router.push(newUrl);
  }, [pathname, router, searchParams]);

  // 处理搜索查询变化
  useEffect(() => {
    updateUrlParams({ q: debouncedSearchQuery });
  }, [debouncedSearchQuery, updateUrlParams]);

  // 处理筛选器变化
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // 更新URL参数
      const params: Record<string, string> = {};
      Object.entries(newFilters).forEach(([k, v]) => {
        params[k] = v;
      });
      updateUrlParams(params);
      
      return newFilters;
    });
    
    // 重置到第一页
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
    updateUrlParams({ page: '1' });
  }, [updateUrlParams]);

  // 处理排序变化
  const handleSortChange = useCallback((sortBy: string) => {
    setFilters(prev => {
      // 如果点击当前排序字段，则切换排序顺序
      const sortOrder = prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' as const : 'desc' as const;
      const newFilters = { ...prev, sortBy, sortOrder };
      
      // 更新URL参数
      updateUrlParams({
        sortBy,
        sortOrder,
      });
      
      return newFilters;
    });
  }, [updateUrlParams]);

  // 处理页面变化
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page,
    }));
    updateUrlParams({ page: page.toString() });
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateUrlParams]);

  // 清除所有筛选条件
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      source: '',
      category: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
    
    // 清除URL参数
    router.push(pathname);
  }, [pathname, router]);

  // 加载新闻数据
  const loadNews = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const { source, category, sortBy, sortOrder } = filters;
      const { page, pageSize } = pagination;
      
      const response = await fetchNewsList({
        page,
        pageSize,
        search: debouncedSearchQuery,
        source,
        category,
        sortBy,
        sortOrder,
      });
      
      if (response && response.items) {
        setNews(response.items);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0,
        }));
      } else {
        setNews([]);
        setError('获取新闻失败');
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setNews([]);
      setError('获取新闻失败');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filters, pagination.page, pagination.pageSize]);

  // 当依赖项变化时重新加载数据
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // 获取当前排序图标
  const getSortIcon = useCallback((field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return filters.sortOrder === 'desc' 
      ? <ChevronDown className="ml-1 h-4 w-4" /> 
      : <ChevronUp className="ml-1 h-4 w-4" />;
  }, [filters.sortBy, filters.sortOrder]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* 页面标题 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              财经新闻
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              浏览最新财经新闻、市场动态和经济分析
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* 移动端筛选器按钮 */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              >
                <Filter className="mr-2 h-4 w-4" />
                筛选
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* 侧边栏筛选器 - 桌面端 */}
            <div className="hidden lg:block">
              <Card>
                <CardHeader>
                  <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 来源筛选 */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium">新闻来源</h3>
                    <div className="space-y-2">
                      <Button
                        variant={filters.source === '' ? "default" : "outline"}
                        size="sm"
                        className="mr-2 mb-2"
                        onClick={() => handleFilterChange('source', '')}
                      >
                        全部
                      </Button>
                      {Object.entries(SOURCE_NAMES).map(([id, name]) => (
                        <Button
                          key={id}
                          variant={filters.source === id ? "default" : "outline"}
                          size="sm"
                          className="mr-2 mb-2"
                          onClick={() => handleFilterChange('source', id)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 分类筛选 */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium">新闻分类</h3>
                    <div className="space-y-2">
                      <Button
                        variant={filters.category === '' ? "default" : "outline"}
                        size="sm"
                        className="mr-2 mb-2"
                        onClick={() => handleFilterChange('category', '')}
                      >
                        全部
                      </Button>
                      {CATEGORIES.map((category) => (
                        <Button
                          key={category.id}
                          variant={filters.category === category.id ? "default" : "outline"}
                          size="sm"
                          className="mr-2 mb-2"
                          onClick={() => handleFilterChange('category', category.id)}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 排序选项 */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium">排序方式</h3>
                    <div className="space-y-2">
                      <Button
                        variant={filters.sortBy === 'date' ? "default" : "outline"}
                        size="sm"
                        className="mr-2 mb-2 flex items-center"
                        onClick={() => handleSortChange('date')}
                      >
                        日期 {getSortIcon('date')}
                      </Button>
                      <Button
                        variant={filters.sortBy === 'relevance' ? "default" : "outline"}
                        size="sm"
                        className="mr-2 mb-2 flex items-center"
                        onClick={() => handleSortChange('relevance')}
                      >
                        相关度 {getSortIcon('relevance')}
                      </Button>
                    </div>
                  </div>
                  
                  {/* 重置按钮 */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    清除筛选
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* 移动端筛选器 - 弹出式 */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden">
                <div className="absolute right-0 top-0 h-full w-4/5 max-w-md bg-white dark:bg-gray-900 p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">筛选条件</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-6rem)]">
                    <div className="space-y-6 pr-4">
                      {/* 来源筛选 */}
                      <div>
                        <h3 className="mb-3 text-sm font-medium">新闻来源</h3>
                        <div className="flex flex-wrap">
                          <Button
                            variant={filters.source === '' ? "default" : "outline"}
                            size="sm"
                            className="mr-2 mb-2"
                            onClick={() => {
                              handleFilterChange('source', '');
                              setMobileFiltersOpen(false);
                            }}
                          >
                            全部
                          </Button>
                          {Object.entries(SOURCE_NAMES).map(([id, name]) => (
                            <Button
                              key={id}
                              variant={filters.source === id ? "default" : "outline"}
                              size="sm"
                              className="mr-2 mb-2"
                              onClick={() => {
                                handleFilterChange('source', id);
                                setMobileFiltersOpen(false);
                              }}
                            >
                              {name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* 分类筛选 */}
                      <div>
                        <h3 className="mb-3 text-sm font-medium">新闻分类</h3>
                        <div className="flex flex-wrap">
                          <Button
                            variant={filters.category === '' ? "default" : "outline"}
                            size="sm"
                            className="mr-2 mb-2"
                            onClick={() => {
                              handleFilterChange('category', '');
                              setMobileFiltersOpen(false);
                            }}
                          >
                            全部
                          </Button>
                          {CATEGORIES.map((category) => (
                            <Button
                              key={category.id}
                              variant={filters.category === category.id ? "default" : "outline"}
                              size="sm"
                              className="mr-2 mb-2"
                              onClick={() => {
                                handleFilterChange('category', category.id);
                                setMobileFiltersOpen(false);
                              }}
                            >
                              {category.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* 排序选项 */}
                      <div>
                        <h3 className="mb-3 text-sm font-medium">排序方式</h3>
                        <div className="flex flex-wrap">
                          <Button
                            variant={filters.sortBy === 'date' ? "default" : "outline"}
                            size="sm"
                            className="mr-2 mb-2 flex items-center"
                            onClick={() => {
                              handleSortChange('date');
                              setMobileFiltersOpen(false);
                            }}
                          >
                            日期 {getSortIcon('date')}
                          </Button>
                          <Button
                            variant={filters.sortBy === 'relevance' ? "default" : "outline"}
                            size="sm"
                            className="mr-2 mb-2 flex items-center"
                            onClick={() => {
                              handleSortChange('relevance');
                              setMobileFiltersOpen(false);
                            }}
                          >
                            相关度 {getSortIcon('relevance')}
                          </Button>
                        </div>
                      </div>
                      
                      {/* 重置按钮 */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          clearFilters();
                          setMobileFiltersOpen(false);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        清除筛选
                      </Button>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            {/* 主内容区域 */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <CardTitle>新闻列表</CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        type="search"
                        placeholder="搜索新闻..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                {/* 活跃筛选条件标签 */}
                {(filters.source || filters.category || debouncedSearchQuery) && (
                  <div className="px-5 pb-2">
                    <div className="flex flex-wrap gap-2">
                      {debouncedSearchQuery && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          搜索: {debouncedSearchQuery}
                          <button onClick={() => setSearchQuery('')} className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.source && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          来源: {SOURCE_NAMES[filters.source as keyof typeof SOURCE_NAMES] || filters.source}
                          <button onClick={() => handleFilterChange('source', '')} className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.category && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          分类: {CATEGORIES.find(c => c.id === filters.category)?.name || filters.category}
                          <button onClick={() => handleFilterChange('category', '')} className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 加载状态 */}
                {loading && (
                  <div className="p-5">
                    <div className="grid gap-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-4">
                          <div className="sm:w-1/4">
                            <Skeleton className="h-40 w-full rounded-md" />
                          </div>
                          <div className="sm:flex-1 space-y-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <div className="flex justify-between pt-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 错误状态 */}
                {error && !loading && (
                  <div className="p-5 text-center text-red-500">
                    <p>{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={loadNews}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      重试
                    </Button>
                  </div>
                )}
                
                {/* 空状态 */}
                {!loading && !error && news.length === 0 && (
                  <div className="p-12 text-center">
                    <SearchX className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      未找到新闻
                    </p>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
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
                    <Pagination
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

// 导出NewsPageContent组件
export { NewsPageContent }
