import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useRelativeTime } from '../../hooks/useRelativeTime';
import { Helmet } from 'react-helmet-async';
import DefaultNewsImage from '../common/DefaultNewsImage';

// 支持的来源列表 - 在源筛选组件中直接使用，不需要此变量
// const SUPPORTED_SOURCES = ['财联社']; // 暂时只支持财联社
// 将来支持的来源: ['财联社', 'FastBull', 'WallStreet', 'Jin10', 'Gelonghui']

// 文章接口
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  pubDate: string;
  source: string;
  category: string;
  author: string;
  imageUrl: string;
  aiComment: string;
}

// 分页接口
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

// API响应接口
interface ApiResponse {
  code: number;
  data: Article[];
  pagination: Pagination;
  message?: string;
}

// 获取所有来源文章的函数
const fetchAllSourcesArticles = async (page: number, pageSize: number, source: string = ''): Promise<ApiResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (source) {
    params.append('source', source);
  }
  
  const response = await fetch(`/api/news/all-sources/articles?${params.toString()}`);
  if (!response.ok) {
    throw new Error('获取文章列表失败');
  }
  return response.json();
};

// 所有来源新闻列表组件
const AllSourcesNewsList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedSource, setSelectedSource] = useState('');
  const { formatRelativeTime } = useRelativeTime();
  const [metaDescription, setMetaDescription] = useState('最新财经新闻汇总，包含财联社、华尔街见闻、金十数据、格隆汇等多个来源的财经资讯。');
  
  // 使用React Query获取文章数据
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['allSourcesArticles', page, pageSize, selectedSource],
    queryFn: () => fetchAllSourcesArticles(page, pageSize, selectedSource),
  });
  
  // 更新元描述
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      const titles = data.data.slice(0, 3).map(article => article.title);
      setMetaDescription(`最新财经新闻: ${titles.join('、')}。来自财联社、华尔街见闻、金十数据、格隆汇等多个来源的财经资讯。`);
    }
  }, [data]);
  
  // 处理来源筛选变化
  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setPage(1); // 重置页码
  };
  
  // 处理分页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 计算总页数
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / pageSize) : 0;
  
  // 构建页面标题
  const pageTitle = selectedSource 
    ? `${selectedSource}最新财经新闻 - 第${page}页` 
    : `财经新闻汇总 - 多源财经资讯平台 - 第${page}页`;
  
  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>加载中 - 财经新闻汇总</title>
          <meta name="description" content="正在加载最新财经新闻，请稍候..." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="flex justify-center items-center h-40">加载中...</div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Helmet>
          <title>加载失败 - 财经新闻汇总</title>
          <meta name="description" content="加载财经新闻失败，请稍后重试。" />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="flex flex-col items-center justify-center h-40">
          <p className="text-red-500">加载失败: {(error as Error).message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label="重试加载"
          >
            重试
          </button>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content="财经新闻,财联社,华尔街见闻,金十数据,格隆汇,财经资讯,股市动态,经济分析" />
        <link rel="canonical" href={`https://yourdomain.com/news/all-sources${selectedSource ? `?source=${encodeURIComponent(selectedSource)}` : ''}${page > 1 ? `&page=${page}` : ''}`} />
        {page > 1 && <meta name="robots" content="noindex, follow" />}
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">{selectedSource ? `${selectedSource}最新财经新闻` : '全部来源财经新闻'}</h1>
          
          {/* SEO友好的描述 */}
          <p className="text-gray-600 mb-4">
            {selectedSource 
              ? `浏览来自${selectedSource}的最新财经新闻、市场分析和经济动态。每日更新，为您提供最及时的财经资讯。` 
              : '汇集财联社、华尔街见闻、金十数据、格隆汇等多个来源的最新财经新闻。关注市场动态，把握投资机会。'}
          </p>
          
          {/* 顶部广告位 - 暂时屏蔽 */}
          {/* <div className="mb-8">
            <AdPlaceholder position="banner" />
          </div> */}
          
          {/* 来源筛选 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleSourceChange('')}
              className={`px-4 py-2 rounded-full ${
                selectedSource === '' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              全部
            </button>
            
            {/* 所有来源 */}
            {['财联社', 'FastBull', 'WallStreet', 'Jin10', 'Gelonghui'].map(source => (
              <button
                key={source}
                onClick={() => handleSourceChange(source)}
                className={`px-4 py-2 rounded-full ${
                  selectedSource === source ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
        
        {/* 文章列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data.map((article, index) => (
            <React.Fragment key={article.id}>
              {/* 每9篇文章后插入广告 */}
              {index > 0 && index % 9 === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 my-4">
                  {/* <AdPlaceholder position={`in-feed-${Math.floor(index / 9)}`} /> */}
                </div>
              )}
              
              <article className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative">
                  {article.imageUrl ? (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                        width="400"
                        height="225"
                      />
                    </div>
                  ) : (
                    <div className="h-40 overflow-hidden">
                      <DefaultNewsImage title={article.title} />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {article.source}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{article.category}</span>
                    <time dateTime={article.pubDate} className="text-sm text-gray-500">
                      {formatRelativeTime(new Date(article.pubDate))}
                    </time>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-blue-500">
                    <Link to="/news/article/$id" params={{ id: article.id }} className="hover:text-blue-500">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">{article.summary}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{article.author}</span>
                    <Link 
                      to="/news/article/$id"
                      params={{ id: article.id }}
                      className="text-sm text-blue-500 hover:underline"
                      aria-label={`阅读更多: ${article.title}`}
                    >
                      阅读更多
                    </Link>
                  </div>
                </div>
              </article>
            </React.Fragment>
          ))}
        </div>
        
        {/* 底部广告位 */}
        {/* <div className="my-8">
          <AdPlaceholder position="bottom-banner" />
        </div> */}
        
        {/* 分页控件 */}
        {totalPages > 0 && (
          <nav className="flex justify-center items-center mt-8" aria-label="分页导航">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 mr-2 bg-gray-200 rounded disabled:opacity-50"
              aria-label="上一页"
            >
              上一页
            </button>
            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // 显示当前页附近的页码
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 mx-1 rounded-full ${
                      page === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    aria-label={`第${pageNum}页`}
                    aria-current={page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 ml-2 bg-gray-200 rounded disabled:opacity-50"
              aria-label="下一页"
            >
              下一页
            </button>
          </nav>
        )}
        
        {/* 结构化数据 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": data?.data.map((article, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "NewsArticle",
                "headline": article.title,
                "description": article.summary,
                "image": article.imageUrl || "",
                "datePublished": article.pubDate,
                "author": {
                  "@type": "Person",
                  "name": article.author
                },
                "publisher": {
                  "@type": "Organization",
                  "name": article.source,
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://yourdomain.com/logo.png"
                  }
                },
                "mainEntityOfPage": {
                  "@type": "WebPage",
                  "@id": `https://yourdomain.com/news/article/${article.id}`
                }
              }
            }))
          })
        }} />
      </div>
    </>
  );
};

export default AllSourcesNewsList;
