import { create } from "zustand"
import { persist } from "zustand/middleware"

// 支持的语言类型
export type Language = "zh" | "en"

// 翻译缓存项
interface TranslationCacheItem {
  text: string
  translation: string
  language: Language
  timestamp: number
}

// 翻译存储状态
interface TranslationStoreState {
  currentLanguage: Language
  cache: TranslationCacheItem[]
  setLanguage: (language: Language) => void
  getTranslation: (text: string, language: Language) => string | null
  addTranslation: (text: string, language: Language, translation: string) => void
  clearCache: () => void
}

// 创建翻译存储
export const useTranslationStore = create<TranslationStoreState>()(
  persist(
    (set, get) => ({
      currentLanguage: "zh", // 默认语言为中文
      cache: [],

      // 设置当前语言
      setLanguage: (language: Language) => {
        console.log(`设置语言: ${language}`)

        // 保存到localStorage
        try {
          localStorage.setItem("language-setting", JSON.stringify(language))
        } catch (e) {
          console.error("保存语言设置失败:", e)
        }

        set({ currentLanguage: language })
      },

      // 获取翻译
      getTranslation: (text: string, language: Language) => {
        if (!text) return text

        // 如果是中文且目标语言是中文，直接返回
        if (language === "zh") return text

        // 在缓存中查找
        const { cache } = get()
        const cacheItem = cache.find(
          item => item.text === text && item.language === language,
        )

        // 如果找到缓存项且未过期（1天内），返回缓存的翻译
        const now = Date.now()
        const cacheExpiration = 24 * 60 * 60 * 1000 // 1天

        if (cacheItem && (now - cacheItem.timestamp < cacheExpiration)) {
          return cacheItem.translation
        }

        // 如果没有找到缓存或缓存已过期，返回null
        return null
      },

      // 添加翻译到缓存
      addTranslation: (text: string, language: Language, translation: string) => {
        if (!text || !translation) return

        // 移除可能的"[EN]"前缀
        let cleanTranslation = translation
        if (typeof cleanTranslation === "string" && cleanTranslation.startsWith("[EN]")) {
          cleanTranslation = cleanTranslation.substring(5).trim()
        }

        const { cache } = get()

        // 检查是否已存在相同的缓存项
        const existingIndex = cache.findIndex(
          item => item.text === text && item.language === language,
        )

        // 创建新的缓存数组
        const newCache = [...cache]

        // 如果已存在，更新它
        if (existingIndex !== -1) {
          newCache[existingIndex] = {
            text,
            language,
            translation: cleanTranslation,
            timestamp: Date.now(),
          }
        } else {
          // 否则添加新的缓存项
          newCache.push({
            text,
            language,
            translation: cleanTranslation,
            timestamp: Date.now(),
          })
        }

        // 如果缓存太大，移除最旧的项
        const maxCacheSize = 1000
        if (newCache.length > maxCacheSize) {
          // 按时间戳排序
          newCache.sort((a, b) => a.timestamp - b.timestamp)
          // 删除最旧的20%
          const itemsToRemove = Math.floor(maxCacheSize * 0.2)
          newCache.splice(0, itemsToRemove)
        }

        // 更新状态
        set({ cache: newCache })
      },

      // 清除缓存
      clearCache: () => set({ cache: [] }),
    }),
    {
      name: "translation-storage", // localStorage的键名
      partialize: state => ({
        currentLanguage: state.currentLanguage,
        cache: state.cache,
      }),
    },
  ),
)

// 简单的英文翻译映射（作为API失败时的备用）
const commonTranslations: Record<string, string> = {
  "更新": "updated",
  "获取失败": "Failed to fetch",
  "加载中...": "Loading...",
  "切换语言": "Switch Language",
  "热门": "Hot",
  "科技": "Tech",
  "财经": "Finance",
  "体育": "Sports",
  "娱乐": "Entertainment",
  "健康": "Health",
  "教育": "Education",
  "旅游": "Travel",
}

// 简单的备用翻译函数
function fallbackTranslate(text: string, targetLang: Language): string {
  if (targetLang === "zh") return text

  // 检查常用翻译
  if (commonTranslations[text]) {
    return commonTranslations[text]
  }

  // 非常简单的英文转换（仅用于备用）
  return text
}

// 翻译API接口
export async function translateText(text: string, targetLang: Language): Promise<string> {
  // 如果是中文，不需要翻译
  if (targetLang === "zh") return text

  // 如果有备用翻译，直接使用
  if (commonTranslations[text]) {
    return commonTranslations[text]
  }

  // 使用本地模拟翻译
  return fallbackTranslate(text, targetLang)

  // 由于API连接问题，暂时禁用远程API调用，使用本地翻译
  /*
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时

    const response = await fetch('https://steep-heart-9e55.gymayong.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`翻译请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.translation || fallbackTranslate(text, targetLang)
  } catch (error) {
    console.error('翻译出错:', error)
    // 使用备用翻译
    return fallbackTranslate(text, targetLang)
  }
  */
}

// 翻译辅助函数
export async function translate(text: string, targetLang: Language): Promise<string> {
  // 如果是当前语言，不需要翻译
  if (targetLang === "zh") {
    return text
  }

  const store = useTranslationStore.getState()

  // 检查缓存
  const cachedTranslation = store.getTranslation(text, targetLang)
  if (cachedTranslation) {
    return cachedTranslation
  }

  try {
    // 调用API翻译
    const translation = await translateText(text, targetLang)

    // 缓存结果
    store.addTranslation(text, targetLang, translation)

    return translation
  } catch (error) {
    console.error("翻译失败，使用备用翻译:", error)
    const fallbackResult = fallbackTranslate(text, targetLang)
    // 缓存备用结果
    store.addTranslation(text, targetLang, fallbackResult)
    return fallbackResult
  }
}

// 批量翻译
export async function translateBatch(texts: string[], targetLang: Language): Promise<string[]> {
  return Promise.all(texts.map(text => translate(text, targetLang)))
}
