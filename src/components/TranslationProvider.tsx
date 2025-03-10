import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo } from "react"
import { Translate as TranslateComponent } from "./Translate"
import type { Language } from "~/services/translationService"
import { translate, useTranslationStore } from "~/services/translationService"
import { getI18nText, hasI18nText } from "~/i18n"
// 导入 Translate 组件以便重新导出

// 翻译上下文类型
export interface TranslationContextType {
  currentLanguage: Language
  setLanguage: (language: Language) => void
  translate: (text: string) => string
  translateAsync: (text: string) => Promise<string>
  isTranslated: boolean
}

// 创建翻译上下文
export const TranslationContext = createContext<TranslationContextType | null>(null)

// 创建 useTranslation 钩子函数
export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation 必须在 TranslationProvider 内部使用")
  }
  return context
}

// 重新导出 Translate 组件
export const Translate = TranslateComponent

// 翻译提供者属性
interface TranslationProviderProps {
  children: ReactNode
}

// 检测浏览器语言
function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "zh" // 默认为中文

  // 获取浏览器语言
  const browserLang = navigator.language || (navigator as any).userLanguage
  console.log("浏览器语言:", browserLang)

  // 如果浏览器语言以 'zh' 开头（如 zh-CN, zh-TW 等），则返回中文，否则返回英文
  const detectedLang = browserLang && browserLang.startsWith("zh") ? "zh" : "en"
  console.log("检测到的语言:", detectedLang)
  return detectedLang
}

/**
 * 检查翻译质量
 * @param originalText 原始文本
 * @param translatedText 翻译后的文本
 * @returns 是否为低质量翻译
 */
function isLowQualityTranslation(originalText: string, translatedText: string): boolean {
  // 检查翻译结果是否为空
  if (!translatedText) return true

  // 检查翻译结果是否过短（相对于原文）
  const originalLength = originalText.length
  const translatedLength = translatedText.length

  // 如果原文较长，但翻译结果非常短，可能是低质量翻译
  if (originalLength > 20 && translatedLength < originalLength * 0.3) return true

  // 检查是否匹配常见错误模式（如只有两个单词的简单短语）
  const wordCount = translatedText.split(/\s+/).filter(Boolean).length
  if (originalLength > 30 && wordCount <= 2) return true

  return false
}

// 翻译提供者组件
export function TranslationProvider({ children }: TranslationProviderProps) {
  const { currentLanguage, setLanguage: storeSetLanguage, getTranslation, addTranslation } = useTranslationStore()

  console.log("TranslationProvider 初始化，当前语言:", currentLanguage)

  // 设置语言并清除缓存
  const setLanguage = useCallback((language: Language) => {
    console.log("设置语言 (setLanguage):", language)

    // 如果语言没有变化，不做任何操作
    if (language === currentLanguage) {
      console.log("语言未变化，不做任何操作")
      return
    }

    // 设置新语言
    storeSetLanguage(language)

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
    setTimeout(() => {
      console.log("刷新页面以应用新语言")
      window.location.reload()
    }, 500)
  }, [currentLanguage, storeSetLanguage])

  // 初始化时检测浏览器语言
  useEffect(() => {
    console.log("useEffect 运行，检测浏览器语言")
    const detectedLanguage = detectBrowserLanguage()
    console.log("当前语言:", currentLanguage, "检测到的语言:", detectedLanguage)

    // 从 localStorage 获取用户设置的语言
    const savedLanguage = localStorage.getItem("language-setting")
    if (savedLanguage) {
      try {
        const parsedLanguage = JSON.parse(savedLanguage) as Language
        console.log("从 localStorage 获取的语言:", parsedLanguage)

        if (parsedLanguage !== currentLanguage) {
          console.log("使用保存的语言设置")
          setLanguage(parsedLanguage)
        }
        return
      } catch (error) {
        console.error("解析保存的语言设置失败:", error)
      }
    }

    // 如果没有保存的设置，使用浏览器语言
    if (detectedLanguage !== currentLanguage) {
      console.log("检测到浏览器语言与当前语言不同，自动切换")
      setLanguage(detectedLanguage)
    }
  }, [currentLanguage, setLanguage]) // 添加依赖项

  // 同步翻译（从缓存获取）
  const translateSync = useCallback((text: string): string => {
    if (!text) return text

    // 如果是中文且当前语言是中文，直接返回
    if (currentLanguage === "zh") return text

    // 首先检查是否是国际化键
    if (text.includes(".") && hasI18nText(text, currentLanguage)) {
      const i18nText = getI18nText(text, currentLanguage)
      console.log(`翻译键 "${text}" => "${i18nText}"`)
      return i18nText
    }

    // 然后检查翻译缓存
    const cached = getTranslation(text, currentLanguage)
    if (cached) {
      // 检查缓存的翻译质量
      if (!isLowQualityTranslation(text, cached)) {
        return cached
      }
      console.warn(`检测到低质量翻译: "${text}" => "${cached}"，尝试使用备选翻译`)
    }

    // 如果没有缓存，检查常见翻译
    const commonTranslations: Record<string, string> = {
      关注: "Following",
      最热: "Hottest",
      实时: "Real-time",
      更多: "More",
      刷新: "Refresh",
      回到顶部: "Back to Top",
      黑暗模式: "Dark Mode",
      白天模式: "Light Mode",
      退出登录: "Log Out",
      登录: "Log In",
    }

    if (currentLanguage === "en" && commonTranslations[text]) {
      return commonTranslations[text]
    }

    return text
  }, [currentLanguage, getTranslation])

  // 异步翻译（如果缓存没有则请求API）
  const translateAsync = useCallback(async (text: string): Promise<string> => {
    if (!text) return text

    // 如果是中文且当前语言是中文，直接返回
    if (currentLanguage === "zh") return text

    // 首先检查是否是国际化键
    if (text.includes(".") && hasI18nText(text, currentLanguage)) {
      return getI18nText(text, currentLanguage)
    }

    // 然后检查翻译缓存
    const cached = getTranslation(text, currentLanguage)
    if (cached) {
      // 检查缓存的翻译质量
      if (!isLowQualityTranslation(text, cached)) {
        return cached
      }
      console.warn(`检测到低质量翻译: "${text}" => "${cached}"，尝试使用API重新翻译`)
    }

    // 检查常见翻译
    const commonTranslations: Record<string, string> = {
      关注: "Following",
      最热: "Hottest",
      实时: "Real-time",
      更多: "More",
      刷新: "Refresh",
      回到顶部: "Back to Top",
      黑暗模式: "Dark Mode",
      白天模式: "Light Mode",
      退出登录: "Log Out",
      登录: "Log In",
    }

    if (currentLanguage === "en" && commonTranslations[text]) {
      const translation = commonTranslations[text]
      // 将翻译结果添加到缓存
      addTranslation(text, currentLanguage, translation)
      return translation
    }

    try {
      // 如果缓存中没有，则请求API翻译
      const translated = await translate(text, currentLanguage)

      // 检查API翻译质量
      if (translated && translated !== text && !isLowQualityTranslation(text, translated)) {
        // 将翻译结果添加到缓存
        addTranslation(text, currentLanguage, translated)
        return translated
      } else {
        console.warn(`API返回低质量翻译: "${text}" => "${translated}"，使用原文`)
        return text
      }
    } catch (error) {
      console.error("翻译失败:", error)
      return text
    }
  }, [currentLanguage, getTranslation, addTranslation])

  // 检查是否已经翻译
  const isTranslated = currentLanguage !== "zh"

  // 提供上下文值
  const contextValue = useMemo(() => ({
    currentLanguage,
    setLanguage,
    translate: translateSync,
    translateAsync,
    isTranslated,
  }), [currentLanguage, setLanguage, translateSync, translateAsync, isTranslated])

  useEffect(() => {
    console.log("当前语言:", currentLanguage)
  }, [currentLanguage])

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}
