import { useEffect, useState } from "react"
import { useTranslation } from "../hooks/useTranslation"

/**
 * 翻译文本组件属性
 * @typedef {object} TranslateProps
 * @property {string} text - 要翻译的文本内容
 * @property {boolean} [async=false] - 是否使用异步翻译模式
 */
interface TranslateProps {
  text: string
  async?: boolean
}

/**
 * 翻译文本组件
 * 用于将文本翻译成当前选择的语言
 * @param {TranslateProps} props - 组件属性
 * @param {string} props.text - 要翻译的文本内容
 * @param {boolean} [props.async] - 是否使用异步翻译模式
 * @returns {JSX.Element} 翻译后的文本元素
 */
export function Translate({ text, async = false }: TranslateProps) {
  /**
   * useTranslation钩子返回的翻译函数和异步翻译函数
   * @typedef {object} useTranslationReturn
   * @property {Function} t - 同步翻译函数
   * @property {Function} translateAsync - 异步翻译函数
   */
  const { t, translateAsync }: { t: (text: string) => string, translateAsync: (text: string) => Promise<string> } = useTranslation()
  const [asyncText, setAsyncText] = useState(text)

  /**
   * useEffect钩子，用于在组件挂载或更新时执行异步翻译
   * @param {Function} effect - 执行的函数
   * @param {Array} deps - 依赖项数组
   */
  useEffect(() => {
    if (async) {
      translateAsync(text).then(setAsyncText)
    }
  }, [async, text, translateAsync])

  return async ? asyncText : t(text)
}
