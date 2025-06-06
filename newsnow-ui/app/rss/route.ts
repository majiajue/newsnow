import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 获取最新新闻
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/news?limit=50`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('获取新闻失败')
    }
    
    const newsData = await response.json()
    const articles = newsData.articles || newsData || []
    
    // 生成RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>NewsNow - 实时新闻聚合</title>
    <description>NewsNow是一款专业的实时新闻聚合阅读器，汇集全球财经、科技、政治等热点新闻，提供AI智能分析和优雅的阅读体验。</description>
    <link>https://shishixinwen.news</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://shishixinwen.news/rss" rel="self" type="application/rss+xml"/>
    <generator>NewsNow RSS Generator</generator>
    <webMaster>contact@shishixinwen.news (NewsNow Team)</webMaster>
    <managingEditor>contact@shishixinwen.news (NewsNow Team)</managingEditor>
    <copyright>Copyright © 2024 NewsNow. All rights reserved.</copyright>
    <category>新闻</category>
    <ttl>60</ttl>
    <image>
      <url>https://shishixinwen.news/logo.png</url>
      <title>NewsNow</title>
      <link>https://shishixinwen.news</link>
      <width>144</width>
      <height>144</height>
    </image>
    
${articles.map((article: any) => {
  const pubDate = new Date(article.publishedAt || article.pubDate || article.date || new Date()).toUTCString()
  const description = article.summary || article.aiAnalysis?.summary || article.content?.substring(0, 200) || ''
  const content = article.content || ''
  
  return `    <item>
      <title><![CDATA[${article.title || ''}]]></title>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <link>https://shishixinwen.news/news/${article.id}</link>
      <guid isPermaLink="true">https://shishixinwen.news/news/${article.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>contact@shishixinwen.news (${article.author || article.source || 'NewsNow'})</author>
      <category><![CDATA[${article.category || '新闻'}]]></category>
      <source url="https://shishixinwen.news">NewsNow</source>
      ${article.imageUrl ? `<enclosure url="${article.imageUrl}" type="image/jpeg"/>` : ''}
    </item>`
}).join('\n')}
    
  </channel>
</rss>`

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('生成RSS失败:', error)
    return new NextResponse('RSS生成失败', { status: 500 })
  }
}
