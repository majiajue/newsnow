import { createContext, useContext } from "react"
import { Translate as TranslateComponent } from "./Translate"

// 翻译上下文类型
export interface TranslationContextType {
  language: string
  setLanguage: (lang: string) => void
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
