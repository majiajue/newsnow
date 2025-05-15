/**
 * DeepSeek内容分析API
 * 使用DeepSeek API提供内容深度分析
 */

import { defineEventHandler, readBody } from "h3"
// 使用console替代logger
import { readArticleContent } from "../../utils/jinaApi"
import { generateDeepSeekAnalysis } from "../../utils/deepseekAnalyzer"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url, title, content } = body

    // 需要提供URL或内容
    if (!url && !content) {
      return {
        success: false,
        error: "缺少必要参数: url或content"
      }
    }

    let articleTitle = title
    let articleContent = content
    let articleUrl = url

    // 如果提供了URL但没有内容，使用Jina Reader获取内容
    if (url && !content) {
      console.log(`使用Jina Reader API获取URL内容: ${url}`)
      const contentResult = await readArticleContent(url, { 
        extractLinks: false, 
        extractImages: false 
      })
      
      if (!contentResult.success) {
        return {
          success: false,
          error: contentResult.error || "获取URL内容失败"
        }
      }
      
      articleTitle = contentResult.title || title || "未知标题"
      articleContent = contentResult.content
    }

    // 使用DeepSeek生成分析
    console.log(`使用DeepSeek分析内容: ${articleTitle}`)
    const analysisResult = await generateDeepSeekAnalysis(
      articleTitle,
      articleContent,
      articleUrl
    )
    
    if (!analysisResult.success) {
      return {
        success: false,
        error: analysisResult.error || "内容分析失败"
      }
    }
    
    return {
      success: true,
      title: articleTitle,
      url: articleUrl,
      analysis: analysisResult,
      timestamp: Date.now()
    }
  } catch (error: any) {
    console.error(`DeepSeek分析API处理错误: ${error.message}`)
    return {
      success: false,
      error: `处理请求时出错: ${error.message}`
    }
  }
})
