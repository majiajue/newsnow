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
const hardcodedTranslations = {
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
    hottest: "最热",
    realtime: "实时",
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
    hottest: "Hottest",
    realtime: "Real-time",
  },
}

export function NavBar() {
  const currentId = useAtomValue(currentColumnIDAtom)
  const { toggle } = useSearchBar()
  const { currentLanguage, translate } = useTranslation()

  // 调试信息
  console.log("NavBar 当前语言:", currentLanguage)
  console.log("NavBar 语言包:", locales)
  console.log("NavBar 更多文本:", translate("更多"))

  return (
    <span className={$([
      "flex p-3 rounded-2xl bg-primary/1 text-sm",
      "shadow shadow-primary/20 hover:shadow-primary/50 transition-shadow-500",
    ])}
    >
      <button
        type="button"
        onClick={() => toggle(true)}
        className={$(
          "px-2 hover:(bg-primary/10 rounded-md) op-70 dark:op-90",
        )}
      >
        <Translate text="更多" />
      </button>
      {fixedColumnIds.map((columnId) => {
        // 使用硬编码的翻译或从翻译服务获取
        let columnName = ""

        // 特殊处理一些关键导航项
        if (columnId === "following") {
          columnName = translate("关注")
        } else if (columnId === "hottest") {
          columnName = translate("最热")
        } else if (columnId === "realtime") {
          columnName = translate("实时")
        } else {
          // 其他栏目使用硬编码翻译或元数据
          columnName = currentLanguage === "en"
            ? hardcodedTranslations.en[columnId] || metadata[columnId].name
            : hardcodedTranslations.zh[columnId] || metadata[columnId].name
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
