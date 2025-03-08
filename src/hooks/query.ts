import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { SourceID, SourceResponse } from "@shared/types"
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

  useQuery({
    // sort in place
    queryKey: ["entire", [...items].sort(), currentLanguage],
    queryFn: async ({ queryKey }) => {
      const sources = queryKey[1]
      const lang = queryKey[2] as string

      if (sources.length === 0) return null
      console.log("批量获取数据，语言:", lang)

      try {
        const res: SourceResponse[] | undefined = await myFetch("/s/entire", {
          method: "POST",
          body: {
            sources,
            lang, // 传递语言参数
          },
        })

        if (res?.length) {
          const s = [] as SourceID[]
          res.forEach((v) => {
            const id = v.id
            const lang = v.lang || "zh"
            // 添加语言标识到缓存键
            const cacheKey = `${id}_${lang}`

            if (!cacheSources.has(cacheKey) || cacheSources.get(cacheKey)!.updatedTime < v.updatedTime) {
              cacheSources.set(cacheKey, v)
              s.push(id)
            }
          })
          if (s.length) {
            console.log(`批量获取更新了 ${s.length} 个源`)
          }
        }

        return res
      } catch (error) {
        console.error("批量获取数据失败:", error)

        // 返回已有的缓存数据
        const cachedResponses: SourceResponse[] = []
        for (const id of sources) {
          const cacheKey = `${id}_${lang}`
          if (cacheSources.has(cacheKey)) {
            cachedResponses.push(cacheSources.get(cacheKey)!)
          } else {
            // 对于没有缓存的源，创建一个错误状态的响应
            cachedResponses.push({
              id,
              status: "error",
              message: String(error),
              updatedTime: Date.now(),
              items: [],
              lang,
            })
          }
        }

        return cachedResponses.length > 0 ? cachedResponses : null
      }
    },
    staleTime: 1000 * 60 * 5, // 5分钟
    refetchInterval: 1000 * 60 * 5, // 5分钟
    retry: 2, // 添加重试次数
    retryDelay: 1000, // 重试延迟
  })
}
