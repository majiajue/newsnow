import type { SourceID, SourceResponse } from "@shared/types"
import { sources } from "@shared/sources"
import { translate } from "../../utils/translate"
import { getters } from "#/getters"
import { getCacheTable } from "#/database/cache"
import type { CacheInfo } from "#/types"
import { logger } from "#/utils/logger"

export default defineEventHandler(async (event): Promise<SourceResponse> => {
  try {
    const query = getQuery(event)
    const latest = query.latest !== undefined && query.latest !== "false"
    let id = query.id as SourceID
    // 获取语言参数，默认为中文
    const lang = (query.lang as string) || "zh"
    // 是否强制重新翻译
    const forceTranslate = query.force === "true"

    const isValid = (id: SourceID) => !id || !sources[id] || !getters[id]

    if (isValid(id)) {
      const redirectID = sources?.[id]?.redirect
      if (redirectID) id = redirectID
      if (isValid(id)) throw new Error("Invalid source id")
    }

    // 使用语言参数构建缓存键
    const cacheKey = `${id}_${lang}`

    const cacheTable = await getCacheTable()
    // Date.now() in Cloudflare Worker will not update throughout the entire runtime.
    const now = Date.now()
    let cache: CacheInfo | undefined
    if (cacheTable) {
      console.log(`检查缓存，键: ${cacheKey}`)

      try {
        // 使用包含语言的缓存键获取缓存
        cache = await cacheTable.get(cacheKey)
        console.log(`缓存状态 (${cacheKey}):`, cache ? "存在" : "不存在")

        if (cache) {
          // interval 刷新间隔，对于缓存失效也要执行的。本质上表示本来内容更新就很慢，这个间隔内可能内容压根不会更新。
          // 默认 10 分钟，是低于 TTL 的，但部分 Source 的更新间隔会超过 TTL，甚至有的一天更新一次。
          if (now - cache.updated < sources[id].interval) {
            console.log(`使用缓存数据，语言: ${lang}，项目数: ${cache.items.length}`)
            return {
              status: "success",
              id,
              updatedTime: now,
              items: cache.items,
              lang, // 返回语言信息
            }
          }

          // 而 TTL 缓存失效时间，在时间范围内，就算内容更新了也要用这个缓存。
          // 复用缓存是不会更新时间的。
          if (now - cache.updated < TTL) {
            // 有 latest
            if (latest) {
              // 如果有缓存，先返回缓存，然后在后台更新
              event.node.res.writeHead(200, { "Content-Type": "application/json" })
              event.node.res.end(
                JSON.stringify({
                  status: "success",
                  id,
                  updatedTime: now,
                  items: cache.items,
                  lang, // 返回语言信息
                }),
              )
              // 后台更新
              try {
                getDataAndUpdateCache(id, cacheTable, cache, lang, forceTranslate).catch((e) => {
                  logger.error(`Background update failed: ${e}`)
                })
              } catch (e) {
                logger.error(`Background update failed: ${e}`)
              }
              // 已经返回了，不需要继续
              return undefined as any
            }
            // 没有 latest，直接返回缓存
            console.log(`使用缓存数据，语言: ${lang}，项目数: ${cache.items.length}`)
            return {
              status: "success",
              id,
              updatedTime: now,
              items: cache.items,
              lang, // 返回语言信息
            }
          }
        }
      } catch (error) {
        console.error(`获取缓存失败: ${error}`)
      }
    }

    // 添加超时处理
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error("获取数据超时")), 30000) // 增加到30秒
    })

    // 实际数据获取
    const dataPromise = getDataAndUpdateCache(id, cacheTable, cache, lang, forceTranslate)

    try {
      // 使用 Promise.race 处理超时
      const result = await Promise.race([dataPromise, timeoutPromise])
      return result
    } catch (error) {
      logger.error(`获取数据失败或超时: ${error}`)
      console.error(`获取 ${id} 数据失败或超时:`, error)

      // 如果有缓存，返回缓存数据
      if (cache) {
        logger.info(`使用缓存的 ${id} 数据`)
        return {
          status: "success",
          id,
          updatedTime: cache.updated,
          items: cache.items,
          lang,
        }
      }

      // 如果没有缓存，返回错误状态
      return {
        status: "error" as "success",
        id: id as SourceID,
        updatedTime: now,
        items: [],
        lang: "zh",
      }
    }
  } catch (error) {
    logger.error(`API处理出错: ${error}`)
    return {
      status: "error" as "success",
      id: (getQuery(event).id as string) as SourceID,
      updatedTime: Date.now(),
      items: [],
      lang: (getQuery(event).lang as string) || "zh",
    }
  }
})

// 获取数据并更新缓存的函数
async function getDataAndUpdateCache(id: SourceID, cacheTable: any, cache: CacheInfo | undefined, lang: string, forceTranslate: boolean) {
  try {
    // 构建缓存键
    const cacheKey = `${id}_${lang}`

    // 如果请求的是英文，始终强制重新翻译
    if (lang === "en") {
      console.log(`请求英文内容，强制重新翻译`)
      // 设置强制翻译标志
      forceTranslate = true
    }

    // 如果请求的是英文，先检查是否有缓存
    if (lang === "en" && cache && cache.items && cache.items.length > 0 && !forceTranslate) {
      // 检查缓存中的数据是否已经被翻译
      const isTranslated = cache.items.some((item) => {
        // 检查标题是否已翻译
        if (!item.title || !item.extra?.langId || item.extra.langId !== "en") {
          return false
        }

        // 检查是否有原始标题并且翻译后的标题与原始标题不同
        if (item.extra.originalTitle && item.title !== item.extra.originalTitle) {
          return true
        }

        // 检查标题是否以 [EN] 开头
        if (typeof item.title === "string" && item.title.startsWith("[EN]")) {
          return true
        }

        // 如果标题包含英文单词，可能已经被翻译
        const hasEnglishWords = /[a-z]{4,}/i.test(item.title)
        if (hasEnglishWords) {
          return true
        }

        return false
      })

      if (isTranslated) {
        console.log(`使用缓存中的英文数据，缓存键: ${cacheKey}`)
        return {
          status: "success",
          id,
          updatedTime: Date.now(),
          items: cache.items,
          lang,
        }
      } else {
        console.log(`缓存中的数据未被正确翻译，将重新翻译`)
      }
    } else if (forceTranslate) {
      console.log(`强制重新翻译，忽略缓存`)
    }

    // 获取原始数据（中文）
    const newData = (await getters[id]()).slice(0, 30)
    console.log(`获取到 ${id} 的原始数据，语言: ${lang}, 数量: ${newData.length}`)

    // 如果请求的是中文，直接使用原始数据
    if (lang === "zh") {
      // 更新缓存
      if (cacheTable) {
        await cacheTable.set(cacheKey, newData)
        console.log(`中文数据缓存更新成功，键: ${cacheKey}`)
      }

      return {
        status: "success",
        id,
        updatedTime: Date.now(),
        items: newData,
        lang,
      }
    }

    // 如果请求的是英文，进行翻译
    let processedData = newData
    try {
      console.log(`开始翻译 ${id} 的数据到英文，数据项数量: ${newData.length}`)

      // 创建翻译后的数据副本
      processedData = JSON.parse(JSON.stringify(newData))

      // 提取所有需要翻译的标题和描述
      const titles: string[] = []
      const descriptions: string[] = []
      const uniqueDescriptions: string[] = []

      processedData.forEach((item) => {
        if (item.title) {
          titles.push(item.title)
        }
        if (item.extra?.description) {
          descriptions.push(item.extra.description)
        }
        if (item.extra?.uniqueDescription) {
          uniqueDescriptions.push(item.extra.uniqueDescription)
        }
      })

      console.log(`准备翻译 ${titles.length} 个标题, ${descriptions.length} 个描述, ${uniqueDescriptions.length} 个唯一描述`)

      try {
        // 翻译标题和描述
        const translatedTitles = await translate(titles, "zh", "en") as string[]
        const translatedDescriptions = await translate(descriptions, "zh", "en") as string[]
        const translatedUniqueDescriptions = await translate(uniqueDescriptions, "zh", "en") as string[]

        console.log(`翻译完成，获得 ${translatedTitles.length} 个翻译后的标题, ${translatedDescriptions.length} 个描述, ${translatedUniqueDescriptions.length} 个唯一描述`)

        // 检查翻译结果数量是否与原始数量一致
        if (translatedTitles.length !== titles.length
          || translatedDescriptions.length !== descriptions.length
          || translatedUniqueDescriptions.length !== uniqueDescriptions.length) {
          console.error(`翻译结果数量不匹配: 标题 ${titles.length}/${translatedTitles.length}, 描述 ${descriptions.length}/${translatedDescriptions.length}, 唯一描述 ${uniqueDescriptions.length}/${translatedUniqueDescriptions.length}`)
        }

        // 创建新的翻译后的项目数组
        let titleIndex = 0
        let descIndex = 0
        let uniqueDescIndex = 0

        processedData = processedData.map((item) => {
          // 创建新对象，避免修改原始对象
          const translatedItem = { ...item }

          // 设置语言标识
          if (!translatedItem.extra) {
            translatedItem.extra = {}
          }
          translatedItem.extra.langId = "en"

          // 翻译标题
          if (item.title) {
            // 保存原始标题
            translatedItem.extra.originalTitle = item.title

            // 使用翻译后的标题
            if (titleIndex < translatedTitles.length) {
              translatedItem.title = translatedTitles[titleIndex]

              // 如果翻译后的标题与原始标题相同且不是以 [EN] 开头，添加 [EN] 前缀
              if (translatedItem.title === item.title && !translatedItem.title.startsWith("[EN]")) {
                translatedItem.title = `[EN] ${translatedItem.title}`
              }

              titleIndex++
            }
          }

          // 翻译描述
          if (item.extra?.description) {
            const originalDesc = item.extra.description

            // 使用翻译后的描述
            if (descIndex < translatedDescriptions.length) {
              translatedItem.extra.description = translatedDescriptions[descIndex]

              // 如果翻译后的描述与原始描述相同且不是以 [EN] 开头，添加 [EN] 前缀
              if (translatedItem.extra.description === originalDesc && !translatedItem.extra.description.startsWith("[EN]")) {
                translatedItem.extra.description = `[EN] ${translatedItem.extra.description}`
              }

              descIndex++
            }
          }

          // 翻译唯一描述
          if (item.extra?.uniqueDescription) {
            const originalUniqueDesc = item.extra.uniqueDescription

            // 使用翻译后的唯一描述
            if (uniqueDescIndex < translatedUniqueDescriptions.length) {
              translatedItem.extra.uniqueDescription = translatedUniqueDescriptions[uniqueDescIndex]

              // 如果翻译后的唯一描述与原始唯一描述相同且不是以 [EN] 开头，添加 [EN] 前缀
              if (translatedItem.extra.uniqueDescription === originalUniqueDesc && !translatedItem.extra.uniqueDescription.startsWith("[EN]")) {
                translatedItem.extra.uniqueDescription = `[EN] ${translatedItem.extra.uniqueDescription}`
              }

              uniqueDescIndex++
            }
          }

          return translatedItem
        })
      } catch (error) {
        console.error("翻译失败:", error)

        // 如果翻译失败，至少添加语言标识和 [EN] 前缀
        processedData = processedData.map((item) => {
          const translatedItem = { ...item }

          if (!translatedItem.extra) {
            translatedItem.extra = {}
          }
          translatedItem.extra.langId = "en"

          // 处理标题
          if (item.title && !item.title.startsWith("[EN]")) {
            translatedItem.extra.originalTitle = item.title
            translatedItem.title = `[EN] ${item.title}`
          }

          // 处理描述
          if (item.extra?.description && !item.extra.description.startsWith("[EN]")) {
            translatedItem.extra.description = `[EN] ${item.extra.description}`
          }

          // 处理唯一描述
          if (item.extra?.uniqueDescription && !item.extra.uniqueDescription.startsWith("[EN]")) {
            translatedItem.extra.uniqueDescription = `[EN] ${item.extra.uniqueDescription}`
          }

          return translatedItem
        })
      }

      console.log(`翻译完成，数据项目数: ${processedData.length}`)

      // 更新缓存
      if (cacheTable) {
        await cacheTable.set(cacheKey, processedData)
        console.log(`已更新英文翻译缓存: ${cacheKey}`)
      }

      logger.success(`已使用 Cloudflare API 将 ${id} 翻译为英文`)
    } catch (error) {
      console.error(`翻译出错详情:`, error)
      logger.error(`Translation error: ${error}`)

      // 如果翻译失败，仍然使用原始数据，但标记语言
      processedData = newData.map(item => ({
        ...item,
        extra: {
          ...item.extra,
          langId: "en",
          originalTitle: item.title,
        },
      }))
    }

    return {
      status: "success",
      id,
      updatedTime: Date.now(),
      items: processedData,
      lang,
    }
  } catch (error) {
    logger.error(`获取数据失败: ${error}`)
    throw error
  }
}
