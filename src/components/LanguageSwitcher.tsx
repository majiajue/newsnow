import { useEffect, useState } from "react"
import { useTranslation } from "./TranslationProvider"
import type { Language } from "~/services/translationService"

// 合并类名函数（未使用，但保留为注释作为文档）
/*
const $ = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ")
*/

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language)

  // 同步显示语言和实际语言
  useEffect(() => {
    console.log("LanguageSwitcher: 当前语言变化为", language)
    setDisplayLanguage(language)
  }, [language])

  const toggleLanguage = () => {
    const newLanguage: Language = language === "zh" ? "en" : "zh"
    console.log("切换语言:", language, "->", newLanguage)

    // 立即更新显示语言，提供即时反馈
    setDisplayLanguage(newLanguage)

    // 设置实际语言
    setLanguage(newLanguage)

    // 强制刷新页面以确保所有组件都使用新语言
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  // 根据当前语言设置不同的图标和提示文本
  const languageIcon = "i-ph:translate-duotone"
  const tooltipText = displayLanguage === "zh"
    ? "当前语言：中文 | 点击切换到英文"
    : "Current Language: English | Click to switch to Chinese"

  return (
    <button
      onClick={toggleLanguage}
      className="btn flex items-center justify-center rounded-full w-8 h-8
                 bg-primary/5 hover:bg-primary/10 transition-colors"
      title={tooltipText}
      type="button"
    >
      <div className="flex items-center justify-center">
        <span className={`${languageIcon} text-lg`}></span>
        <span className="ml-1 text-xs font-bold">{displayLanguage.toUpperCase()}</span>
      </div>
    </button>
  )
}
