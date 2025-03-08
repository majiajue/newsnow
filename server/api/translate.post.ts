import { defineEventHandler, readBody } from "h3"
import { translate as translateUtil } from "../utils/translate"
import { logger } from "../utils/logger"

/**
 * 翻译API端点
 * 接收POST请求，包含要翻译的文本和目标语言
 * 返回翻译后的文本
 */
export default defineEventHandler(async (event) => {
  try {
    // 解析请求体
    const { text, targetLanguage = "en", sourceLanguage = "zh" } = await readBody(event)

    // 验证参数
    if (!text) {
      return {
        success: false,
        error: "缺少要翻译的文本",
      }
    }

    // 如果源语言和目标语言相同，直接返回原文
    if (sourceLanguage === targetLanguage) {
      return {
        success: true,
        translation: text,
      }
    }

    console.log(`翻译请求: 从 ${sourceLanguage} 到 ${targetLanguage}, 文本: ${text.substring(0, 30)}${text.length > 30 ? "..." : ""}`)

    // 执行翻译
    const translation = await translateUtil(text, sourceLanguage, targetLanguage)

    // 移除可能的"[EN]"前缀
    let cleanTranslation = translation
    if (typeof cleanTranslation === "string" && cleanTranslation.startsWith("[EN]")) {
      cleanTranslation = cleanTranslation.substring(5).trim()
    }

    // 返回翻译结果
    return {
      success: true,
      translation: cleanTranslation,
    }
  } catch (error) {
    // 记录错误
    console.error("翻译API出错:", error)
    logger.error(`Translation API error: ${error}`)

    // 返回错误信息
    return {
      success: false,
      error: String(error),
    }
  }
})
