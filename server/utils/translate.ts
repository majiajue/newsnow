/**
 * 翻译工具函数
 * 使用第三方API进行翻译
 */

import { BACKUP_TRANSLATE, CLOUDFLARE_API, USE_CLOUDFLARE_TRANSLATE } from "../config/translate"
import { logger } from "./logger"

// 中文句式模式匹配
const sentencePatterns: [RegExp, string][] = [
  // 问句模式
  [/^(.+)是什么意思$/, "What does $1 mean"],
  [/^(.+)是什么$/, "What is $1"],
  [/^什么是(.+)$/, "What is $1"],
  [/^如何(.+)$/, "How to $1"],
  [/^怎么(.+)$/, "How to $1"],
  [/^为什么(.+)$/, "Why $1"],
  [/^(.+)为什么(.+)$/, "$1 why $2"],

  // 热搜标题模式
  [/^#([\u4E00-\u9FA5\w]+)#$/, "#$1#"],
  [/^【([\u4E00-\u9FA5\w]+)】(.+)$/, "[$1] $2"],
  [/^([\u4E00-\u9FA5\w]+)：([\u4E00-\u9FA5\w]+)$/, "$1: $2"],

  // 数字模式
  [/(\d+)月(\d+)日/, "Month $1 Day $2"],
  [/(\d+)年(\d+)月/, "Year $1 Month $2"],

  // 热门短语
  [/^(.+)上热搜$/, "$1 trending"],
  [/^(.+)引发热议$/, "$1 sparks discussion"],
  [/^(.+)引起关注$/, "$1 attracts attention"],
  [/^(.+)遭到质疑$/, "$1 faces criticism"],
  [/^(.+)回应(.+)$/, "$1 responds to $2"],
]

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
const sentencePatterns2: [RegExp, string][] = [
  [/(\d+)月(\d+)日/g, "$1/$2"], // 日期格式转换
  [/今天/g, "Today"],
  [/昨天/g, "Yesterday"],
  [/明天/g, "Tomorrow"],
  [/上周/g, "Last week"],
  [/本周/g, "This week"],
  [/下周/g, "Next week"],
  [/上个月/g, "Last month"],
  [/这个月/g, "This month"],
  [/下个月/g, "Next month"],
  [/去年/g, "Last year"],
  [/今年/g, "This year"],
  [/明年/g, "Next year"],
  [/最近/g, "Recently"],
  [/即将/g, "Soon"],
  [/已经/g, "Already"],
  [/正在/g, "Currently"],
  [/将要/g, "Will"],
  [/可能/g, "May"],
  [/应该/g, "Should"],
  [/必须/g, "Must"],
  [/不能/g, "Cannot"],
  [/可以/g, "Can"],
  [/需要/g, "Need"],
  [/想要/g, "Want"],
  [/喜欢/g, "Like"],
  [/讨厌/g, "Dislike"],
  [/爱/g, "Love"],
  [/恨/g, "Hate"],
  [/好/g, "Good"],
  [/坏/g, "Bad"],
  [/大/g, "Big"],
  [/小/g, "Small"],
  [/多/g, "Many"],
  [/少/g, "Few"],
  [/快/g, "Fast"],
  [/慢/g, "Slow"],
  [/高/g, "High"],
  [/低/g, "Low"],
  [/新/g, "New"],
  [/旧/g, "Old"],
]

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

  // 增强的常见中文词汇的英文翻译
  const enhancedTranslations: Record<string, string> = {
    ...commonTranslations,
    // 添加更多常见的中文词汇和短语
    视频: "Video",
    图片: "Image",
    文章: "Article",
    新闻: "News",
    博主: "Blogger",
    网友: "Netizen",
    直播: "Live Stream",
    评测: "Review",
    发布: "Release",
    曝光: "Exposed",
    爆料: "Leaked",
    官宣: "Official Announcement",
    回应: "Response",
    质疑: "Question",
    引发: "Trigger",
    热议: "Hot Discussion",
    争议: "Controversy",
    震惊: "Shocking",
    惊人: "Amazing",
    惊喜: "Surprise",
    惊艳: "Stunning",
    震撼: "Impressive",
    精彩: "Wonderful",
    精选: "Selected",
    精品: "Premium",
    高质量: "High Quality",
    低价: "Low Price",
    优惠: "Discount",
    限时: "Limited Time",
    独家: "Exclusive",
    首发: "First Release",
    首次: "First Time",
    首款: "First Model",
    最新: "Latest",
    最全: "Most Complete",
    最强: "Strongest",
    最佳: "Best",
    最美: "Most Beautiful",
    最快: "Fastest",
    最贵: "Most Expensive",
    最便宜: "Cheapest",
    汽车: "Car",
    手机: "Phone",
    电脑: "Computer",
    游戏: "Game",
    电影: "Movie",
    音乐: "Music",
    美食: "Food",
    旅游: "Travel",
    健康: "Health",
    教育: "Education",
    科技: "Technology",
    金融: "Finance",
    体育: "Sports",
    娱乐: "Entertainment",
    时尚: "Fashion",
    生活: "Life",
    房产: "Real Estate",
    家居: "Home",
    育儿: "Parenting",
    宠物: "Pet",
    星座: "Astrology",
    命运: "Destiny",
    运势: "Fortune",
    风水: "Feng Shui",
    算命: "Fortune Telling",
    占卜: "Divination",
    预测: "Prediction",
    预言: "Prophecy",
    预报: "Forecast",
    天气: "Weather",
  }

  let result = text

  // 从中文翻译到英文
  if (fromLang === "zh" && toLang === "en") {
    // 替换常见词汇
    for (const [zh, en] of Object.entries(enhancedTranslations)) {
      result = result.replace(new RegExp(zh, "g"), en)
    }

    // 应用句式模式
    for (const [pattern, replacement] of sentencePatterns) {
      result = result.replace(pattern, replacement)
    }

    // 应用额外的句式模式
    for (const [pattern, replacement] of sentencePatterns2) {
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
 * 模拟翻译函数
 * 当API不可用时使用此函数进行简单翻译
 * @param text 要翻译的文本，可以是字符串或字符串数组
 * @param fromLang 源语言
 * @param toLang 目标语言
 * @returns 翻译后的文本，如果输入是数组则返回数组
 */
function mockTranslate(text: string | string[], fromLang: string, toLang: string): string | string[] {
  // 如果是数组，对每个元素进行翻译
  if (Array.isArray(text)) {
    return text.map(item => mockTranslateText(item, fromLang, toLang))
  }

  // 否则翻译单个文本
  return mockTranslateText(text, fromLang, toLang)
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

    // 检查 API 配置是否完整
    if (!ACCOUNT_ID || !API_KEY) {
      logger.error("Cloudflare 翻译 API 配置不完整，使用模拟翻译")
      return mockTranslate(text, fromLang, toLang)
    }

    // 创建一个简单的缓存键
    const createCacheKey = (text: string, fromLang: string, toLang: string) => {
      return `translate:${fromLang}:${toLang}:${text.substring(0, 100)}`
    }

    // 检查缓存中是否已有翻译结果
    const checkCache = async (text: string, fromLang: string, toLang: string) => {
      try {
        const cacheKey = createCacheKey(text, fromLang, toLang)
        const cachedResult = await cacheGet(cacheKey)
        if (cachedResult) {
          logger.info(`使用缓存的翻译结果: "${text.substring(0, 30)}..."`)
          return cachedResult
        }
      } catch (error) {
        logger.warn(`检查翻译缓存失败: ${error}`)
      }
      return null
    }

    // 将翻译结果存入缓存
    const saveToCache = async (text: string, translatedText: string, fromLang: string, toLang: string) => {
      try {
        const cacheKey = createCacheKey(text, fromLang, toLang)
        await cacheSet(cacheKey, translatedText, 60 * 60 * 24 * 7) // 缓存7天
      } catch (error) {
        logger.warn(`保存翻译缓存失败: ${error}`)
      }
    }

    // 批量处理，每批最多10个文本
    const batchSize = 10
    const translatedResults: string[] = []

    // 按批次处理文本
    for (let batchIndex = 0; batchIndex < Math.ceil(textArray.length / batchSize); batchIndex++) {
      const batchStart = batchIndex * batchSize
      const batchEnd = Math.min((batchIndex + 1) * batchSize, textArray.length)
      const batchTexts = textArray.slice(batchStart, batchEnd)

      // 并行处理每批文本
      const batchPromises = batchTexts.map(async (currentText, index) => {
        // 跳过空文本
        if (!currentText || currentText.trim() === "") {
          return { index, result: "" }
        }

        // 检查缓存
        const cachedResult = await checkCache(currentText, fromLang, toLang)
        if (cachedResult) {
          return { index, result: cachedResult }
        }

        // 构建请求体
        const requestBody = {
          text: currentText,
          source_lang: fromLang,
          target_lang: toLang,
        }

        logger.info(`翻译原文 (${batchStart + index + 1}/${textArray.length}): "${currentText.substring(0, 30)}..."`)

        // 构建 API URL
        const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`

        let translatedText = ""
        let retryCount = 0
        const maxRetries = 3

        // 重试逻辑
        while (retryCount <= maxRetries) {
          try {
            // 创建 AbortController 用于超时控制
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 增加超时时间到15秒

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
              errors?: any[]
            }

            // 检查响应是否成功
            if (data && data.success === true && data.result && data.result.translated_text) {
              translatedText = data.result.translated_text

              // 检查翻译质量
              if (checkLowQualityTranslation(currentText, translatedText)
                || checkUnrelatedTranslation(currentText, translatedText, fromLang, toLang)) {
                logger.warn(`检测到低质量翻译: "${currentText.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."，使用模拟翻译`)
                translatedText = mockTranslateText(currentText, fromLang, toLang)
              } else {
                // 保存到缓存
                await saveToCache(currentText, translatedText, fromLang, toLang)
              }
              break // 成功获取翻译，跳出重试循环
            } else {
              const errorMsg = data.errors ? JSON.stringify(data.errors) : "未知错误"
              logger.error(`翻译响应无效: ${errorMsg}`)
              throw new Error(`翻译响应无效: ${errorMsg}`)
            }
          } catch (error: any) {
            retryCount++

            // 如果是超时错误，增加等待时间
            const isTimeout = error.name === "AbortError" || error.message?.includes("timeout")
            const waitTime = isTimeout ? 1000 * retryCount : 500 * retryCount

            logger.error(`翻译请求失败 (尝试 ${retryCount}/${maxRetries + 1}): ${error}`)

            if (retryCount <= maxRetries) {
              logger.info(`等待${waitTime}毫秒后重试...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
            } else {
              // 所有重试都失败，使用模拟翻译
              logger.warn(`所有重试都失败，使用模拟翻译: "${currentText.substring(0, 30)}..."`)
              translatedText = mockTranslateText(currentText, fromLang, toLang)
            }
          }
        }

        return { index, result: translatedText }
      })

      // 等待批次完成并按原始顺序整理结果
      const batchResults = await Promise.all(batchPromises)
      const orderedResults = Array.from({ length: batchTexts.length })

      batchResults.forEach(({ index, result }) => {
        orderedResults[index] = result
      })

      translatedResults.push(...orderedResults)

      // 批次之间添加短暂延迟，避免API限流
      if (batchIndex < Math.ceil(textArray.length / batchSize) - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return isArray ? translatedResults : translatedResults[0] || ""
  } catch (error) {
    logger.error(`翻译过程中出错: ${error}`)
    return mockTranslate(text, fromLang, toLang)
  }
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
    logger.warn(`检测到空翻译结果: "${originalText}" -> "${translatedText}"`)
    return true
  }

  // 检查翻译结果是否过短
  const originalLength = originalText.length
  const translatedLength = translatedText.length

  // 如果原文较长，但翻译结果过短，可能是低质量翻译
  if (originalLength > 10 && translatedLength < originalLength * 0.3) {
    logger.warn(`检测到翻译结果过短: "${originalText}" (${originalLength}) -> "${translatedText}" (${translatedLength})`)
    return true
  }

  // 检查翻译结果是否匹配低质量模式
  const lowQualityPatterns = [
    /^[a-z]{1,2}$/i, // 只有1-2个字母
    /^\d+$/, // 只有数字
    /^[.,!?;:]+$/, // 只有标点符号
    /^(the|a|an|this|that|these|those)$/i, // 只有冠词或指示代词
    /^(is|am|are|was|were|be|been|being)$/i, // 只有be动词
    /^(and|or|but|if|so|for|nor|yet)$/i, // 只有连词
    /^(in|on|at|by|with|from|to|for|of|about)$/i, // 只有常见介词
    /^(i|you|he|she|it|we|they|me|him|her|us|them)$/i, // 只有人称代词
    /^(my|your|his|her|its|our|their|mine|yours|hers|ours|theirs)$/i, // 只有物主代词
    /^(this|that|these|those|here|there)$/i, // 只有指示代词或副词
    /^(who|what|which|where|when|why|how)$/i, // 只有疑问词
    /^(can|could|will|would|shall|should|may|might|must)$/i, // 只有情态动词
    /^(do|does|did|done|doing)$/i, // 只有do动词
    /^(have|has|had|having)$/i, // 只有have动词
    /^(not|no|none|neither|never|nowhere)$/i, // 只有否定词
    /^(all|some|any|many|much|few|little|more|most|several)$/i, // 只有数量词
    /^(very|quite|rather|too|enough|extremely|really)$/i, // 只有程度副词
    /^(always|often|sometimes|rarely|never|usually|frequently)$/i, // 只有频率副词
    /^(now|then|today|tomorrow|yesterday|soon|later)$/i, // 只有时间副词
    /^(here|there|everywhere|nowhere|somewhere|anywhere)$/i, // 只有地点副词
    /^(well|badly|fast|hard|late|early|highly)$/i, // 只有方式副词
    /^(yes|no|maybe|perhaps|certainly|definitely|absolutely)$/i, // 只有肯定/否定/可能性副词
    /^[a-z]+ [a-z]+$/i, // 只有两个单词
  ]

  for (const pattern of lowQualityPatterns) {
    if (pattern.test(translatedText)) {
      logger.warn(`检测到低质量翻译模式: "${originalText}" -> "${translatedText}"`)
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
    const containsChineseChar = /[\u4E00-\u9FA5]/.test(translatedText)
    if (containsChineseChar) {
      logger.warn(`英文翻译结果中包含中文字符: "${originalText}" -> "${translatedText}"`)
      return true
    }

    // 检查是否只是简单地复制了原文
    if (translatedText === originalText) {
      logger.warn(`翻译结果与原文完全相同: "${originalText}" -> "${translatedText}"`)
      return true
    }

    // 检查是否只是在原文前面加了 [EN] 前缀
    if (translatedText === `[EN] ${originalText}`) {
      logger.warn(`翻译结果只是添加了前缀: "${originalText}" -> "${translatedText}"`)
      return true
    }

    // 检查是否只是简单地将原文中的中文替换为英文，但保留了原文的结构
    // 例如："今日热榜" -> "Today Hot List"，但没有正确翻译为 "Today's Hot List"
    const commonWords = Object.keys(commonTranslations)
    let matchCount = 0
    for (const word of commonWords) {
      if (originalText.includes(word) && translatedText.includes(commonTranslations[word])) {
        matchCount++
      }
    }

    // 如果匹配了超过3个常见词，但翻译结果长度与原文相差不大，可能是简单替换
    if (matchCount > 3 && Math.abs(translatedText.length - originalText.length) < 10) {
      logger.warn(`翻译结果可能是简单替换: "${originalText}" -> "${translatedText}"`)
      return true
    }
  }

  // 从英文翻译到中文的特殊检查
  if (fromLang === "en" && toLang === "zh") {
    // 检查是否不包含任何中文字符
    const containsChineseChar = /[\u4E00-\u9FA5]/.test(translatedText)
    if (!containsChineseChar) {
      logger.warn(`中文翻译结果不包含中文字符: "${originalText}" -> "${translatedText}"`)
      return true
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
    logger.warn("没有可用的翻译方法，返回原文")
    return text
  } catch (error) {
    logger.error("翻译出错:", error)
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

// 简单的内存缓存系统
interface CacheItem {
  value: any
  expiry: number
}

const memoryCache: Record<string, CacheItem> = {}

/**
 * 从缓存中获取值
 * @param key 缓存键
 * @returns 缓存值，如果不存在或已过期则返回null
 */
async function cacheGet(key: string): Promise<any> {
  const item = memoryCache[key]
  if (!item) return null

  const now = Date.now()
  if (item.expiry < now) {
    delete memoryCache[key]
    return null
  }

  return item.value
}

/**
 * 将值存入缓存
 * @param key 缓存键
 * @param value 缓存值
 * @param ttlSeconds 过期时间（秒）
 */
async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  const now = Date.now()
  const expiry = now + ttlSeconds * 1000

  memoryCache[key] = {
    value,
    expiry,
  }

  // 定期清理过期缓存
  setTimeout(() => {
    if (memoryCache[key] && memoryCache[key].expiry <= Date.now()) {
      delete memoryCache[key]
    }
  }, ttlSeconds * 1000)
}

/**
 * 清理过期缓存
 */
function cleanupCache(): void {
  const now = Date.now()
  Object.keys(memoryCache).forEach((key) => {
    if (memoryCache[key].expiry <= now) {
      delete memoryCache[key]
    }
  })
}

// 每小时清理一次过期缓存
setInterval(cleanupCache, 60 * 60 * 1000)
