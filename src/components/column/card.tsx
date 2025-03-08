import type { NewsItem, SourceID, SourceResponse } from "@shared/types"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { useWindowSize } from "react-use"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { sources } from "@shared/sources"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import { $, cacheSources, delay, refetchSources, useFocusWith, useRefetch } from "./cardUtils"
import { myFetch, safeParseString } from "~/utils"
import { useRelativeTime } from "~/hooks/useRelativeTime"

import { useTranslation } from "~/hooks/useTranslation"

// 导出供其他模块使用
export { cacheSources, refetchSources }

export interface ItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  id: SourceID
  /**
   * 是否显示透明度，拖动时原卡片的样式
   */
  isDragging?: boolean
  setHandleRef?: (ref: HTMLElement | null) => void
}

interface NewsCardProps {
  id: SourceID
  setHandleRef?: (ref: HTMLElement | null) => void
}

export const CardWrapper = forwardRef<HTMLElement, ItemsProps>(({ id, isDragging, setHandleRef, style, ...props }, dndRef) => {
  const ref = useRef<HTMLDivElement>(null)

  const inView = useInView(ref, {
    once: true,
  })

  useImperativeHandle(dndRef, () => ref.current! as HTMLDivElement)

  return (
    <div
      ref={ref}
      className={$(
        "flex flex-col h-500px rounded-2xl p-4 cursor-default",
        // "backdrop-blur-5",
        "transition-opacity-300",
        isDragging && "op-50",
        `bg-${sources[id].color}-500 dark:bg-${sources[id].color} bg-op-40!`,
      )}
      style={{
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    >
      {inView && <NewsCard id={id} setHandleRef={setHandleRef} />}
    </div>
  )
})

function NewsCard({ id, setHandleRef }: NewsCardProps) {
  const { refresh } = useRefetch()
  const { currentLanguage } = useTranslation()

  useEffect(() => {
    console.log("NewsCard 语言变化:", currentLanguage, id)
    // 当语言变化时，清除该源的所有语言缓存
    const zhCacheKey = `${id}_zh`
    const enCacheKey = `${id}_en`

    if (cacheSources.has(zhCacheKey)) {
      console.log("清除中文缓存:", zhCacheKey)
      cacheSources.delete(zhCacheKey)
    }

    if (cacheSources.has(enCacheKey)) {
      console.log("清除英文缓存:", enCacheKey)
      cacheSources.delete(enCacheKey)
    }

    // 添加到需要刷新的源
    refetchSources.add(id)
  }, [currentLanguage, id])

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<{ language: string }>) => {
      console.log("语言变化事件:", event.detail.language, id)
      // 当语言变化时，清除该源的所有语言缓存并强制刷新
      const zhCacheKey = `${id}_zh`
      const enCacheKey = `${id}_en`

      if (cacheSources.has(zhCacheKey)) {
        console.log("事件触发清除中文缓存:", zhCacheKey)
        cacheSources.delete(zhCacheKey)
      }

      if (cacheSources.has(enCacheKey)) {
        console.log("事件触发清除英文缓存:", enCacheKey)
        cacheSources.delete(enCacheKey)
      }

      // 添加到需要刷新的源
      refetchSources.add(id)

      // 通知 react-query 重新获取数据
      if (window.queryClient) {
        window.queryClient.invalidateQueries({
          queryKey: ["source", id],
        })
      }
    }

    // 添加事件监听
    window.addEventListener("languageChanged", handleLanguageChange as EventListener)

    // 清理函数
    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
    }
  }, [id])

  const { data, isFetching, isError } = useQuery({
    queryKey: ["source", id, currentLanguage],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1] as SourceID
      const lang = queryKey[2] as string
      console.log("执行查询:", id, lang)

      // 构建缓存键
      const cacheKey = `${id}_${lang}`

      // 添加语言参数到URL
      let url = `/s?id=${id}&lang=${lang}`
      const headers: Record<string, any> = {}

      // 强制刷新缓存的条件
      const shouldRefresh = refetchSources.has(id) || !cacheSources.has(cacheKey)

      if (shouldRefresh) {
        console.log("强制刷新:", id, lang, cacheKey)
        // 添加语言参数到URL
        url = `/s?id=${id}&latest&lang=${lang}`
        const jwt = safeParseString(localStorage.getItem("jwt"))
        if (jwt) headers.Authorization = `Bearer ${jwt}`
        refetchSources.delete(id)
      } else if (cacheSources.has(cacheKey)) {
        // wait animation
        await delay(200)
        return cacheSources.get(cacheKey)
      }

      try {
        const response: SourceResponse = await myFetch(url, {
          headers,
        })

        console.log(`获取到 ${id} 的响应数据，语言: ${response.lang || lang}，状态: ${response.status}，项目数量: ${response.items?.length || 0}`)

        // 检查是否有翻译后的标题
        if (response.items && response.items.length > 0) {
          console.log(`第一项标题: ${response.items[0].title}`)
          console.log(`第一项语言标识: ${response.items[0].extra?.langId || "未知"}`)
        }

        function diff() {
          try {
            if (response.items && sources[id].type === "hottest" && cacheSources.has(cacheKey)) {
              const oldItems = cacheSources.get(cacheKey)!.items
              const newItems = response.items
              const oldTitles = new Set(oldItems.map(i => i.title))
              const newTitles = new Set(newItems.map(i => i.title))
              const addedTitles = [...newTitles].filter(t => !oldTitles.has(t))
              const removedTitles = [...oldTitles].filter(t => !newTitles.has(t))
              if (addedTitles.length || removedTitles.length) {
                console.log(
                  `${id} 有更新: 新增 ${addedTitles.length} 条, 移除 ${removedTitles.length} 条`,
                )
                return addedTitles.length - removedTitles.length
              }
            }
            return 0
          } catch (e) {
            console.error(`计算差异时出错:`, e)
            return 0
          }
        }

        // 计算差异并缓存
        const diffCount = diff()
        cacheSources.set(cacheKey, {
          ...response,
          diff: diffCount,
        })

        return response
      } catch (error) {
        console.error(`获取 ${id} 数据失败:`, error)

        // 如果缓存中有数据，使用缓存数据
        if (cacheSources.has(cacheKey)) {
          console.log(`使用缓存的 ${id} 数据`)
          return cacheSources.get(cacheKey)
        }

        // 否则返回错误状态
        return {
          id,
          status: "error",
          message: String(error),
          updatedTime: Date.now(),
          items: [],
          lang,
        }
      }
    },
    placeholderData: prev => prev,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const { isFocused, toggleFocus } = useFocusWith(id)

  const isTranslated = currentLanguage === "en"

  return (
    <>
      <div className={$("flex justify-between mx-2 mt-0 mb-2 items-center")}>
        <div className="flex gap-2 items-center">
          <a
            className={$("w-8 h-8 rounded-full bg-cover")}
            target="_blank"
            href={sources[id].home}
            title={sources[id].desc}
            style={{
              backgroundImage: `url(/icons/${id.split("-")[0]}.png)`,
            }}
          />
          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span
                className="text-xl font-bold"
                title={sources[id].desc}
              >
                {sources[id].name}
              </span>
              {sources[id]?.title && <span className={$("text-sm", `color-${sources[id].color} bg-base op-80 bg-op-50! px-1 rounded`)}>{sources[id].title}</span>}
            </span>
            <span className="text-xs op-70"><UpdatedTime isError={isError} updatedTime={data?.updatedTime} /></span>
          </span>
        </div>
        <div className={$("flex gap-2 text-lg", `color-${sources[id].color}`)}>
          <button
            type="button"
            className={$("btn i-ph:arrow-counter-clockwise-duotone", isFetching && "animate-spin i-ph:circle-dashed-duotone")}
            onClick={() => refresh(id)}
          />
          <button
            type="button"
            className={$("btn", isFocused ? "i-ph:star-fill" : "i-ph:star-duotone")}
            onClick={toggleFocus}
          />
          {/* firefox cannot drag a button */}
          {setHandleRef && (
            <div
              ref={setHandleRef}
              className={$("btn", "i-ph:dots-six-vertical-duotone", "cursor-grab")}
            />
          )}
        </div>
      </div>

      <OverlayScrollbar
        className={$([
          "h-full p-2 overflow-y-auto rounded-2xl bg-base bg-op-70!",
          isFetching && `animate-pulse`,
          `sprinkle-${sources[id].color}`,
        ])}
        options={{
          overflow: { x: "hidden" },
        }}
        defer
      >
        <div className={$("transition-opacity-500", isFetching && "op-20")}>
          {!!data?.items?.length && (sources[id].type === "hottest" ? <NewsListHot items={data.items} isTranslated={isTranslated} /> : <NewsListTimeLine items={data.items} />)}
        </div>
      </OverlayScrollbar>
    </>
  )
}

function UpdatedTime({ isError, updatedTime }: { updatedTime: any, isError: boolean }) {
  const relativeTime = useRelativeTime(updatedTime ?? "")
  const { translate } = useTranslation()

  if (relativeTime) {
    return (
      <>
        {relativeTime}
        {translate("更新")}
      </>
    )
  }
  if (isError) return <>{translate("获取失败")}</>
  return <>{translate("加载中...")}</>
}

function DiffNumber({ diff }: { diff: number }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    setShown(true)
    const timer = setTimeout(() => {
      setShown(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [setShown, diff])

  return (
    <AnimatePresence>
      { shown && (
        <motion.span
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 0.5, y: -7 }}
          exit={{ opacity: 0, y: -15 }}
          className={$("absolute left-0 text-xs", diff < 0 ? "text-green" : "text-red")}
        >
          {diff > 0 ? `+${diff}` : diff}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

function ExtraInfo({ item }: { item: NewsItem }) {
  if (item?.extra?.info) {
    return <>{item.extra.info}</>
  }

  // 显示增强的内容描述
  if (item?.extra?.uniqueDescription) {
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
        {item.extra.uniqueDescription}
        {item?.extra?.attribution && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {item.extra.attribution}
          </div>
        )}
      </div>
    )
  }

  // 显示普通描述
  if (item?.extra?.description) {
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
        {item.extra.description}
      </div>
    )
  }

  if (item?.extra?.icon) {
    const { url, scale } = typeof item.extra.icon === "string" ? { url: item.extra.icon, scale: undefined } : item.extra.icon
    return (
      <img
        src={url}
        style={{
          transform: `scale(${scale ?? 1})`,
        }}
        className="h-4 inline mt--1"
        onError={e => e.currentTarget.style.display = "none"}
      />
    )
  }

  // 显示关键词标签
  if (item?.extra?.keywords && item.extra.keywords.length > 0) {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {item.extra.keywords.map((keyword, index) => (
          <span
            key={`keyword-${keyword}-${index}`}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {keyword}
          </span>
        ))}
      </div>
    )
  }
}

function NewsUpdatedTime({ date }: { date: string | number }) {
  const relativeTime = useRelativeTime(date)
  return <>{relativeTime}</>
}

interface NewsListHotProps {
  items: NewsItem[]
  isTranslated: boolean
}

function NewsListHot({ items, isTranslated }: NewsListHotProps) {
  const { width } = useWindowSize()

  const renderTitle = (item: NewsItem) => {
    // 检查是否有翻译后的标题
    let displayTitle = item.title

    // 如果当前语言是英文，并且有原始标题，则使用翻译后的标题
    if (isTranslated && item.extra?.originalTitle) {
      displayTitle = item.title // 此时item.title应该是翻译后的标题
      console.log(`显示翻译后的标题: ${displayTitle}`)
    }

    return (
      <div className="title">
        {displayTitle}
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-2">
      {items?.map((item, i) => (
        <a
          href={width < 768 ? item.mobileUrl || item.url : item.url}
          target="_blank"
          key={item.id}
          title={item.extra?.hover}
          className={$(
            "flex gap-2 items-center items-stretch relative",
            "hover:bg-neutral-400/10 rounded-md pr-1 visited:(text-neutral-400)",
          )}
        >
          <span className={$("bg-neutral-400/10 min-w-6 flex justify-center items-center rounded-md text-sm")}>
            {i + 1}
          </span>
          {!!item.extra?.diff && <DiffNumber diff={item.extra.diff} />}
          <span className="self-start line-height-none">
            <span className="mr-2 text-base">
              {renderTitle(item)}
            </span>
            <span className="text-xs text-neutral-400/80 truncate align-middle">
              <ExtraInfo item={item} />
            </span>
          </span>
        </a>
      ))}
    </ol>
  )
}

function NewsListTimeLine({ items }: { items: NewsItem[] }) {
  const { width } = useWindowSize()
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "NewsArticle",
              "headline": item.title,
              "url": width < 768 ? item.mobileUrl || item.url : item.url,
              "datePublished": item.pubDate || item?.extra?.date,
              "publisher": {
                "@type": "Organization",
                "name": item.source || "NewsNow",
                "url": item.sourceUrl || "https://shishixinwen.news",
              },
            },
          })),
        })}
      </script>
      <ol className="border-s border-neutral-400/50 flex flex-col ml-1">
        {items?.map(item => (
          <li key={`${item.id}-${item.pubDate || item?.extra?.date || ""}-${item?.extra?.langId || "zh"}`} className="flex flex-col">
            <span className="flex items-center gap-1 text-neutral-400/50 ml--1px">
              <span className="">-</span>
              <span className="text-xs text-neutral-400/80">
                {(item.pubDate || item?.extra?.date) && <NewsUpdatedTime date={(item.pubDate || item?.extra?.date)!} />}
              </span>
              <span className="text-xs text-neutral-400/80">
                <ExtraInfo item={item} />
              </span>
            </span>
            <a
              className={$("ml-2 px-1 hover:bg-neutral-400/10 rounded-md visited:(text-neutral-400/80)")}
              href={width < 768 ? item.mobileUrl || item.url : item.url}
              title={item.extra?.hover}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </>
  )
}
