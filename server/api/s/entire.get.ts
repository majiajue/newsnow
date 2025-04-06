import { defineEventHandler, getQuery } from "h3"
import type { SourceID, SourceResponse } from "@shared/types"
import { translate } from "../../utils/translate"
import { getCacheTable } from "#/database/cache"
import { logger } from "#/utils/logger"
import { getters } from "#/getters"

const TTL = 60 * 60 * 1000 // 1小时

interface CacheInfo {
  updated: number
  items: any[]
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const sourcesParam = query.sources as string
    const lang = (query.lang as string) || "zh"

    // 解析 sources 参数
    let sourceIds: SourceID[] = []
    try {
      sourceIds = JSON.parse(decodeURIComponent(sourcesParam))
    } catch (e) {
      logger.error(`解析 sources 参数失败: ${e}`)
      return []
    }

    if (!sourceIds?.length) {
      return []
    }

    const cacheTable = await getCacheTable()
    const now = Date.now()

    // 存储所有源的响应
    const responses: SourceResponse[] = []

    // 存储需要获取的源ID
    const sourcesToFetch: SourceID[] = []

    // 先检查缓存
    for (const id of sourceIds) {
      // 使用语言参数构建缓存键
      const cacheKey = `${id}_${lang}`

      let _cache: CacheInfo | undefined

      if (cacheTable) {
        _cache = await cacheTable.get(cacheKey)

        // 如果有缓存且未过期，直接使用缓存
        if (_cache && now - _cache.updated < TTL) {
          responses.push({
            status: "success" as const,
            id,
            updatedTime: _cache.updated,
            items: _cache.items,
            lang,
          })
          continue
        }
      }

      // 如果没有缓存或缓存已过期，添加到需要获取的源列表
      sourcesToFetch.push(id)
    }

    // 如果所有源都有缓存，直接返回
    if (sourcesToFetch.length === 0) {
      return responses
    }

    // 使用Promise.all和超时处理并行获取所有源的数据
    const fetchPromises = sourcesToFetch.map((id) => {
      // 为每个源创建一个带超时的Promise
      const timeoutPromise = new Promise<SourceResponse>((_, reject) => {
        setTimeout(() => reject(new Error(`获取 ${id} 数据超时`)), 60000)
      })

      // 实际获取数据的Promise
      const fetchPromise = (async () => {
        try {
          // 使用语言参数构建缓存键
          const cacheKey = `${id}_${lang}`
          // 只在需要使用缓存时获取
          const _cache = cacheTable ? await cacheTable.get(cacheKey) : undefined

          // 获取原始数据（中文）
          const newData = (await getters[id]()).slice(0, 30)
          console.log(`批量获取: 获取到 ${id} 的原始数据，语言: ${lang}, 数量: ${newData.length}`)

          // 如果请求的是英文，则进行翻译
          let processedData = newData
          if (lang === "en") {
            try {
              console.log(`批量获取: 开始翻译 ${id} 的数据到英文`)

              // 收集所有需要翻译的文本
              const textsToTranslate: string[] = []
              const textPositions: { itemIndex: number, field: string }[] = []

              // 遍历每个项目，收集需要翻译的文本
              newData.forEach((item, index) => {
                // 标题
                if (item.title) {
                  textsToTranslate.push(item.title)
                  textPositions.push({ itemIndex: index, field: "title" })
                }

                // 描述
                if (item.extra?.description) {
                  textsToTranslate.push(item.extra.description)
                  textPositions.push({ itemIndex: index, field: "description" })
                }

                // 唯一描述
                if (item.extra?.uniqueDescription) {
                  textsToTranslate.push(item.extra.uniqueDescription)
                  textPositions.push({ itemIndex: index, field: "uniqueDescription" })
                }
              })

              // 翻译所有文本
              const translatedTexts = await translate(textsToTranslate, "zh", "en")

              // 创建翻译后的数据副本
              const enItems = JSON.parse(JSON.stringify(newData))

              // 将翻译结果应用回数据
              textPositions.forEach((pos, i) => {
                const translation = translatedTexts[i]
                if (translation) {
                  // 移除可能的"[EN]"前缀
                  let cleanTranslation = translation
                  if (typeof cleanTranslation === "string" && cleanTranslation.startsWith("[EN]")) {
                    cleanTranslation = cleanTranslation.substring(5).trim()
                  }

                  const item = enItems[pos.itemIndex]
                  if (pos.field === "title") {
                    item.title = cleanTranslation
                  } else if (pos.field === "description" && item.extra) {
                    item.extra.description = cleanTranslation
                  } else if (pos.field === "uniqueDescription" && item.extra) {
                    item.extra.uniqueDescription = cleanTranslation
                  }
                }
              })

              // 添加语言标识和原始标题
              processedData = enItems.map((item: any, index: number) => ({
                ...item,
                extra: {
                  ...item.extra,
                  langId: "en",
                  originalTitle: newData[index].title,
                },
              }))

              logger.success(`批量获取: translated ${id} to English`)
            } catch (translateError) {
              console.error(`批量获取: 翻译出错详情:`, translateError)
              logger.error(`批量获取: Translation error: ${translateError}`)

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
          }

          // 更新缓存
          if (cacheTable) {
            // 使用包含语言的缓存键
            const cacheKey = `${id}_${lang}`
            await cacheTable.set(cacheKey, {
              updated: now,
              items: processedData,
            })
          }

          // 返回响应
          return {
            status: "success" as const,
            id,
            updatedTime: now,
            items: processedData,
            lang,
          }
        } catch (error) {
          console.error(`批量获取: 获取 ${id} 数据失败:`, error)
          logger.error(`批量获取: 获取 ${id} 数据失败: ${error}`)

          // 如果有缓存，返回缓存数据
          if (cacheTable) {
            const cacheKey = `${id}_${lang}`
            const _cache = await cacheTable.get(cacheKey)
            if (_cache) {
              logger.info(`批量获取: 使用缓存的 ${id} 数据`)
              return {
                status: "success" as const,
                id,
                updatedTime: _cache.updated,
                items: _cache.items,
                lang,
              }
            }
          }

          // 如果没有缓存，返回错误状态
          return {
            status: "error" as const,
            id,
            message: String(error),
            updatedTime: now,
            items: [],
            lang,
          }
        }
      })()

      // 使用Promise.race处理超时
      return Promise.race([fetchPromise, timeoutPromise])
    })

    // 并行获取所有源的数据
    const fetchedResponses = await Promise.allSettled(fetchPromises)

    // 处理获取结果
    fetchedResponses.forEach((result, index) => {
      if (result.status === "fulfilled") {
        responses.push(result.value)
      } else {
        // 处理失败的请求
        const id = sourcesToFetch[index]
        console.error(`批量获取: 获取 ${id} 数据失败:`, result.reason)

        // 返回错误状态
        responses.push({
          status: "error" as const,
          id,
          message: String(result.reason),
          updatedTime: now,
          items: [],
          lang,
        })
      }
    })

    return responses
  } catch (error) {
    logger.error(`批量获取API处理出错: ${error}`)
    return []
  }
})
