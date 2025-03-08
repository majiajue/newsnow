import { useEffect, useState } from "react"
import { useTranslation } from "../hooks/useTranslation"

// 翻译文本组件属性
interface TranslateProps {
  text: string
  async?: boolean
}

/**
 * 翻译文本组件
 * 用于将文本翻译成当前选择的语言
 * @param text 要翻译的文本
 * @param async 是否使用异步翻译（默认为false）
 */
export function Translate({ text, async = false }: TranslateProps) {
  const { translate, translateAsync } = useTranslation()
  const [asyncText, setAsyncText] = useState(text)

  useEffect(() => {
    if (async) {
      translateAsync(text).then(setAsyncText)
    }
  }, [async, text, translateAsync])

  return async ? asyncText : translate(text)
}
