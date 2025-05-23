import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { useRelativeTime } from '../../hooks/useRelativeTime';
import DefaultNewsImage from '../common/DefaultNewsImage';

// 文章接口
interface Article {
  id: string;
  title: string;
  url: string;
  summary?: string; // 添加回来以兼容现有代码
  content?: string;
  imageUrl?: string;
  source?: string;
  category?: string;
  author?: string;
  aiComment?: string | AIAnalysisContent;
  metadata?: string;
  timestamp?: number;
  publishedAt?: string;
  pubDate?: string; // 添加回来以兼容现有代码
}

// 文章元数据接口
interface AIAnalysisContent {
  summary?: string;
  comment?: string;
  keyPoints?: string[] | string;
  background?: string;
  impact?: string;
  opinion?: string;
  suggestions?: string[] | string;
  [key: string]: any; // 允许其他字段
}

interface ArticleMetadata {
  aiAnalysis?: string;
  aiComment?: string | AIAnalysisContent;
  aiAnalysisContent?: string | AIAnalysisContent;
  category?: string;
  source?: string;
  author?: string;
  originalTitle?: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  data: Article;
  message?: string;
}

// 相关文章API响应接口
interface RelatedArticlesResponse {
  code: number;
  data: Article[];
  message?: string;
}

// 获取文章详情的函数
const fetchArticleDetail = async (id: string): Promise<ApiResponse> => {
  console.log(`正在获取文章详情，ID: ${id}`);
  const response = await fetch(`/api/news/article/${id}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`获取文章详情失败，状态码: ${response.status}，错误信息:`, errorText);
    throw new Error(`获取文章详情失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`获取文章详情成功:`, data);
  return data;
};

// 获取相关文章的函数
const fetchRelatedArticles = async (id: string): Promise<RelatedArticlesResponse> => {
  console.log(`正在获取相关文章，ID: ${id}`);
  const response = await fetch(`/api/news/related-articles/${id}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`获取相关文章失败，状态码: ${response.status}，错误信息:`, errorText);
    throw new Error(`获取相关文章失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`获取相关文章成功:`, data);
  return data;
};

// 文章详情组件
const ArticleDetail: React.FC = () => {
  const { id } = useParams({ from: '/news/article/$id' });
  const { formatRelativeTime } = useRelativeTime();
  
  console.log(`渲染文章详情组件，文章ID: ${id}`);
  
  // 使用React Query获取文章数据
  const { data, isLoading, error } = useQuery({
    queryKey: ['articleDetail', id],
    queryFn: () => fetchArticleDetail(id as string),
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
  
  // 获取相关文章
  const { data: relatedArticlesData } = useQuery({
    queryKey: ['relatedArticles', id],
    queryFn: () => fetchRelatedArticles(id as string),
    enabled: !!data?.data, // 只有在主文章加载完成后才获取相关文章
  });
  
  const relatedArticles = relatedArticlesData?.data || [];
  
  const article = data?.data;
  
  // 滚动到页面顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  // 错误处理
  useEffect(() => {
    if (error) {
      console.error('文章详情获取错误:', error);
    }
  }, [error, article]);
  
  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>加载中 - 财经文章</title>
          <meta name="description" content="正在加载文章内容，请稍候..." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </>
    );
  }
  
  if (error || !article) {
    return (
      <>
        <Helmet>
          <title>文章加载失败</title>
          <meta name="description" content="无法加载文章内容，请稍后重试" />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  文章加载失败，请稍后重试。
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {error instanceof Error ? error.message : '未知错误'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <a href="/" className="text-blue-500 hover:underline">返回首页</a>
          </div>
        </div>
      </>
    );
  }
  
  // 构建结构化数据
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary,
    "image": article.imageUrl || "",
    "datePublished": article.pubDate,
    "dateModified": article.pubDate,
    "author": {
      "@type": "Person",
      "name": article.author || article.source
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
  };
  
  // 解析文章元数据
  const parseMetadata = (article: Article): ArticleMetadata => {
    if (!article.metadata) return {};
    try {
      return JSON.parse(article.metadata);
    } catch (e) {
      console.error('解析文章元数据失败:', e);
      return {};
    }
  };
  
  // 获取AI分析内容
  const getAiAnalysis = (article: Article): any => {
    if (!article) return null;
    
    const metadata = parseMetadata(article);
    console.log('解析后的元数据:', metadata);
    
    try {
      // 如果aiComment是对象，直接返回
      if (typeof article.aiComment === 'object' && article.aiComment !== null) {
        console.log('文章aiComment已经是对象:', article.aiComment);
        return article.aiComment;
      }
      
      // 如果aiComment是JSON字符串，尝试解析
      if (typeof article.aiComment === 'string' && article.aiComment.trim().startsWith('{')) {
        try {
          const parsedComment = JSON.parse(article.aiComment);
          console.log('成功解析aiComment为JSON:', parsedComment);
          return parsedComment;
        } catch (e) {
          console.error('解析aiComment失败:', e);
        }
      }
      
      // 优先使用metadata中的aiAnalysisContent字段
      if (metadata.aiAnalysisContent) {
        return metadata.aiAnalysisContent;
      }
      
      // 其次使用metadata中的aiAnalysis字段
      if (metadata.aiAnalysis) {
        return metadata.aiAnalysis;
      }
      
      // 再次使用metadata中的aiComment字段
      if (metadata.aiComment) {
        return metadata.aiComment;
      }
      
      // 最后使用文章的aiComment字段如果是字符串
      if (typeof article.aiComment === 'string') {
        return article.aiComment;
      }
    } catch (e) {
      console.error('获取AI分析内容时出错:', e);
    }
    
    // 如果都没有，生成一个默认的AI分析内容
    return JSON.stringify({
      summary: article.summary || article.title,
      comment: `这是关于"${article.title}"的财经新闻，提供了相关行业的最新动态。建议投资者关注相关发展，评估可能的市场影响。`,
      keyPoints: [
        `${article.title}反映了${article.category || '财经'}领域的最新发展趋势`,
        `这一动态对市场参与者具有重要参考价值`,
        `投资者应密切关注后续发展`
      ],
      background: `近期${article.category || '财经'}领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。`,
      impact: `短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。`,
      opinion: `从专业角度分析，这一发展符合当前经济和政策环境的整体趋势。建议投资者结合自身风险偏好和投资目标，审慎决策。`,
      suggestions: [
        `密切关注后续政策和市场反应`,
        `评估对自身投资组合的潜在影响`,
        `适当调整资产配置策略，分散风险`
      ]
    });
  };
  
  // 解析AI分析内容中的各个部分
  const parseAiAnalysisContent = (content: string | AIAnalysisContent | null): AIAnalysisContent | null => {
    if (!content) return null;
    
    console.log('开始解析AI分析内容:', content);
    
    // 当内容已经是对象时，处理其中可能包含的序号
    if (typeof content === 'object' && content !== null) {
      console.log('内容已经是对象格式，处理其中可能的序号:', content);
      // 创建一个新对象来存储处理后的内容
      const processedContent: AIAnalysisContent = {};
      
      // 处理对象中的每个字段
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string') {
          // 移除字符串中的序号模式 "\n\n数字."
          processedContent[key] = value.replace(/\n\n\d+\./g, '');
        } else if (Array.isArray(value)) {
          // 处理数组中的每个字符串
          processedContent[key] = value.map(item => 
            typeof item === 'string' ? item.replace(/\n\n\d+\./g, '') : item
          );
        } else {
          // 保持其他类型的值不变
          processedContent[key] = value;
        }
      }
      return processedContent;
    }
    
    // 如果是JSON字符串，尝试解析
    try {
      if (typeof content === 'string' && content.trim().startsWith('{') && content.trim().endsWith('}')) {
        console.log('可能是JSON格式，尝试解析');
        const parsedContent = JSON.parse(content);
        console.log('成功解析JSON格式:', parsedContent);
        return parsedContent as AIAnalysisContent;
      }
    } catch (e) {
      console.error('直接解析JSON失败:', e);
    }
    
    const sections: { [key: string]: string | string[] } = {};
    
    // 尝试先提取摘要和评论
    const summaryMatch = content.match(/摘要[:：]([\s\S]*?)(?=评论[:：]|关键要点[:：]|分析背景[:：]|影响评估[:：]|专业意见[:：]|建议行动[:：]|$)/i);
    if (summaryMatch && summaryMatch[1]) {
      sections.summary = summaryMatch[1].trim();
    }
    
    const commentMatch = content.match(/评论[:：]([\s\S]*?)(?=关键要点[:：]|分析背景[:：]|影响评估[:：]|专业意见[:：]|建议行动[:：]|$)/i);
    if (commentMatch && commentMatch[1]) {
      sections.comment = commentMatch[1].trim();
    }
    
    // 尝试提取关键要点
    const keyPointsMatch = content.match(/关键要点[:：]([\s\S]*?)(?=分析背景[:：]|影响评估[:：]|专业意见[:：]|建议行动[:：]|$)/i);
    if (keyPointsMatch && keyPointsMatch[1]) {
      // 改进关键要点的分割逻辑
      const pointsText = keyPointsMatch[1].trim();
      let points;
      if (pointsText.includes('\n')) {
        // 如果有多行，按行分割
        points = pointsText.split(/\n+/).filter(line => {
          const trimmedLine = line.trim();
          return trimmedLine.length > 0 && !trimmedLine.match(/^\d+[\.、．]\s*$/);
        });
        // 移除每行前的序号
        points = points.map(point => point.replace(/^\d+[\.、．]\s*/, '').trim());
      } else {
        // 如果没有多行，尝试按序号分割
        points = pointsText.split(/\d+[\.、．]/).filter(p => p.trim().length > 0).map(p => p.trim());
      }
      sections.keyPoints = points;
    }
    
    // 尝试提取分析背景
    const backgroundMatch = content.match(/分析背景[:：]([\s\S]*?)(?=影响评估[:：]|专业意见[:：]|建议行动[:：]|$)/i);
    if (backgroundMatch && backgroundMatch[1]) {
      sections.background = backgroundMatch[1].trim();
    }
    
    // 尝试提取影响评估
    const impactMatch = content.match(/影响评估[:：]([\s\S]*?)(?=专业意见[:：]|建议行动[:：]|$)/i);
    if (impactMatch && impactMatch[1]) {
      sections.impact = impactMatch[1].trim();
    }
    
    // 尝试提取专业意见
    const opinionMatch = content.match(/专业意见[:：]([\s\S]*?)(?=建议行动[:：]|$)/i);
    if (opinionMatch && opinionMatch[1]) {
      sections.opinion = opinionMatch[1].trim();
    }
    
    // 尝试提取建议行动
    const suggestionsMatch = content.match(/建议行动[:：]([\s\S]*?)$/i);
    if (suggestionsMatch && suggestionsMatch[1]) {
      // 改进建议行动的分割逻辑
      const suggestionsText = suggestionsMatch[1].trim();
      let suggestions;
      if (suggestionsText.includes('\n')) {
        // 如果有多行，按行分割
        suggestions = suggestionsText.split(/\n+/).filter(line => {
          const trimmedLine = line.trim();
          return trimmedLine.length > 0 && !trimmedLine.match(/^\d+[\.、．]\s*$/);
        });
        // 移除每行前的序号
        suggestions = suggestions.map(sugg => sugg.replace(/^\d+[\.、．]\s*/, '').trim());
      } else {
        // 如果没有多行，尝试按序号分割
        suggestions = suggestionsText.split(/\d+[\.、．]/).filter(s => s.trim().length > 0).map(s => s.trim());
      }
      sections.suggestions = suggestions;
    }
    
    console.log('解析后的各部分:', sections);
    
    return sections;
  };
  
  return (
    <>
      <Helmet>
        <title>{article.title} - {article.source}</title>
        <meta name="description" content={article.summary} />
        <meta name="keywords" content={`财经,新闻,${article.source},${article.category || ''}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://yourdomain.com/news/article/${article.id}`} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
        <meta property="article:published_time" content={article.pubDate} />
        <meta property="article:section" content={article.category || '财经'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary} />
        {article.imageUrl && <meta name="twitter:image" content={article.imageUrl} />}
      </Helmet>
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <header className="mb-6">
              <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
              <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4">
                <span className="flex items-center mr-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {article.pubDate ? formatRelativeTime(article.pubDate) : article.publishedAt ? formatRelativeTime(article.publishedAt) : '发布时间未知'}
                </span>
                
                <span className="flex items-center mr-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                  </svg>
                  {article.source}
                </span>
                
                {article.category && (
                  <span className="flex items-center mr-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    {article.category}
                  </span>
                )}
                
                {article.author && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    {article.author}
                  </span>
                )}
              </div>
            </header>
            
            {/* 文章图片 */}
            {article.imageUrl ? (
              <figure className="mb-6">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-full h-auto rounded-lg shadow-md" 
                  width="800"
                  height="450"
                />
                <figcaption className="text-center text-sm text-gray-500 mt-2">
                  {article.title} - 图片来源: {article.source}
                </figcaption>
              </figure>
            ) : (
              <figure className="mb-6">
                <div className="w-full h-64 rounded-lg shadow-md overflow-hidden">
                  <DefaultNewsImage title={article.title} />
                </div>
                <figcaption className="text-center text-sm text-gray-500 mt-2">
                  {article.title} - 智能生成图像
                </figcaption>
              </figure>
            )}
            
            {/* 原文链接 */}
            {article.url && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-semibold mb-2">原文链接:</p>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                  </svg>
                  点击查看原文: {article.url}
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  建议您点击上方链接查看原文内容，以获取最准确、最完整的信息。
                </p>
              </div>
            )}
            
            {/* 相关文章推荐 */}
            {relatedArticles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">相关推荐</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedArticles.map((relatedArticle, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <a href={`/news/article/${relatedArticle.id}`} className="hover:text-blue-500">
                        <h3 className="font-semibold mb-2 line-clamp-2">{relatedArticle.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{relatedArticle.summary}</p>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI 智能解读 - 适用于所有新闻源 */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-blue-500 mb-6">智能解读</h2>
              <div className="bg-blue-50 rounded-lg p-6">
                {(() => {
                  // 获取AI分析内容
                  const aiAnalysisContent = getAiAnalysis(article);
                  console.log('原始AI内容：', article.aiComment);
                  console.log('元数据：', article.metadata); 
                  console.log('处理后的AI分析内容：', aiAnalysisContent);
                  
                  // 特殊处理情况：如果原始AI内容是对象且包含特定字段
                  let aiAnalysisSections: AIAnalysisContent | null = null;
                  
                  // 判断是否已经是结构化对象
                  if (typeof article.aiComment === 'object' && article.aiComment !== null) {
                    // 直接使用对象格式的aiComment
                    console.log('检测到aiComment是对象格式:', article.aiComment);
                    aiAnalysisSections = article.aiComment as AIAnalysisContent;
                  } else {
                    // 如果不是特定格式，再使用解析函数处理
                    console.log('使用解析函数处理aiAnalysisContent:', aiAnalysisContent);
                    aiAnalysisSections = parseAiAnalysisContent(aiAnalysisContent) as AIAnalysisContent;
                  }
                  
                  console.log('最终的AI分析部分：', aiAnalysisSections);
                  
                  // 添加调试模式
                  // 当需要查看原始数据运行时，把这个设置为true
                  // 当发现AI内容显示有问题时，在控制台运行 localStorage.setItem('aiDebugMode', 'true');
                  const debugMode = localStorage.getItem('aiDebugMode') === 'true';
                  
                  if (debugMode) {
                    return (
                      <div>
                        {!aiAnalysisContent && (
                          <div className="text-center py-3 text-red-500 font-bold">
                            <p>暂无AI分析内容</p>
                          </div>
                        )}
                        
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                          <h4 className="font-bold text-yellow-700 mb-2">调试信息</h4>
                          
                          <div className="mb-3">
                            <p className="font-semibold">原始AI评论:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                              {article?.aiComment ? JSON.stringify(article?.aiComment, null, 2) : '无'}  
                            </pre>
                          </div>
                          
                          <div className="mb-3">
                            <p className="font-semibold">元数据:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                              {article?.metadata || '无'}  
                            </pre>
                          </div>
                          
                          <div className="mb-3">
                            <p className="font-semibold">处理后的AI分析内容:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                              {aiAnalysisContent ? aiAnalysisContent : '无'}  
                            </pre>
                          </div>
                          
                          <div className="mb-3">
                            <p className="font-semibold">解析后的AI分析部分:</p>
                            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                              {aiAnalysisSections ? JSON.stringify(aiAnalysisSections, null, 2) : '无'}  
                            </pre>
                          </div>
                        </div>
                        
                        {!aiAnalysisContent && (
                          <div className="text-center py-8 text-gray-500">
                            <p>暂无AI分析内容</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  if (!aiAnalysisContent) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>暂无AI分析内容</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div>
                      {/* 关键要点 */}
                      <div className="mb-6 bg-white bg-opacity-70 rounded-lg p-4 shadow-sm">
                        <h5 className="font-semibold mb-3 flex items-center text-indigo-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">关键要点</span>
                        </h5>
                        <ul className="space-y-2">
                          {((aiAnalysisSections && aiAnalysisSections.keyPoints) ? 
                            (Array.isArray(aiAnalysisSections.keyPoints) ? 
                              aiAnalysisSections.keyPoints : 
                              [aiAnalysisSections.keyPoints as string]) : 
                            [
                              `${article.title}反映了${article.category || '财经'}领域的最新发展趋势`,
                              '这一动态对市场参与者具有重要参考价值',
                              '投资者应密切关注后续发展'
                            ]
                          ).map((point: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold mr-2 mt-0.5">{index + 1}</span>
                              <span className="text-gray-700">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 分析背景 */}
                      <div className="mb-6 bg-white bg-opacity-70 rounded-lg p-4 shadow-sm">
                        <h5 className="font-semibold mb-3 flex items-center text-indigo-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 00-1-1v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-.414-.586L8 6h-3a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1v-1A2 2 0 009 4 2 2 0 007 2z" clipRule="evenodd"></path>
                          </svg>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">分析背景</span>
                        </h5>
                        <p className="text-gray-700">{aiAnalysisSections?.background || `近期${article.category || '财经'}领域发生了一系列重要变化，本文所报道的内容是这些变化的重要组成部分。从宏观角度看，这些变化将对整体经济环境产生深远影响。`}</p>
                      </div>
                      
                      {/* 影响评估 */}
                      <div className="mb-6 bg-white bg-opacity-70 rounded-lg p-4 shadow-sm">
                        <h5 className="font-semibold mb-3 flex items-center text-indigo-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                          </svg>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">影响评估</span>
                        </h5>
                        <p className="text-gray-700">{aiAnalysisSections?.impact || `短期内，该消息可能引起市场波动；中长期来看，将促进相关行业的结构性调整和优化升级。投资者应当理性看待这一变化，避免盲目跟风或恐慌性决策。`}</p>
                      </div>
                      
                      {/* 专业意见 */}
                      <div className="mb-6 bg-white bg-opacity-70 rounded-lg p-4 shadow-sm">
                        <h5 className="font-semibold mb-3 flex items-center text-indigo-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"></path>
                          </svg>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">专业意见</span>
                        </h5>
                        <p className="text-gray-700">{aiAnalysisSections?.opinion || `从专业角度来看，本文所描述的变化属于行业正常发展的范畴，不会对主要经济指标产生显著影响。然而，特定的细分行业可能会因此出现机会或挑战，应密切关注相关动态。`}</p>
                      </div>
                      
                      {/* 建议行动 */}
                      <div className="mb-3 bg-white bg-opacity-70 rounded-lg p-4 shadow-sm">
                        <h5 className="font-semibold mb-3 flex items-center text-indigo-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
                          </svg>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">建议行动</span>
                        </h5>
                        <ul className="space-y-2">
                          {((aiAnalysisSections && aiAnalysisSections.suggestions) ? 
                            (Array.isArray(aiAnalysisSections.suggestions) ? 
                              aiAnalysisSections.suggestions : 
                              [aiAnalysisSections.suggestions as string]) : 
                            [
                              '密切关注后续政策和市场反应',
                              '评估对自身投资组合的潜在影响',
                              '适当调整资产配置策略，分散风险'
                            ]
                          ).map((action: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold mr-2 mt-0.5">{index + 1}</span>
                              <span className="text-gray-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-5 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"></path>
                          </svg>
                          免责声明: 以上内容由AI自动生成，仅供参考，不构成投资建议。投资有风险，入市需谨慎。
                        </p>
                        <span className="text-indigo-500 font-medium">AI分析 v1.0</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* 分享按钮 */}
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button className="flex items-center text-blue-600 hover:text-blue-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                </svg>
                分享
              </button>
              <button className="flex items-center text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                </svg>
                收藏
              </button>
              <button className="flex items-center text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                更多
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticleDetail;
