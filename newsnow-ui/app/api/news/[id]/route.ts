import { NextResponse } from 'next/server';

// 后端API基础URL
const API_BASE_URL = 'http://localhost:5000';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
      date: detailData.pub_date,
      readTime: '5 min read',
      imageUrl: detailData.image_url,
      category: detailData.category,
      url: detailData.url,
      author: detailData.author,
      tags: detailData.tags || [],
      summary: detailData.summary,
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
