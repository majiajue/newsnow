import { useContext } from "react"
import type { TranslationContextType } from "../components/TranslationProvider"
import { TranslationContext } from "../components/TranslationProvider"

// 使用翻译的Hook
export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
