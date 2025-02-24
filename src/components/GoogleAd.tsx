import { useEffect } from "react"

interface GoogleAdProps {
  slot: string
  style?: React.CSSProperties
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal"
  layout?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export function GoogleAd({ slot, style, format = "auto", layout }: GoogleAdProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (error) {
      console.error("Error loading Google AdSense:", error)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={style || { display: "block" }}
      data-ad-client="ca-pub-2044354603819805"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout ? { "data-ad-layout": layout } : {})}
    />
  )
}
