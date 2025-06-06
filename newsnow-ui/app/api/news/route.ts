import { NextResponse } from 'next/server';

// 后端API基础URL
const API_BASE_URL = 'http://localhost:5001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 构建查询参数
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key === 'limit') {
        params.set('pageSize', value);
      } else {
        params.set(key, value);
      }
    });
    
    // 调用后端API
    const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 转换数据格式以匹配前端期望的格式
    const transformedData = {
      data: data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.summary || item.content?.substring(0, 150) + '...',
        source: item.source,
        date: item.pub_date,
        readTime: '3 min read',
        imageUrl: item.image_url,
        category: item.category,
        content: item.content,
        url: item.url,
        author: item.author,
        tags: item.tags || []
      })),
      pagination: data.pagination
    };
    
    return NextResponse.json(transformedData);
    
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    return NextResponse.json(
      { error: '获取新闻列表失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
