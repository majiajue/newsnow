# 修复建议

## 1. 修复 Cloudflare 翻译 API (server/utils/translate.ts)

```typescript
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
      console.error("Cloudflare 翻译 API 配置不完整，使用模拟翻译")
      return mockTranslate(text, fromLang, toLang)
    }

    // 处理每个文本项
    const translatedResults: string[] = []

    // 对每个文本项单独进行翻译
    for (let i = 0; i < textArray.length; i++) {
      const currentText = textArray[i]

      // 跳过空文本
      if (!currentText || currentText.trim() === "") {
        translatedResults.push("")
        continue
      }

      // 构建请求体 - 确保 text 是字符串而不是数组
      const requestBody = {
        text: currentText,
        source_lang: fromLang,
        target_lang: toLang,
      }

      console.log(`原文: "${currentText}"`)
      logger.debug(`翻译请求体: ${JSON.stringify(requestBody)}`)

      // 构建 API URL
      const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`

      let translatedText = ""
      let retryCount = 0
      const maxRetries = 2

      while (retryCount <= maxRetries) {
        try {
          // 创建 AbortController 用于超时控制
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)

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

          const data = await response.json()

          // 检查响应是否成功
          if (data && data.success && data.result && data.result.translated_text) {
            translatedText = data.result.translated_text

            // 检查翻译质量
            if (checkLowQualityTranslation(currentText, translatedText)
              || checkUnrelatedTranslation(currentText, translatedText, fromLang, toLang)) {
              logger.warn(`检测到低质量翻译: "${currentText}" -> "${translatedText}"，使用模拟翻译`)
              translatedText = mockTranslateText(currentText, fromLang, toLang)
            }
            break // 成功获取翻译，跳出重试循环
          } else {
            logger.error(`翻译响应无效: ${JSON.stringify(data)}`)
            throw new Error("翻译响应无效")
          }
        } catch (error) {
          retryCount++
          logger.error(`翻译请求失败 (尝试 ${retryCount}/${maxRetries + 1}): ${error}`)

          if (retryCount <= maxRetries) {
            logger.info(`等待500毫秒后重试...`)
            await new Promise(resolve => setTimeout(resolve, 500))
          } else {
            // 所有重试都失败，使用模拟翻译
            logger.warn(`所有重试都失败，使用模拟翻译: "${currentText}"`)
            translatedText = mockTranslateText(currentText, fromLang, toLang)
          }
        }
      }

      translatedResults.push(translatedText)
    }

    return isArray ? translatedResults : translatedResults[0] || ""
  } catch (error) {
    logger.error(`翻译过程中出错: ${error}`)
    return mockTranslate(text, fromLang, toLang)
  }
}
```

### 2. 添加 `mockTranslateText` 函数用于单个文本的模拟翻译

```typescript
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
    const sentencePatterns: [RegExp, string][] = [
      // 问句模式
      [/^(.+?)是什么意思$/, "What does $1 mean"],
      [/^(.+?)是什么$/, "What is $1"],
      [/^什么是(.+)$/, "What is $1"],
      [/^如何(.+)$/, "How to $1"],
      [/^怎么(.+)$/, "How to $1"],
      [/^为什么(.+)$/, "Why $1"],
      [/^(.+?)为什么(.+)$/, "$1 why $2"],

      // 热搜标题模式
      [/^#(.+?)#$/, "#$1#"],
      [/^【([^】]+)】(.+)$/, "[$1] $2"],
      [/^([^：]+)：([^：]+)$/, "$1: $2"],

      // 数字模式
      [/(\d+)月(\d+)日/, "Month $1 Day $2"],
      [/(\d+)年(\d+)月/, "Year $1 Month $2"],

      // 热门短语
      [/^(.+?)上热搜$/, "$1 trending"],
      [/^(.+?)引发热议$/, "$1 sparks discussion"],
      [/^(.+?)引起关注$/, "$1 attracts attention"],
      [/^(.+?)遭到质疑$/, "$1 faces criticism"],
      [/^(.+?)回应(.+)$/, "$1 responds to $2"],
    ]
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
```

### 3. 优化 `mockTranslate` 函数

```typescript
function mockTranslate(text: string | string[], fromLang: string, toLang: string): string | string[] {
  // 如果是数组，对每个元素进行翻译
  if (Array.isArray(text)) {
    return text.map(item => mockTranslateText(item, fromLang, toLang))
  }

  // 否则翻译单个文本
  return mockTranslateText(text, fromLang, toLang)
}
```

### 4. 添加中文句式模式匹配

在 `translate.ts` 文件顶部添加以下代码：

```typescript
// 中文句式模式匹配
const sentencePatterns: [RegExp, string][] = [
  // 问句模式
  [/^(.+?)是什么意思$/, "What does $1 mean"],
  [/^(.+?)是什么$/, "What is $1"],
  [/^什么是(.+)$/, "What is $1"],
  [/^如何(.+)$/, "How to $1"],
  [/^怎么(.+)$/, "How to $1"],
  [/^为什么(.+)$/, "Why $1"],
  [/^(.+?)为什么(.+)$/, "$1 why $2"],

  // 热搜标题模式
  [/^#(.+?)#$/, "#$1#"],
  [/^【([^】]+)】(.+)$/, "[$1] $2"],
  [/^([^：]+)：([^：]+)$/, "$1: $2"],

  // 数字模式
  [/(\d+)月(\d+)日/, "Month $1 Day $2"],
  [/(\d+)年(\d+)月/, "Year $1 Month $2"],

  // 热门短语
  [/^(.+?)上热搜$/, "$1 trending"],
  [/^(.+?)引发热议$/, "$1 sparks discussion"],
  [/^(.+?)引起关注$/, "$1 attracts attention"],
  [/^(.+?)遭到质疑$/, "$1 faces criticism"],
  [/^(.+?)回应(.+)$/, "$1 responds to $2"],
]
```

### 5. 优化前端翻译处理

修改 `src/components/TranslationProvider.tsx` 中的 `setLanguage` 函数：

```typescript
const setLanguage = useCallback((language: Language) => {
  console.log("设置语言 (setLanguage):", language)

  // 如果语言没有变化，不做任何操作
  if (language === currentLanguage) {
    console.log("语言未变化，不做任何操作")
    return
  }

  // 设置新语言
  storeSetLanguage(language)

  // 保存到 localStorage
  try {
    localStorage.setItem("language-setting", JSON.stringify(language))
  } catch (e) {
    console.error("保存语言设置失败:", e)
  }

  // 发布自定义事件，通知所有组件语言已更改
  if (typeof window !== "undefined") {
    console.log("发布语言变化事件:", language)
    const event = new CustomEvent("languageChanged", { detail: { language } })
    window.dispatchEvent(event)
  }

  // 清除 react-query 缓存，强制重新获取数据
  const queryClient = window.queryClient
  if (queryClient) {
    console.log("清除缓存...")
    // 使所有以 "source" 开头的查询失效
    queryClient.invalidateQueries({ queryKey: ["source"] })
    queryClient.invalidateQueries({ queryKey: ["entire"] })
  }

  // 延迟刷新页面以确保所有组件都使用新语言
  // 增加延迟时间，确保所有缓存清理和状态更新完成
  setTimeout(() => {
    console.log("刷新页面以应用新语言")
    window.location.reload()
  }, 800)
}, [currentLanguage, storeSetLanguage])
```

### 6. 修改 `LanguageSwitcher.tsx` 中的语言切换逻辑

```typescript
function toggleLanguage() {
  const newLanguage: Language = currentLanguage === "zh" ? "en" : "zh"
  console.log("切换语言:", currentLanguage, "->", newLanguage)

  // 立即更新显示语言，提供即时反馈
  setDisplayLanguage(newLanguage)

  // 设置实际语言
  setLanguage(newLanguage)

  // 不需要在这里强制刷新页面，因为 TranslationProvider 中已经处理了
}
```

## 实施步骤

1. 首先修改 `server/utils/translate.ts` 文件，添加 `sentencePatterns` 常量和 `mockTranslateText` 函数
2. 更新 `translateWithCloudflare` 函数，改进错误处理和重试机制
3. 修改 `mockTranslate` 函数，使用新的 `mockTranslateText` 函数
4. 更新前端的 `TranslationProvider.tsx` 和 `LanguageSwitcher.tsx` 文件，优化语言切换逻辑

## 预期效果

1. 提高翻译 API 的稳定性，减少请求失败和超时的情况
2. 增强模拟翻译的质量，提供更多高质量的备用翻译
3. 优化语言切换过程，确保所有组件正确应用新语言
4. 改进翻译质量检测机制，及时发现并处理低质量翻译
