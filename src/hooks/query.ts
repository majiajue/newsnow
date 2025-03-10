import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { SourceID, SourceResponse } from "@shared/types"
import { useCallback, useEffect } from "react"
import { useTranslation } from "~/components/TranslationProvider"
import { cacheSources } from "~/components/column/card"

export function useUpdateQuery() {
  const queryClient = useQueryClient()

  /**
   * update query
   */
  return useCallback(async (...sources: SourceID[]) => {
    await queryClient.refetchQueries({
      predicate: (query) => {
        const [type, id] = query.queryKey as ["source" | "entire", SourceID]
        return type === "source" && sources.includes(id)
      },
    })
  }, [queryClient])
}

export function useEntireQuery(items: SourceID[]) {
  // const _update = useUpdateQuery()
  const { currentLanguage } = useTranslation()

  // 使用 Web Worker 进行数据处理
  useEffect(() => {
    // 检查浏览器是否支持 Web Workers
    if (typeof Worker !== "undefined" && items.length > 0) {
      // 创建一个内联 Worker 来处理数据
      const workerCode = `
        self.onmessage = function(e) {
          const { data, lang } = e.data;
          
          // 在 Worker 中处理数据
          const processedData = data.map(item => {
            // 这里可以进行一些耗时的数据处理
            return item;
          });
          
          // 将处理后的数据发送回主线程
          self.postMessage(processedData);
        }
      `

      // 创建 Blob URL
      const blob = new Blob([workerCode], { type: "application/javascript" })
      const workerUrl = URL.createObjectURL(blob)

      // 创建 Worker
      const worker = new Worker(workerUrl)

      // 监听 Worker 的消息
      worker.onmessage = function (e: MessageEvent) {
        // 接收处理后的数据
        const processedData = e.data
        console.log("Worker 处理完成，数据项数:", processedData.length)

        // 更新缓存或执行其他操作
        // 这里不直接更新 React Query 缓存，因为 Worker 中无法访问 React 上下文
      }

      // 清理函数
      return () => {
        worker.terminate()
        URL.revokeObjectURL(workerUrl)
      }
    }
  }, [items, currentLanguage])

  return useQuery({
    // sort in place
    queryKey: ["entire", [...items].sort(), currentLanguage],
    queryFn: async ({ queryKey }) => {
      const sources = queryKey[1] as SourceID[]
      const lang = queryKey[2] as string

      if (sources.length === 0) return null
      console.log("批量获取数据，语言:", lang)

      try {
        // 使用 AbortController 实现请求取消
        const controller = new AbortController()
        const signal = controller.signal

        // 设置 30 秒后自动取消请求
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        // 创建请求
        const fetchPromise = fetch("/s/entire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sources,
            lang,
          }),
          signal,
        })

        // 执行请求
        const response = await fetchPromise
        // 清除超时
        clearTimeout(timeoutId)

        // 处理响应
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const res: SourceResponse[] | undefined = await response.json()

        if (res?.length) {
          const s = [] as SourceID[]

          // 使用 requestAnimationFrame 分批处理数据，避免阻塞主线程
          const processBatch = (startIndex: number, batchSize: number) => {
            return new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                const endIndex = Math.min(startIndex + batchSize, res.length)

                for (let i = startIndex; i < endIndex; i++) {
                  const v = res[i]
                  const id = v.id
                  const lang = v.lang || "zh"
                  // 添加语言标识到缓存键
                  const cacheKey = `${id}_${lang}`

                  if (!cacheSources.has(cacheKey) || cacheSources.get(cacheKey)!.updatedTime < v.updatedTime) {
                    cacheSources.set(cacheKey, v)
                    s.push(id)
                  }
                }

                if (endIndex < res.length) {
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

        return res
      } catch (error: unknown) {
        // 检查是否是取消请求导致的错误
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("请求被取消，可能是超时或用户导航离开")
        } else {
          console.error("批量获取数据失败:", error)
        }

        // 返回已有的缓存数据
        const cachedResponses: SourceResponse[] = []

        // 使用 Promise.all 并行处理所有源的缓存检查
        await Promise.all(sources.map(async (id) => {
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
