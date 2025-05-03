/**
 * 内容管理模块
 * 提供内容的存储、检索、分类和版本管理功能
 */

import { logger } from "./logger"
import { PrismaClient } from "@prisma/client"
import { analyzeContent } from "./contentAnalyzer"

// 初始化Prisma客户端
const prisma = new PrismaClient()

/**
 * 内容项接口
 */
interface ContentItem {
  id?: string
  title: string
  content: string
  source?: string
  sourceUrl?: string
  author?: string
  publishDate?: Date
  categories?: string[]
  tags?: string[]
  keywords?: string[]
  summary?: string
  quality?: number
  status?: string
  version?: number
  parentId?: string
  metadata?: any
}

/**
 * 保存内容到数据库
 * @param item 内容项
 * @returns 保存的内容项
 */
export async function saveContent(item: ContentItem): Promise<any> {
  try {
    logger.info(`保存内容: ${item.title}`)
    
    // 如果没有指定版本，默认为1
    if (!item.version) {
      item.version = 1
    }
    
    // 如果没有指定状态，默认为草稿
    if (!item.status) {
      item.status = 'draft'
    }
    
    // 转换categories和tags为JSON字符串
    const categories = item.categories ? JSON.stringify(item.categories) : '[]'
    const tags = item.tags ? JSON.stringify(item.tags) : '[]'
    const keywords = item.keywords ? JSON.stringify(item.keywords) : '[]'
    const metadata = item.metadata ? JSON.stringify(item.metadata) : '{}'
    
    // 保存到数据库
    const savedItem = await prisma.content.create({
      data: {
        title: item.title,
        content: item.content,
        source: item.source || '',
        sourceUrl: item.sourceUrl || '',
        author: item.author || '',
        publishDate: item.publishDate || new Date(),
        categories,
        tags,
        keywords,
        summary: item.summary || '',
        quality: item.quality || 0,
        status: item.status,
        version: item.version,
        parentId: item.parentId || null,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    logger.info(`内容保存成功，ID: ${savedItem.id}`)
    
    // 转换返回结果
    return {
      ...savedItem,
      categories: JSON.parse(savedItem.categories || '[]'),
      tags: JSON.parse(savedItem.tags || '[]'),
      keywords: JSON.parse(savedItem.keywords || '[]'),
      metadata: JSON.parse(savedItem.metadata || '{}')
    }
  } catch (error: any) {
    logger.error(`保存内容失败: ${error.message}`)
    throw new Error(`保存内容失败: ${error.message}`)
  }
}

/**
 * 更新内容
 * @param id 内容ID
 * @param updates 更新内容
 * @returns 更新后的内容项
 */
export async function updateContent(id: string, updates: Partial<ContentItem>): Promise<any> {
  try {
    logger.info(`更新内容: ${id}`)
    
    // 获取当前内容
    const currentContent = await prisma.content.findUnique({
      where: { id }
    })
    
    if (!currentContent) {
      throw new Error(`内容不存在: ${id}`)
    }
    
    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // 只更新提供的字段
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.source !== undefined) updateData.source = updates.source
    if (updates.sourceUrl !== undefined) updateData.sourceUrl = updates.sourceUrl
    if (updates.author !== undefined) updateData.author = updates.author
    if (updates.publishDate !== undefined) updateData.publishDate = updates.publishDate
    if (updates.summary !== undefined) updateData.summary = updates.summary
    if (updates.quality !== undefined) updateData.quality = updates.quality
    if (updates.status !== undefined) updateData.status = updates.status
    
    // 处理数组和对象字段
    if (updates.categories !== undefined) updateData.categories = JSON.stringify(updates.categories)
    if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags)
    if (updates.keywords !== undefined) updateData.keywords = JSON.stringify(updates.keywords)
    if (updates.metadata !== undefined) updateData.metadata = JSON.stringify(updates.metadata)
    
    // 更新数据库
    const updatedItem = await prisma.content.update({
      where: { id },
      data: updateData
    })
    
    logger.info(`内容更新成功: ${id}`)
    
    // 转换返回结果
    return {
      ...updatedItem,
      categories: JSON.parse(updatedItem.categories || '[]'),
      tags: JSON.parse(updatedItem.tags || '[]'),
      keywords: JSON.parse(updatedItem.keywords || '[]'),
      metadata: JSON.parse(updatedItem.metadata || '{}')
    }
  } catch (error: any) {
    logger.error(`更新内容失败: ${error.message}`)
    throw new Error(`更新内容失败: ${error.message}`)
  }
}

/**
 * 创建内容新版本
 * @param id 原内容ID
 * @param updates 更新内容
 * @returns 新版本内容项
 */
export async function createContentVersion(id: string, updates: Partial<ContentItem>): Promise<any> {
  try {
    logger.info(`创建内容新版本: ${id}`)
    
    // 获取当前内容
    const currentContent = await prisma.content.findUnique({
      where: { id }
    })
    
    if (!currentContent) {
      throw new Error(`内容不存在: ${id}`)
    }
    
    // 创建新版本
    const newVersion = currentContent.version + 1
    
    // 准备新版本数据
    const newVersionData: any = {
      title: updates.title || currentContent.title,
      content: updates.content || currentContent.content,
      source: updates.source || currentContent.source,
      sourceUrl: updates.sourceUrl || currentContent.sourceUrl,
      author: updates.author || currentContent.author,
      publishDate: updates.publishDate || currentContent.publishDate,
      categories: updates.categories ? JSON.stringify(updates.categories) : currentContent.categories,
      tags: updates.tags ? JSON.stringify(updates.tags) : currentContent.tags,
      keywords: updates.keywords ? JSON.stringify(updates.keywords) : currentContent.keywords,
      summary: updates.summary || currentContent.summary,
      quality: updates.quality || currentContent.quality,
      status: updates.status || currentContent.status,
      version: newVersion,
      parentId: id,
      metadata: updates.metadata ? JSON.stringify(updates.metadata) : currentContent.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 保存新版本
    const newVersionItem = await prisma.content.create({
      data: newVersionData
    })
    
    logger.info(`内容新版本创建成功，ID: ${newVersionItem.id}，版本: ${newVersion}`)
    
    // 转换返回结果
    return {
      ...newVersionItem,
      categories: JSON.parse(newVersionItem.categories || '[]'),
      tags: JSON.parse(newVersionItem.tags || '[]'),
      keywords: JSON.parse(newVersionItem.keywords || '[]'),
      metadata: JSON.parse(newVersionItem.metadata || '{}')
    }
  } catch (error: any) {
    logger.error(`创建内容新版本失败: ${error.message}`)
    throw new Error(`创建内容新版本失败: ${error.message}`)
  }
}

/**
 * 获取内容
 * @param id 内容ID
 * @returns 内容项
 */
export async function getContent(id: string) {
  logger.info(`开始获取财联社文章`, { articleId: id });
  
  // 修正后的URL格式
  const urls = [
    `https://www.cls.cn/detail/${id}`, // 主站详情页
    `https://www.cls.cn/article/${id}`, // 备用详情页
    `https://www.cls.cn/depth/detail/${id}` // 深度详情页
  ];

  for (const url of urls) {
    try {
      const content = await fetchArticle(url);
      if (content?.text) {
        logger.info(`成功获取文章内容`, { 
          articleId: id,
          source: url,
          contentPreview: content.text.substring(0, 50) + '...'
        });
        return content;
      }
    } catch (error) {
      logger.warn(`内容获取尝试失败`, { 
        articleId: id,
        url,
        error: error.message 
      });
    }
  }
  
  // Jina API备用方案
  const jinaResponse = await fetch(`https://jina-api.example.com/extract?url=https://www.cls.cn/detail/${id}`);
  if (jinaResponse.ok) {
    return await jinaResponse.json();
  }
  
  logger.error(`所有内容源均不可用`, { articleId: id });
  throw new Error('无法获取文章内容');
}

/**
 * 获取内容所有版本
 * @param id 内容ID
 * @returns 内容版本列表
 */
export async function getContentVersions(id: string): Promise<any[]> {
  try {
    logger.info(`获取内容所有版本: ${id}`)
    
    // 获取当前内容
    const currentContent = await prisma.content.findUnique({
      where: { id }
    })
    
    if (!currentContent) {
      throw new Error(`内容不存在: ${id}`)
    }
    
    // 获取所有相关版本
    const allVersions = await prisma.content.findMany({
      where: {
        OR: [
          { id },
          { parentId: id }
        ]
      },
      orderBy: {
        version: 'asc'
      }
    })
    
    // 转换返回结果
    return allVersions.map(version => ({
      ...version,
      categories: JSON.parse(version.categories || '[]'),
      tags: JSON.parse(version.tags || '[]'),
      keywords: JSON.parse(version.keywords || '[]'),
      metadata: JSON.parse(version.metadata || '{}')
    }))
  } catch (error: any) {
    logger.error(`获取内容版本失败: ${error.message}`)
    throw new Error(`获取内容版本失败: ${error.message}`)
  }
}

/**
 * 搜索内容
 * @param query 搜索条件
 * @returns 内容列表
 */
export async function searchContent(query: {
  keyword?: string,
  category?: string,
  tag?: string,
  status?: string,
  minQuality?: number,
  page?: number,
  pageSize?: number,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
}): Promise<{
  items: any[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}> {
  try {
    logger.info(`搜索内容: ${JSON.stringify(query)}`)
    
    // 设置默认值
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const sortBy = query.sortBy || 'updatedAt'
    const sortOrder = query.sortOrder || 'desc'
    
    // 构建搜索条件
    const where: any = {}
    
    // 只获取最新版本的内容
    where.parentId = null
    
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { content: { contains: query.keyword } },
        { summary: { contains: query.keyword } }
      ]
    }
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.minQuality !== undefined) {
      where.quality = {
        gte: query.minQuality
      }
    }
    
    // 获取总数
    const total = await prisma.content.count({ where })
    
    // 计算总页数
    const totalPages = Math.ceil(total / pageSize)
    
    // 获取内容列表
    const items = await prisma.content.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    
    // 转换返回结果
    const formattedItems = items.map(item => ({
      ...item,
      categories: JSON.parse(item.categories || '[]'),
      tags: JSON.parse(item.tags || '[]'),
      keywords: JSON.parse(item.keywords || '[]'),
      metadata: JSON.parse(item.metadata || '{}')
    }))
    
    // 过滤分类和标签
    if (query.category) {
      const filteredItems = formattedItems.filter(item => 
        item.categories.includes(query.category)
      )
      return {
        items: filteredItems,
        total: filteredItems.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredItems.length / pageSize)
      }
    }
    
    if (query.tag) {
      const filteredItems = formattedItems.filter(item => 
        item.tags.includes(query.tag)
      )
      return {
        items: filteredItems,
        total: filteredItems.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredItems.length / pageSize)
      }
    }
    
    return {
      items: formattedItems,
      total,
      page,
      pageSize,
      totalPages
    }
  } catch (error: any) {
    logger.error(`搜索内容失败: ${error.message}`)
    throw new Error(`搜索内容失败: ${error.message}`)
  }
}

/**
 * 删除内容
 * @param id 内容ID
 * @returns 删除结果
 */
export async function deleteContent(id: string): Promise<boolean> {
  try {
    logger.info(`删除内容: ${id}`)
    
    // 获取所有相关版本
    const allVersions = await prisma.content.findMany({
      where: {
        OR: [
          { id },
          { parentId: id }
        ]
      }
    })
    
    // 删除所有版本
    await prisma.content.deleteMany({
      where: {
        OR: allVersions.map(version => ({ id: version.id }))
      }
    })
    
    logger.info(`内容删除成功: ${id}，共删除${allVersions.length}个版本`)
    
    return true
  } catch (error: any) {
    logger.error(`删除内容失败: ${error.message}`)
    throw new Error(`删除内容失败: ${error.message}`)
  }
}

/**
 * 获取所有分类
 * @returns 分类列表
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    logger.info('获取所有分类')
    
    // 获取所有内容
    const contents = await prisma.content.findMany({
      select: {
        categories: true
      }
    })
    
    // 提取所有分类
    const categoriesSet = new Set<string>()
    
    contents.forEach(content => {
      try {
        const categories = JSON.parse(content.categories || '[]')
        categories.forEach((category: string) => {
          categoriesSet.add(category)
        })
      } catch (e) {
        // 忽略解析错误
      }
    })
    
    return Array.from(categoriesSet)
  } catch (error: any) {
    logger.error(`获取所有分类失败: ${error.message}`)
    throw new Error(`获取所有分类失败: ${error.message}`)
  }
}

/**
 * 获取所有标签
 * @returns 标签列表
 */
export async function getAllTags(): Promise<string[]> {
  try {
    logger.info('获取所有标签')
    
    // 获取所有内容
    const contents = await prisma.content.findMany({
      select: {
        tags: true
      }
    })
    
    // 提取所有标签
    const tagsSet = new Set<string>()
    
    contents.forEach(content => {
      try {
        const tags = JSON.parse(content.tags || '[]')
        tags.forEach((tag: string) => {
          tagsSet.add(tag)
        })
      } catch (e) {
        // 忽略解析错误
      }
    })
    
    return Array.from(tagsSet)
  } catch (error: any) {
    logger.error(`获取所有标签失败: ${error.message}`)
    throw new Error(`获取所有标签失败: ${error.message}`)
  }
}

/**
 * 分析并保存内容
 * @param item 内容项
 * @returns 保存的内容项
 */
export async function analyzeAndSaveContent(item: ContentItem): Promise<any> {
  try {
    logger.info(`分析并保存内容: ${item.title}`)
    
    // 分析内容
    const analysisResult = await analyzeContent(item.content, {
      title: item.title,
      extractKeywords: true,
      analyzeSentiment: true,
      analyzeQuality: true,
      analyzeReadability: true,
      extractTopics: true,
      generateSummary: true
    })
    
    if (!analysisResult.success) {
      throw new Error(`内容分析失败: ${analysisResult.error}`)
    }
    
    // 准备保存数据
    const saveData: ContentItem = {
      ...item,
      keywords: analysisResult.keywords || [],
      summary: analysisResult.summary || '',
      quality: analysisResult.quality?.score || 0,
      categories: analysisResult.topics?.map(topic => topic.topic) || [],
      metadata: {
        analysis: {
          sentiment: analysisResult.sentiment,
          readability: analysisResult.readability,
          quality: analysisResult.quality
        }
      }
    }
    
    // 保存内容
    return await saveContent(saveData)
  } catch (error: any) {
    logger.error(`分析并保存内容失败: ${error.message}`)
    throw new Error(`分析并保存内容失败: ${error.message}`)
  }
}
