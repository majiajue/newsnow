import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Translate as TranslateComponent } from "./Translate"
import type { Language } from "~/services/translationService"
import { translate, useTranslationStore } from "~/services/translationService"

// 翻译上下文类型
interface TranslationContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (text: string) => string
  translateAsync: (text: string) => Promise<string>
  isTranslating: boolean
  translationProgress: number
  translationQueue: number
  translationErrors: number
}

// 创建翻译上下文
const TranslationContext = createContext<TranslationContextType>({
  language: "zh",
  setLanguage: () => {},
  t: (text: string) => text,
  translateAsync: async (text: string) => text,
  isTranslating: false,
  translationProgress: 0,
  translationQueue: 0,
  translationErrors: 0,
})

// 使用翻译上下文的钩子
export const useTranslation = () => useContext(TranslationContext)

// 重新导出 Translate 组件
export const Translate = TranslateComponent

// 翻译提供者组件
function TranslationProviderComponent({ children }: { children: ReactNode }) {
  // 从 store 获取当前语言和设置语言的函数
  const {
    language: currentLanguage,
    setLanguage: storeSetLanguage,
  } = useTranslationStore()

  console.log("TranslationProvider 初始化，当前语言:", currentLanguage)

  // 状态管理
  const [language, setLanguageState] = useState<Language>(currentLanguage)
  const [isTranslating, setIsTranslating] = useState<boolean>(false)
  const [translationProgress, setTranslationProgress] = useState<number>(0)
  const [translationQueue, setTranslationQueue] = useState<number>(0)
  const [translationErrors, setTranslationErrors] = useState<number>(0)
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({})

  // 设置语言
  const setLanguage = useCallback((language: Language) => {
    // 清除翻译缓存
    setTranslationCache({})

    // 重置翻译状态
    setTranslationProgress(0)
    setTranslationQueue(0)
    setTranslationErrors(0)

    // 更新语言状态
    storeSetLanguage(language)
    setLanguageState(language)

    // 将语言设置保存到本地存储
    localStorage.setItem("language-setting", JSON.stringify(language))

    // 记录语言切换事件
    console.log(`语言已切换为: ${language}`)
  }, [storeSetLanguage])

  // 翻译函数
  const t = useCallback((text: string): string => {
    // 如果文本为空，直接返回
    if (!text) return text

    // 如果语言是中文，直接返回原文
    if (language === "zh") return text

    // 如果缓存中已有翻译，直接返回
    const cacheKey = `${language}:${text}`
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey]
    }

    // 否则，异步获取翻译并更新缓存
    setIsTranslating(true)
    setTranslationQueue(prev => prev + 1)

    translate(text, language)
      .then((translated) => {
        if (typeof translated === "string") {
          // 更新缓存
          setTranslationCache(prev => ({
            ...prev,
            [cacheKey]: translated,
          }))

          // 更新翻译状态
          setTranslationProgress(prev => prev + 1)
          setTranslationQueue(prev => prev - 1)

          // 如果翻译队列为空，设置翻译状态为完成
          if (translationQueue <= 1) {
            setTimeout(() => {
              setIsTranslating(false)
            }, 300)
          }
        }
      })
      .catch((error) => {
        console.error("翻译错误:", error)
        setTranslationErrors(prev => prev + 1)
        setTranslationQueue(prev => prev - 1)

        // 如果翻译队列为空，设置翻译状态为完成
        if (translationQueue <= 1) {
          setTimeout(() => {
            setIsTranslating(false)
          }, 300)
        }
      })

    // 在翻译完成前，先返回原文
    return text
  }, [language, translationCache, translationQueue])

  const translateAsync = useCallback(async (text: string) => {
    // 如果文本为空，直接返回
    if (!text) return text

    // 如果语言是中文，直接返回原文
    if (language === "zh") return text

    // 如果缓存中已有翻译，直接返回
    const cacheKey = `${language}:${text}`
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey]
    }

    // 否则，异步获取翻译并更新缓存
    setIsTranslating(true)
    setTranslationQueue(prev => prev + 1)

    try {
      const translated = await translate(text, language)
      if (typeof translated === "string") {
        // 更新缓存
        setTranslationCache(prev => ({
          ...prev,
          [cacheKey]: translated,
        }))

        // 更新翻译状态
        setTranslationProgress(prev => prev + 1)
        setTranslationQueue(prev => prev - 1)

        // 如果翻译队列为空，设置翻译状态为完成
        if (translationQueue <= 1) {
          setTimeout(() => {
            setIsTranslating(false)
          }, 300)
        }

        return translated
      }
    } catch (error) {
      console.error("翻译错误:", error)
      setTranslationErrors(prev => prev + 1)
      setTranslationQueue(prev => prev - 1)

      // 如果翻译队列为空，设置翻译状态为完成
      if (translationQueue <= 1) {
        setTimeout(() => {
          setIsTranslating(false)
        }, 300)
      }
    }

    // 在翻译完成前，先返回原文
    return text
  }, [language, translationCache, translationQueue])

  // 检测浏览器语言并设置初始语言
  useEffect(() => {
    // 尝试从本地存储中获取语言设置
    const storedLanguage = localStorage.getItem("language-setting")
    if (storedLanguage) {
      try {
        const parsedLanguage = JSON.parse(storedLanguage) as Language
        if (parsedLanguage) {
          setLanguageState(parsedLanguage)
          storeSetLanguage(parsedLanguage)
          return
        }
      } catch (error) {
        console.error("解析存储的语言设置时出错:", error)
      }
    }

    // 如果没有存储的语言设置，检测浏览器语言
    const browserLanguage = navigator.language.toLowerCase()
    if (browserLanguage.startsWith("zh")) {
      setLanguageState("zh")
      storeSetLanguage("zh")
    } else if (browserLanguage.startsWith("en")) {
      setLanguageState("en")
      storeSetLanguage("en")
    }
    // 其他语言默认使用中文
  }, [storeSetLanguage])

  // 提供上下文值
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    translateAsync,
    isTranslating,
    translationProgress,
    translationQueue,
    translationErrors,
  }), [language, setLanguage, t, translateAsync, isTranslating, translationProgress, translationQueue, translationErrors])

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

export const TranslationProvider = TranslationProviderComponent
