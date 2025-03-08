import zhLocale from "./locales/zh"
import enLocale from "./locales/en"
import type { Language } from "~/services/translationService"

// 定义翻译对象的类型
interface LocaleObject {
  [key: string]: string | LocaleObject
}

// 所有语言包
const locales: Record<Language, LocaleObject> = {
  zh: zhLocale,
  en: enLocale,
}

// 获取翻译
export function getI18nText(key: string, language: Language = "zh"): string {
  // 分割路径，例如 'nav.more' => ['nav', 'more']
  const path = key.split(".")

  // 获取对应语言的翻译包
  const locale = locales[language]
  if (!locale) {
    console.warn(`未找到语言包: ${language}`)
    return key
  }

  // 按路径查找翻译
  let result: any = locale
  for (const segment of path) {
    if (!result[segment]) {
      console.warn(`未找到翻译键: ${key}`)
      return key
    }
    result = result[segment]
  }

  // 确保返回的是字符串
  if (typeof result !== "string") {
    console.warn(`翻译键 ${key} 的结果不是字符串:`, result)
    return key
  }

  return result
}

// 检查是否有翻译
export function hasI18nText(key: string, language: Language = "zh"): boolean {
  try {
    const text = getI18nText(key, language)
    return text !== key
  } catch {
    return false
  }
}

// 导出所有语言包
export { locales }
