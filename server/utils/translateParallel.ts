/**
 * 并行翻译工具函数
 * 使用多线程并行处理翻译请求，提高效率
 */

import { BACKUP_TRANSLATE, CLOUDFLARE_API, USE_CLOUDFLARE_TRANSLATE } from "../config/translate"
import { logger } from "./logger"

// 本地实现一些辅助函数，不再从 translate.ts 导入

/**
 * 模拟翻译单个文本
 * @param text 要翻译的文本
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 翻译后的文本
 */
function mockTranslateText(text: string, fromLang: string, toLang: string): string {
  // 如果已经是目标语言，直接返回
  if (fromLang === toLang) {
    return text
  }

  // 如果是空字符串，直接返回
  if (!text || text.trim() === "") {
    return text
  }

  // 简单的模拟翻译，添加前缀
  return `[EN] ${text}`
}

/**
 * 模拟翻译函数
 * @param text 要翻译的文本，可以是字符串或字符串数组
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 翻译后的文本，如果输入是数组则返回数组
 */
function mockTranslate(text: string | string[], fromLang: string, toLang: string): string | string[] {
  if (Array.isArray(text)) {
    return text.map(item => mockTranslateText(item, fromLang, toLang))
  }
  return mockTranslateText(text, fromLang, toLang)
}

/**
 * 检查翻译质量
 * @param originalText 原文
 * @param translatedText 翻译文
 * @returns 是否为低质量翻译
 */
function checkLowQualityTranslation(originalText: string, translatedText: string): boolean {
  // 检查翻译结果是否为空
  if (!translatedText || translatedText.trim() === "") {
    return true
  }

  // 检查翻译结果是否过短
  const originalLength = originalText.length
  const translatedLength = translatedText.length

  // 如果原文较长，但翻译结果过短，可能是低质量翻译
  if (originalLength > 10 && translatedLength < originalLength * 0.3) {
    return true
  }

  // 检查翻译结果是否匹配低质量模式
  const lowQualityPatterns = [
    /^[a-z]{1,2}$/i, // 只有1-2个字母
    /^\d+$/, // 只有数字
    /^[.,!?;:]+$/, // 只有标点符号
    /^(the|a|an|this|that|these|those)$/i, // 只有冠词或指示代词
  ]

  for (const pattern of lowQualityPatterns) {
    if (pattern.test(translatedText)) {
      return true
    }
  }

  return false
}

/**
 * 检查翻译结果是否与原文无关
 * @param originalText 原文
 * @param translatedText 翻译文
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 是否为无关翻译
 */
function checkUnrelatedTranslation(originalText: string, translatedText: string, fromLang: string, toLang: string): boolean {
  // 如果翻译前后语言相同，则检查是否完全相同
  if (fromLang === toLang) {
    return originalText === translatedText
  }

  // 从中文翻译到英文的特殊检查
  if (fromLang === "zh" && toLang === "en") {
    // 检查是否包含中文字符
    if (/[\u4E00-\u9FA5]/.test(translatedText)) {
      return true
    }
  }

  return false
}

/**
 * 使用 Cloudflare 翻译 API 进行并行翻译
 * 通过批处理和并行请求提高翻译效率
 * @param text 要翻译的文本或文本数组
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 翻译后的文本或文本数组
 */
export async function translateWithCloudflareParallel(text: string | string[], fromLang: string, toLang: string): Promise<string | string[]> {
  const isArray = Array.isArray(text)
  const textArray = isArray ? text : [text]

  // 如果文本数组为空，直接返回
  if (textArray.length === 0) {
    return isArray ? [] : ""
  }

  try {
    const { ACCOUNT_ID, API_KEY, MODEL } = CLOUDFLARE_API

    // 检查 API 配置是否完整
    if (!ACCOUNT_ID || !API_KEY) {
      logger.error("Cloudflare 翻译 API 配置不完整，使用模拟翻译")
      return mockTranslate(text, fromLang, toLang)
    }

    // 构建 API URL
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`

    // 将文本数组分成多个批次，每批次最多3个项目（减少批处理大小）
    const batchSize = 3
    const batches: string[][] = []

    for (let i = 0; i < textArray.length; i += batchSize) {
      batches.push(textArray.slice(i, i + batchSize))
    }

    logger.info(`将${textArray.length}个文本项分成${batches.length}个批次进行并行翻译`)

    // 用于存储所有翻译结果的数组
    const allTranslatedResults: string[] = Array.from({ length: textArray.length }).fill("")

    // 定义单个文本项的翻译函数
    async function translateSingleText(currentText: string, batchIndex: number, innerIndex: number, globalIndex: number): Promise<{ index: number, text: string }> {
      // 跳过空文本
      if (!currentText || currentText.trim() === "") {
        return { index: globalIndex, text: "" }
      }

      // 构建请求体 - 确保 text 是字符串而不是数组
      const requestBody = {
        text: currentText,
        source_lang: fromLang,
        target_lang: toLang,
      }

      const shortText = currentText.length > 30
        ? `${currentText.substring(0, 30)}...`
        : currentText
      logger.info(`批次${batchIndex + 1}/${batches.length}, 项目${innerIndex + 1}: 翻译原文: "${shortText}"`)
      logger.info(`翻译请求体: ${JSON.stringify(requestBody)}`)

      let translatedText = ""
      let retryCount = 0
      const maxRetries = 3 // 增加最大重试次数

      while (retryCount <= maxRetries) {
        try {
          // 创建 AbortController 用于超时控制
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 增加超时时间到10秒

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`翻译请求失败: ${response.status} ${response.statusText}`)
          }

          const data = await response.json() as {
            success?: boolean
            result?: {
              translated_text?: string
            }
          }

          // 检查响应是否成功
          if (data && data.success === true && data.result && data.result.translated_text) {
            translatedText = data.result.translated_text

            // 检查翻译质量
            if (checkLowQualityTranslation(currentText, translatedText)
              || checkUnrelatedTranslation(currentText, translatedText, fromLang, toLang)) {
              const shortTranslated = translatedText.length > 30
                ? `${translatedText.substring(0, 30)}...`
                : translatedText
              logger.warn(`检测到低质量翻译: "${shortText}" -> "${shortTranslated}"，使用模拟翻译`)
              translatedText = mockTranslateText(currentText, fromLang, toLang)
            }
            break // 成功获取翻译，跳出重试循环
          } else {
            logger.error(`翻译响应无效: ${JSON.stringify(data)}`)
            throw new Error("翻译响应无效")
          }
        } catch (error: any) {
          retryCount++
          const isTimeout = error.name === "AbortError" || String(error).includes("timeout")
          const isRateLimit = String(error).includes("429") || String(error).includes("Too Many Requests")

          logger.error(`翻译请求失败 (尝试 ${retryCount}/${maxRetries + 1}): ${error}${isTimeout ? " (超时)" : ""}${isRateLimit ? " (限流)" : ""}`)

          if (retryCount <= maxRetries) {
            // 使用指数退避策略，特别是对于限流错误
            const waitTime = isRateLimit
              ? 2000 * 2 ** retryCount // 限流错误：2秒、4秒、8秒、16秒
              : 1000 * 1.5 ** retryCount // 其他错误：1.5秒、2.25秒、3.4秒、5秒

            logger.info(`等待${waitTime}毫秒后重试...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          } else {
            // 所有重试都失败，使用模拟翻译
            logger.warn(`所有重试都失败，使用模拟翻译: "${shortText}"`)
            translatedText = mockTranslateText(currentText, fromLang, toLang)
          }
        }
      }

      return { index: globalIndex, text: translatedText }
    }

    // 并行处理每个批次
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      logger.info(`处理批次 ${batchIndex + 1}/${batches.length}, 包含 ${batch.length} 个项目`)

      // 并行处理批次中的每个文本项
      const batchPromises = batch.map((currentText, innerIndex) => {
        const globalIndex = batchIndex * batchSize + innerIndex
        return translateSingleText(currentText, batchIndex, innerIndex, globalIndex)
      })

      // 等待批次中的所有翻译完成
      const batchResults = await Promise.all(batchPromises)

      // 将结果放入正确的位置
      batchResults.forEach((result) => {
        allTranslatedResults[result.index] = result.text
      })

      // 在批次之间添加较长延迟，避免API限流
      if (batchIndex < batches.length - 1) {
        const batchDelay = 2000 // 增加到2秒
        logger.info(`批次间等待${batchDelay}毫秒，避免API限流...`)
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }

    return isArray ? allTranslatedResults : allTranslatedResults[0] || ""
  } catch (error: any) {
    logger.error(`翻译过程中出错: ${error}`)
    return mockTranslate(text, fromLang, toLang)
  }
}

/**
 * 并行翻译函数
 * @param text 要翻译的文本，可以是字符串或字符串数组
 * @param fromLang 源语言，默认为'zh'
 * @param toLang 目标语言，默认为'en'
 * @returns 翻译后的文本，如果输入是数组则返回数组
 */
export async function translateParallel(text: string | string[], fromLang: string = "zh", toLang: string = "en"): Promise<string | string[]> {
  try {
    // 如果是空字符串或语言相同，直接返回
    if (!text || fromLang === toLang) return text

    // 记录翻译开始时间
    const startTime = Date.now()
    let result: string | string[]

    // 如果使用Cloudflare翻译API
    if (USE_CLOUDFLARE_TRANSLATE) {
      result = await translateWithCloudflareParallel(text, fromLang, toLang)
    } else if (BACKUP_TRANSLATE.USE_MOCK) {
      result = mockTranslate(text, fromLang, toLang)
    } else {
      logger.warn("没有可用的翻译方法，返回原文")
      result = text
    }

    // 记录翻译完成时间和耗时
    const endTime = Date.now()
    const timeUsed = endTime - startTime
    const isArray = Array.isArray(text)
    const itemCount = isArray ? (text as string[]).length : 1

    logger.info(`翻译完成: ${itemCount}个项目, 耗时${timeUsed}ms, 平均${Math.round(timeUsed / itemCount)}ms/项`)

    return result
  } catch (error: any) {
    logger.error(`翻译出错: ${error}`)

    // 出错时返回原文
    return text
  }
}

/**
 * 并行翻译单个文本
 * @param text 要翻译的文本
 * @param fromLang 源语言，默认为'zh'
 * @param toLang 目标语言，默认为'en'
 * @returns 翻译后的文本
 */
export async function translateTextParallel(
  text: string,
  fromLang: string = "zh",
  toLang: string = "en",
): Promise<string> {
  const results = await translateParallel([text], fromLang, toLang) as string[]
  return results[0] || text
}
