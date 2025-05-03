import type { ReactNode } from "react"
import { createContext, useContext } from "react"
import { Translate as TranslateComponent } from "./Translate"
import type { Language } from "~/services/translationService"

// 翻译上下文类型
export interface TranslationContextType {
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
export const TranslationContext = createContext<TranslationContextType>({
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

// 简化的翻译提供者组件
function TranslationProviderComponent({ children }: { children: ReactNode }) {
  // 直接使用默认上下文值
  return (
    <TranslationContext.Provider value={{
      language: "zh",
      setLanguage: () => {},
      t: (text: string) => text,
      translateAsync: async (text: string) => text,
      isTranslating: false,
      translationProgress: 0,
      translationQueue: 0,
      translationErrors: 0,
    }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const TranslationProvider = TranslationProviderComponent
