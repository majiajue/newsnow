import { NextResponse } from 'next/server';

// 后端API基础URL
// Backend API base URL, should be set via environment variable for flexibility
// For server-side calls within Docker, this will be like 'http://newsnow-python:5001'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'; // Fallback for local dev outside Docker

type Params = {
  params: {
    id: string;
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少新闻ID' },
        { status: 400 }
      );
    }
    
    // 获取新闻详情
    const [detailResponse, relatedResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/news/${id}`),
      fetch(`${API_BASE_URL}/api/news/${id}/related?limit=4`)
    ]);
    
    if (!detailResponse.ok) {
      throw new Error(`获取新闻详情失败: ${detailResponse.statusText}`);
    }
    
    const detailData = await detailResponse.json();
    const relatedData = await relatedResponse.json();
    
    // 转换数据格式
    const transformedData = {
      id: detailData.id,
      title: detailData.title,
      content: detailData.content,
      source: detailData.source,
      date: detailData.pubDate || detailData.pub_date,
      publishedAt: detailData.pubDate || detailData.pub_date,
      readTime: '5 min read',
      imageUrl: detailData.imageUrl || detailData.image_url,
      category: detailData.category,
      url: detailData.url,
      author: detailData.author,
      tags: detailData.tags || [],
      summary: detailData.summary,
      // 添加AI分析数据
      metadata: detailData.metadata || {},
      aiAnalysis: detailData.metadata ? {
        summary: detailData.metadata.executive_summary || '',
        keyPoints: detailData.metadata.market_analysis?.affected_sectors?.map((sector: any) => 
          `${sector.sector}: ${sector.analysis}`) || [],
        background: detailData.metadata.market_analysis?.immediate_impact || '',
        impact: detailData.metadata.market_analysis?.long_term_implications || '',
        opinion: detailData.metadata.investment_perspective?.opportunities || '',
        suggestions: detailData.metadata.investment_perspective?.strategy_suggestions ? 
          [detailData.metadata.investment_perspective.strategy_suggestions] : [],
        sentiment: '中性',
        tags: detailData.metadata.tags || []
      } : undefined,
      relatedArticles: (relatedData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        source: item.source,
        date: item.pub_date,
        imageUrl: item.image_url
      }))
    };
    
    return NextResponse.json(transformedData);
    
  } catch (error) {
    console.error('获取新闻详情失败:', error);
    return NextResponse.json(
      { error: '获取新闻详情失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
