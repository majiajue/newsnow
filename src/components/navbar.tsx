import { fixedColumnIds, metadata } from "@shared/metadata"
import { Link } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { Translate, useTranslation } from "./TranslationProvider"
import { currentColumnIDAtom } from "~/atoms"
import { locales } from "~/i18n"

// 合并类名函数
const $ = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ")

// 简单的搜索栏钩子
function useSearchBar() {
  return {
    toggle: (show: boolean) => {
      console.log("搜索栏:", show ? "显示" : "隐藏")
    },
  }
}

// 硬编码的翻译
const hardcodedTranslations: Record<string, Record<string, string>> = {
  zh: {
    more: "更多",
    toutiao: "今日头条",
    weibo: "微博热搜",
    zhihu: "知乎热榜",
    baidu: "百度热搜",
    tieba: "贴吧热议",
    bilibili: "B站热搜",
    douyin: "抖音热点",
    github: "GitHub热门",
    v2ex: "V2EX热门",
    following: "关注",
    focus: "关注",
    hottest: "最热",
    realtime: "实时",
    allSources: "全部来源",
  },
  en: {
    more: "More",
    toutiao: "Toutiao Headlines",
    weibo: "Weibo Hot Search",
    zhihu: "Zhihu Hot List",
    baidu: "Baidu Hot Search",
    tieba: "Tieba Hot Topics",
    bilibili: "Bilibili Hot Search",
    douyin: "Douyin Trends",
    github: "GitHub Trending",
    v2ex: "V2EX Hot Topics",
    following: "Following",
    focus: "Focus",
    hottest: "Hottest",
    realtime: "Real-time",
    allSources: "All Sources",
  },
}

export function NavBar() {
  const currentId = useAtomValue(currentColumnIDAtom)
  const { toggle } = useSearchBar()
  const { language, t } = useTranslation()

  // 调试信息
  console.log("NavBar 当前语言:", language)
  console.log("NavBar 语言包:", locales)
  console.log("NavBar 更多文本:", t("更多"))

  return (
    <span className="flex p-3 rounded-2xl bg-primary/1 text-sm shadow shadow-primary/20 hover:shadow-primary/50 transition-shadow-500">
      <button
        type="button"
        onClick={() => toggle(true)}
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md) op-70 dark:op-90",
        )}
      >
        <Translate text="更多" />
      </button>
      
      {/* 添加全部来源链接 - 使用a标签代替Link组件以避免类型错误 */}
      <a
        href="/news/all-sources"
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md)",
          location.pathname === "/news/all-sources" ? "color-primary font-bold" : "op-70 dark:op-90",
        )}
      >
        <Translate text={language === "en" ? "All Sources" : "全部来源"} />
      </a>
      
      {fixedColumnIds.map((columnId) => {
        // 使用硬编码的翻译或从翻译服务获取
        let columnName = ""

        // 特殊处理一些关键导航项
        if (columnId === "focus") {
          columnName = t("关注")
        } else if (columnId === "hottest") {
          columnName = t("最热")
        } else if (columnId === "realtime") {
          columnName = t("实时")
        } else {
          // 其他栏目使用硬编码翻译或元数据
          const langKey = language === "en" ? "en" : "zh"
          // 使用类型断言确保 TypeScript 知道 columnId 是有效的键
          const translations = hardcodedTranslations[langKey]

          // 使用安全的方式获取列名
          if (columnId in translations) {
            columnName = translations[columnId]
          } else if (columnId in metadata) {
            // 这里使用类型断言，因为我们已经检查了 columnId 是否在 metadata 中
            columnName = metadata[columnId as keyof typeof metadata].name
          } else {
            // 如果都找不到，使用 columnId 作为默认值
            columnName = String(columnId)
          }
        }

        console.log(`NavBar 栏目 ${columnId} 名称:`, columnName)

        return (
          <Link
            key={columnId}
            to="/c/$column"
            params={{ column: columnId }}
            className={$(
              "px-2 hover:(bg-primary/10 rounded-md)",
              currentId === columnId ? "color-primary font-bold" : "op-70 dark:op-90",
            )}
          >
            <Translate text={columnName} />
          </Link>
        )
      })}
    </span>
  )
}
