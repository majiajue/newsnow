/**
 * 翻译工具函数
 * 使用第三方API进行翻译
 */

import { BACKUP_TRANSLATE, CLOUDFLARE_API, USE_CLOUDFLARE_TRANSLATE } from "../config/translate"
import { myFetch } from "./fetch"
import { logger } from "./logger"

// 常见中文词汇的英文翻译
const commonTranslations: Record<string, string> = {
  今日热榜: "Today's Hot List",
  知乎: "Zhihu",
  微博: "Weibo",
  百度: "Baidu",
  贴吧: "Tieba",
  豆瓣: "Douban",
  华尔街见闻: "Wall Street News",
  金融: "Finance",
  科技: "Technology",
  热榜: "Hot List",
  热门: "Popular",
  最新: "Latest",
  推荐: "Recommended",
  关注: "Follow",
  点赞: "Like",
  评论: "Comment",
  分享: "Share",
  收藏: "Favorite",
  发布: "Publish",
  搜索: "Search",
  登录: "Login",
  注册: "Register",
  设置: "Settings",
  个人中心: "Personal Center",
  消息: "Messages",
  通知: "Notifications",
  关税: "Tariff",
  美股: "US Stocks",
  中概: "Chinese Concept Stocks",
  阿里: "Alibaba",
  美元: "US Dollar",
  德债: "German Debt",
  特朗普: "Trump",
  反弹: "Rebound",
  涨: "Rise",
  重挫: "Plunge",
  创: "Create",
  最差: "Worst",
  表现: "Performance",
  网开一面: "Make an Exception",
  飞升: "Soar",
  年来: "Years",
  超: "Over",
  近: "Nearly",
}

// 常见中文句式的英文翻译模式
// 注意：这些模式将按顺序应用，所以更具体的模式应该放在前面
const sentencePatterns: [RegExp, string][] = [
  [/(\d+)月(\d+)日/g, "$1/$2"], // 日期格式转换
  [/今天/g, "Today"],
  [/昨天/g, "Yesterday"],
  [/明天/g, "Tomorrow"],
  [/上周/g, "Last week"],
  [/本周/g, "This week"],
  [/下周/g, "Next week"],
  [/上个月/g, "Last month"],
  [/本月/g, "This month"],
  [/下个月/g, "Next month"],
  [/去年/g, "Last year"],
  [/今年/g, "This year"],
  [/明年/g, "Next year"],
]

/**
 * 模拟翻译函数
 * 当API不可用时使用此函数进行简单翻译
 */
export function mockTranslate(text: string | string[], fromLang: string, toLang: string): string | string[] {
  // 如果已经是目标语言，直接返回
  if (fromLang === toLang) {
    return text
  }

  // 处理数组输入
  if (Array.isArray(text)) {
    return text.map(item => mockTranslate(item, fromLang, toLang) as string)
  }

  // 如果是空字符串，直接返回
  if (!text || text.trim() === "") {
    return text
  }

  let result = text

  // 从中文翻译到英文
  if (fromLang === "zh" && toLang === "en") {
    // 替换常见词汇
    for (const [zh, en] of Object.entries(commonTranslations)) {
      result = result.replace(new RegExp(zh, "g"), en)
    }

    // 应用句式模式
    for (const [pattern, replacement] of sentencePatterns) {
      result = result.replace(pattern, replacement)
    }

    // 如果标题没有任何变化，添加 [EN] 前缀
    if (result === text) {
      result = `[EN] ${text}`
    }
  }

  return result
}

/**
 * 使用 Cloudflare 翻译 API 进行翻译
 * @param text 要翻译的文本或文本数组
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 翻译后的文本或文本数组
 */
async function translateWithCloudflare(text: string | string[], fromLang: string, toLang: string): Promise<string | string[]> {
  const isArray = Array.isArray(text)
  const textArray = isArray ? text : [text]

  // 如果文本数组为空，直接返回
  if (textArray.length === 0) {
    return isArray ? [] : ""
  }

  try {
    const { ACCOUNT_ID, API_KEY, MODEL } = CLOUDFLARE_API

    // 输出 API 配置信息（不显示完整的 API_KEY）
    console.log(`Cloudflare 翻译 API 配置:`)
    console.log(`- ACCOUNT_ID: ${ACCOUNT_ID || "未设置"}`)
    console.log(`- API_KEY: ${API_KEY ? "已设置" : "未设置"}`)
    console.log(`- MODEL: ${MODEL}`)

    // 检查 API 配置是否完整
    if (!ACCOUNT_ID || !API_KEY) {
      console.error("Cloudflare 翻译 API 配置不完整，使用模拟翻译")
      return mockTranslate(text, fromLang, toLang)
    }

    // 处理每个文本项
    const translatedResults: string[] = []

    // 对每个文本项单独进行翻译
    for (let i = 0; i < textArray.length; i++) {
      const currentText = textArray[i]

      // 构建请求体 - 确保 text 是字符串
      const requestBody = {
        text: currentText,
        source_lang: fromLang,
        target_lang: toLang,
      }

      console.log(`[${i + 1}/${textArray.length}] 使用Cloudflare API翻译，模型: ${MODEL}，源语言: ${fromLang}，目标语言: ${toLang}`)
      console.log(`原文: "${currentText.substring(0, 100)}${currentText.length > 100 ? "..." : ""}"`)
      console.log(`请求体: ${JSON.stringify(requestBody)}`)

      try {
        // 构建 API URL
        const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`
        console.log(`API URL: ${apiUrl}`)

        let response
        try {
          // 修改 myFetch 调用方式，确保 URL 正确传递
          response = await myFetch(apiUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            timeout: 30000, // 30秒超时
          })
        } catch (error) {
          console.error("翻译请求失败:", error)
          translatedResults.push(mockTranslateText(currentText, fromLang, toLang))
          continue
        }

        // 检查响应是否成功
        if (!response || !response.success) {
          console.error("翻译请求失败:", JSON.stringify(response))
          translatedResults.push(mockTranslateText(currentText, fromLang, toLang))
          continue
        }

        // 检查响应是否包含翻译结果
        if (!response.result || !response.result.translated_text) {
          console.error("翻译响应格式不正确，使用模拟翻译")
          translatedResults.push(mockTranslateText(currentText, fromLang, toLang))
          continue
        }

        // 获取翻译结果
        let translatedText = response.result.translated_text || ""

        // 输出详细的翻译结果日志
        console.log(`翻译结果: "${translatedText.substring(0, 100)}${translatedText.length > 100 ? "..." : ""}"`)

        // 验证翻译结果是否与原文相关
        // 如果翻译结果与原文完全无关，可能是 API 返回了错误的结果
        const isUnrelatedTranslation = checkUnrelatedTranslation(currentText, translatedText, fromLang, toLang)

        if (isUnrelatedTranslation) {
          console.log(`检测到无关翻译结果，使用后备翻译`)
          translatedText = mockTranslateText(currentText, fromLang, toLang)
        } else {
          // 检查翻译质量
          const isLowQualityTranslation = checkLowQualityTranslation(currentText, translatedText)

          // 如果翻译结果与原文相同或质量低，添加 [EN] 前缀
          if ((translatedText === currentText && !translatedText.startsWith("[EN]")) || isLowQualityTranslation) {
            if (isLowQualityTranslation) {
              console.log(`检测到低质量翻译: "${currentText}" -> "${translatedText}"，使用后备翻译`)
              translatedText = mockTranslateText(currentText, fromLang, toLang)
            } else {
              console.log(`翻译结果与原文相同，添加 [EN] 前缀: ${currentText.substring(0, 30)}...`)
              // 添加 [EN] 前缀表示这是英文
              translatedText = `[EN] ${translatedText}`
            }
          }
        }

        translatedResults.push(translatedText)
      } catch (error) {
        console.error("翻译出错:", error)
        // 如果出现异常，使用模拟翻译作为后备
        translatedResults.push(mockTranslateText(currentText, fromLang, toLang))
      }
    }

    return isArray ? translatedResults : translatedResults[0]
  } catch (error) {
    console.error("翻译出错:", error)
    logger.error(`翻译出错: ${error}`)

    // 出错时返回原文
    return text
  }
}

/**
 * 模拟翻译单个文本
 */
function mockTranslateText(text: string, fromLang: string, toLang: string): string {
  // 如果是从中文到英文的翻译
  if (fromLang === "zh" && toLang === "en") {
    return `[EN] ${text}`
  } else if (fromLang === "en" && toLang === "zh") {
    return `[ZH] ${text}`
  } else {
    return `[${toLang.toUpperCase()}] ${text}`
  }
}

/**
 * 检查翻译质量
 * @param originalText 原文
 * @param translatedText 翻译文
 * @returns 是否为低质量翻译
 */
function checkLowQualityTranslation(originalText: string, translatedText: string): boolean {
  // 如果翻译结果为空，则认为是低质量翻译
  if (!translatedText || translatedText.trim() === "") {
    return true
  }

  // 如果翻译结果太短（相对于原文），可能是低质量翻译
  // 例如："女朋友是玩咖还要继续谈吗" -> "Southern gold"
  if (originalText.length > 10 && translatedText.length < originalText.length / 3) {
    return true
  }

  // 检查翻译结果是否包含一些常见的错误模式
  const lowQualityPatterns = [
    /^[A-Z][a-z]+ [a-z]+$/, // 简单的两个单词，如 "Southern gold"
    /^[A-Z][a-z]+$/, // 单个单词
    /^The [a-z]+$/, // "The" 开头的单个单词
  ]

  // 如果匹配任何一个低质量模式，则认为是低质量翻译
  for (const pattern of lowQualityPatterns) {
    if (pattern.test(translatedText)) {
      return true
    }
  }

  return false
}

/**
 * 检查翻译结果是否与原文无关
 * 用于检测 API 返回了错误的翻译结果
 * @param originalText 原文
 * @param translatedText 翻译文
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 是否为无关翻译
 */
function checkUnrelatedTranslation(originalText: string, translatedText: string, fromLang: string, toLang: string): boolean {
  // 如果原文或翻译为空，无法判断
  if (!originalText || !translatedText) {
    return false
  }

  // 如果原文中包含特定关键词，但翻译结果中不包含相应的英文关键词，可能是无关翻译
  // 例如：原文中包含"小米"，但翻译中没有"Xiaomi"
  const keywordPairs = [
    { zh: "小米", en: "Xiaomi" },
    { zh: "华为", en: "Huawei" },
    { zh: "苹果", en: "Apple" },
    { zh: "三星", en: "Samsung" },
    { zh: "詹姆斯", en: "James" },
    { zh: "哪吒", en: "Nezha" },
    { zh: "复联", en: "Avengers" },
  ]

  for (const pair of keywordPairs) {
    if (fromLang === "zh" && toLang === "en") {
      if (originalText.includes(pair.zh) && !translatedText.toLowerCase().includes(pair.en.toLowerCase())) {
        return true
      }
    } else if (fromLang === "en" && toLang === "zh") {
      if (originalText.toLowerCase().includes(pair.en.toLowerCase()) && !translatedText.includes(pair.zh)) {
        return true
      }
    }
  }

  // 如果翻译结果包含与原文完全无关的特定关键词，可能是无关翻译
  // 例如：原文没有提到"小米"，但翻译结果中出现了"Xiaomi"
  for (const pair of keywordPairs) {
    if (fromLang === "zh" && toLang === "en") {
      if (!originalText.includes(pair.zh) && translatedText.toLowerCase().includes(pair.en.toLowerCase())) {
        return true
      }
    } else if (fromLang === "en" && toLang === "zh") {
      if (!originalText.toLowerCase().includes(pair.en.toLowerCase()) && translatedText.includes(pair.zh)) {
        return true
      }
    }
  }

  return false
}

/**
 * 翻译函数
 * @param text 要翻译的文本，可以是字符串或字符串数组
 * @param fromLang 源语言，默认为'zh'
 * @param toLang 目标语言，默认为'en'
 * @returns 翻译后的文本，如果输入是数组则返回数组
 */
export async function translate(text: string | string[], fromLang: string = "zh", toLang: string = "en"): Promise<string | string[]> {
  try {
    // 如果是空字符串或语言相同，直接返回
    if (!text || fromLang === toLang) return text

    // 如果使用Cloudflare翻译API
    if (USE_CLOUDFLARE_TRANSLATE) {
      return await translateWithCloudflare(text, fromLang, toLang)
    }

    // 否则使用模拟翻译
    if (BACKUP_TRANSLATE.USE_MOCK) {
      return mockTranslate(text, fromLang, toLang)
    }

    // 如果没有可用的翻译方法，返回原文
    console.warn("没有可用的翻译方法，返回原文")
    return text
  } catch (error) {
    console.error("翻译出错:", error)
    logger.error(`翻译出错: ${error}`)

    // 出错时返回原文
    return text
  }
}

/**
 * 翻译单个文本
 * @param text 要翻译的文本
 * @param fromLang 源语言，默认为'zh'
 * @param toLang 目标语言，默认为'en'
 * @returns 翻译后的文本
 */
export async function translateText(
  text: string,
  fromLang: string = "zh",
  toLang: string = "en",
): Promise<string> {
  const results = await translate([text], fromLang, toLang)
  return results[0] || text
}
