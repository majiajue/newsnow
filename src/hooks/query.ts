import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { SourceID, SourceResponse } from "@shared/types"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "~/components/TranslationProvider"
import { cacheSources } from "~/components/column/card"

// 创建一个全局的加载状态管理对象
export const loadingStatus = {
  sources: new Map<string, { status: string, progress: number }>(),
  listeners: new Set<() => void>(),

  // 更新加载状态
  updateSourceStatus(id: string, status: string, progress: number = 0) {
    this.sources.set(id, { status, progress })
    this.notifyListeners()
  },

  // 获取特定源的加载状态
  getSourceStatus(id: string) {
    return this.sources.get(id) || { status: "idle", progress: 0 }
  },

  // 获取所有源的加载状态
  getAllSourceStatus() {
    return Array.from(this.sources.entries()).reduce((acc, [id, status]) => {
      acc[id] = status
      return acc
    }, {} as Record<string, { status: string, progress: number }>)
  },

  // 添加监听器
  addListener(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  },

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(listener => listener())
  },

  // 重置所有状态
  resetAll() {
    this.sources.clear()
    this.notifyListeners()
  },
}

// 特定源的配置信息
const sourceConfig: Record<string, { maxRetries: number, timeout: number }> = {
  // 为 thepaper 源设置更长的超时时间和更多的重试次数
  thepaper: { maxRetries: 5, timeout: 60000 },
  // 默认配置
  default: { maxRetries: 3, timeout: 60000 },
}

// 获取源的配置
function getSourceConfig(sourceId: SourceID) {
  return sourceConfig[sourceId] || sourceConfig.default
}

export function useUpdateQuery() {
  const queryClient = useQueryClient()
  return useCallback(
    (id: SourceID) => {
      queryClient.invalidateQueries({ queryKey: ["sources", id] })
    },
    [queryClient],
  )
}

// 单个源的数据获取函数
async function fetchSourceData(sourceId: SourceID, lang: string, signal: AbortSignal): Promise<SourceResponse> {
  const config = getSourceConfig(sourceId)
  let retries = 0
  let lastError: Error | null = null

  // 更新加载状态为"加载中"
  loadingStatus.updateSourceStatus(sourceId, "loading", 0)

  // 实现重试逻辑
  while (retries <= config.maxRetries) {
    try {
      // 如果是重试，更新进度
      if (retries > 0) {
        loadingStatus.updateSourceStatus(sourceId, "loading", Math.min(80, retries * 20))
        console.log(`正在重试获取 ${sourceId} 数据，第 ${retries} 次尝试`)
      }

      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`获取 ${sourceId} 数据超时`)), config.timeout)
      })

      // 创建获取数据的 Promise
      const fetchPromise = fetch(`/s?id=${sourceId}&lang=${lang}`, {
        signal,
        // 添加缓存控制头，防止浏览器缓存
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })

      // 使用 Promise.race 实现超时控制
      const response = await Promise.race([fetchPromise, timeoutPromise]) as SourceResponse

      // 检查响应是否有效
      if (!response || !response.items) {
        throw new Error(`获取 ${sourceId} 数据失败：无效的响应格式`)
      }

      // 更新加载状态为"成功"
      loadingStatus.updateSourceStatus(sourceId, "success", 100)

      // 更新缓存
      const cacheKey = `${sourceId}_${lang}`
      cacheSources.set(cacheKey, response)

      return response
    } catch (error) {
      lastError = error as Error
      retries++

      // 记录详细错误信息
      console.error(`获取 ${sourceId} 数据失败 (尝试 ${retries}/${config.maxRetries + 1}):`, error)

      // 如果已经达到最大重试次数或者请求被取消，则不再重试
      if (retries > config.maxRetries || (error instanceof Error && error.name === "AbortError")) {
        break
      }

      // 指数退避策略，每次重试等待时间增加
      const waitTime = Math.min(1000 * 2 ** (retries - 1), 10000)
      console.log(`等待 ${waitTime}ms 后重试获取 ${sourceId} 数据...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // 所有重试都失败了
  console.error(`获取 ${sourceId} 数据失败，已重试 ${retries} 次:`, lastError)

  // 更新加载状态为"错误"
  loadingStatus.updateSourceStatus(sourceId, "error", 0)

  // 尝试从缓存获取数据
  const cacheKey = `${sourceId}_${lang}`
  if (cacheSources.has(cacheKey)) {
    console.log(`使用缓存的 ${sourceId} 数据`)
    return cacheSources.get(cacheKey)!
  }

  // 如果没有缓存，返回错误状态
  return {
    id: sourceId,
    status: "success",
    message: lastError ? lastError.message : "未知错误",
    updatedTime: Date.now(),
    items: [],
    lang,
  }
}

export function useEntireQuery(items: SourceID[]) {
  const { language } = useTranslation()
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})

  // 临时禁用 Web Workers，改用主线程处理
  useEffect(() => {
    // 检查浏览器是否支持 Web Workers
    // if (typeof Worker !== "undefined" && items.length > 0) {
    //   // 创建一个内联 Worker 来处理数据
    //   const workerCode = `
    //     self.onmessage = function(e) {
    //       const data = e.data;
    //       
    //       // 在 Worker 中处理数据
    //       const processedData = data.map(item => {
    //         // 这里可以进行复杂的数据处理
    //         return item;
    //       });
    //       
    //       // 将处理后的数据发送回主线程
    //       self.postMessage(processedData);
    //     }
    //   `
    //
    //   // 创建 Blob URL
    //   const blob = new Blob([workerCode], { type: "application/javascript" })
    //   const workerUrl = URL.createObjectURL(blob)
    //
    //   // 创建 Worker
    //   const worker = new Worker(workerUrl, { type: 'module' })
    //
    //   // 监听 Worker 的消息
    //   worker.onmessage = function (e: MessageEvent) {
    //     // 接收处理后的数据
    //     const processedData = e.data
    //     console.log("Worker 处理完成，数据项数:", processedData.length)
    //
    //     // 更新缓存或执行其他操作
    //     // 这里不直接更新 React Query 缓存，因为 Worker 中无法访问 React 上下文
    //   }
    //
    //   // 发送数据到 Worker 进行处理
    //   worker.postMessage(items)
    //
    //   // 清理函数
    //   return () => {
    //     worker.terminate()
    //     URL.revokeObjectURL(workerUrl)
    //   }
    // }
  }, [items])

  // 监听加载状态变化
  useEffect(() => {
    // 重置加载状态
    const newLoadingItems: Record<string, boolean> = {}
    items.forEach((id) => {
      newLoadingItems[id] = false
    })
    setLoadingItems(newLoadingItems)

    // 添加监听器以更新组件状态
    const removeListener = loadingStatus.addListener(() => {
      const updatedItems: Record<string, boolean> = { ...loadingItems }
      let hasChanges = false

      items.forEach((id) => {
        const status = loadingStatus.getSourceStatus(id)
        const isLoading = status.status === "loading"
        if (updatedItems[id] !== isLoading) {
          updatedItems[id] = isLoading
          hasChanges = true
        }
      })

      if (hasChanges) {
        setLoadingItems(updatedItems)
      }
    })

    return removeListener
  }, [items, loadingItems])

  return useQuery({
    // sort in place
    queryKey: ["sources", ...items.sort()],
    queryFn: async () => {
      const sources = items
      const lang = language
      console.log(`批量获取 ${sources.length} 个源，语言: ${lang}`)

      try {
        // 使用 AbortController 实现请求取消
        const controller = new AbortController()
        const signal = controller.signal

        // 检查是否包含 thepaper 源，如果有，单独处理
        const thepaperIndex = sources.findIndex(id => id === "thepaper")
        let thepaperPromise: Promise<SourceResponse> | null = null

        // 如果存在 thepaper 源，单独处理并从批量请求中移除
        if (thepaperIndex !== -1) {
          const thepaperId = sources[thepaperIndex]
          console.log(`单独处理 ${thepaperId} 源`)
          thepaperPromise = fetchSourceData(thepaperId, lang, signal)
          // 从批量请求列表中移除
          sources.splice(thepaperIndex, 1)
        }

        // 设置 60 秒后自动取消请求
        const timeoutId = setTimeout(() => {
          console.warn("请求超时，自动取消")
          controller.abort()
        }, 60000)

        // 创建批量请求
        let batchPromise: Promise<SourceResponse[] | undefined> | null = null

        if (sources.length > 0) {
          // 更新所有源的加载状态为"加载中"
          sources.forEach((id) => {
            loadingStatus.updateSourceStatus(id, "loading", 0)
          })

          batchPromise = fetch(`/s/entire?sources=${encodeURIComponent(JSON.stringify(sources))}&lang=${lang}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            },
            signal,
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            // 验证响应数据
            if (!Array.isArray(data)) {
              throw new TypeError(`无效的响应格式: 预期数组，实际得到 ${typeof data}`)
            }

            return data as SourceResponse[]
          })
        }

        // 添加进度指示器
        let progressInterval: number | null = null

        // 模拟进度更新（因为实际上我们无法知道服务器的确切进度）
        progressInterval = window.setInterval(() => {
          sources.forEach((id) => {
            const currentStatus = loadingStatus.getSourceStatus(id)
            if (currentStatus.status === "loading" && currentStatus.progress < 90) {
              // 逐渐增加进度，但不到100%（因为我们不知道实际完成时间）
              const newProgress = Math.min(90, currentStatus.progress + (100 - currentStatus.progress) * 0.1)
              loadingStatus.updateSourceStatus(id, "loading", newProgress)
            }
          })
        }, 500) as unknown as number

        // 等待所有请求完成
        let results: SourceResponse[] = []

        try {
          // 并行处理批量请求和 thepaper 请求
          const promises: Promise<any>[] = []

          if (batchPromise) {
            promises.push(batchPromise)
          }

          if (thepaperPromise) {
            promises.push(thepaperPromise)
          }

          const responses = await Promise.all(promises)

          // 处理结果
          if (batchPromise && responses[0]) {
            const batchResults = responses[0] as SourceResponse[]
            results = [...batchResults]

            // 更新批量请求中的源的加载状态
            batchResults.forEach((res) => {
              loadingStatus.updateSourceStatus(res.id, "success", 100)
            })
          }

          // 如果有 thepaper 结果，添加到结果列表
          if (thepaperPromise) {
            const thepaperResult = responses[batchPromise ? 1 : 0] as SourceResponse
            results.push(thepaperResult)
          }
        } catch (error) {
          console.error("请求过程中出错:", error)
          // 错误处理在下面的 catch 块中统一处理
          throw error
        } finally {
          // 清除超时和进度间隔
          clearTimeout(timeoutId)
          if (progressInterval !== null) {
            clearInterval(progressInterval)
          }
        }

        if (results.length) {
          const s = [] as SourceID[]

          // 使用 requestAnimationFrame 分批处理数据，避免阻塞主线程
          const processBatch = (startIndex: number, batchSize: number) => {
            return new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                const endIndex = Math.min(startIndex + batchSize, results.length)

                for (let i = startIndex; i < endIndex; i++) {
                  const v = results[i]
                  const id = v.id
                  const lang = v.lang || "zh"
                  // 添加语言标识到缓存键
                  const cacheKey = `${id}_${lang}`

                  // 更新加载状态为"成功"
                  loadingStatus.updateSourceStatus(id, "success", 100)

                  if (!cacheSources.has(cacheKey) || cacheSources.get(cacheKey)!.updatedTime < v.updatedTime) {
                    cacheSources.set(cacheKey, v)
                    s.push(id)
                  }
                }

                if (endIndex < results.length) {
                  // 继续处理下一批
                  processBatch(endIndex, batchSize).then(resolve)
                } else {
                  // 所有批次处理完成
                  resolve()
                }
              })
            })
          }

          // 开始批处理，每批处理 10 个项目
          await processBatch(0, 10)

          if (s.length) {
            console.log(`批量获取更新了 ${s.length} 个源`)
          }
        }

        return results
      } catch (error: unknown) {
        // 检查是否是取消请求导致的错误
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("请求被取消，可能是超时或用户导航离开")

          // 更新所有源的加载状态为"已取消"
          sources.forEach((id) => {
            loadingStatus.updateSourceStatus(id, "cancelled", 0)
          })
        } else {
          console.error("批量获取数据失败:", error)

          // 更新所有源的加载状态为"错误"
          sources.forEach((id) => {
            loadingStatus.updateSourceStatus(id, "error", 0)
          })
        }

        // 返回已有的缓存数据
        const cachedResponses: SourceResponse[] = []

        // 使用 Promise.all 并行处理所有源的缓存检查
        await Promise.all(items.map(async (id) => {
          const cacheKey = `${id}_${lang}`
          if (cacheSources.has(cacheKey)) {
            cachedResponses.push(cacheSources.get(cacheKey)!)
          } else {
            // 对于没有缓存的源，创建一个错误状态的响应
            cachedResponses.push({
              id,
              status: "success",
              updatedTime: Date.now(),
              items: [],
              lang,
              message: "无法获取数据，使用空结果",
            })
          }
        }))

        return cachedResponses.length > 0 ? cachedResponses : null
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 1000,
    // 添加缓存和后台更新策略
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

// 自定义钩子，用于获取加载状态
export function useLoadingStatus(sourceId?: string) {
  const [status, setStatus] = useState(
    sourceId
      ? loadingStatus.getSourceStatus(sourceId)
      : { allSources: loadingStatus.getAllSourceStatus() },
  )

  useEffect(() => {
    const updateStatus = () => {
      if (sourceId) {
        setStatus(loadingStatus.getSourceStatus(sourceId))
      } else {
        setStatus({ allSources: loadingStatus.getAllSourceStatus() })
      }
    }

    // 初始更新
    updateStatus()

    // 添加监听器
    const removeListener = loadingStatus.addListener(updateStatus)

    return removeListener
  }, [sourceId])

  return status
}
