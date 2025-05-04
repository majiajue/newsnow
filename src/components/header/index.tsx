import { Link } from "@tanstack/react-router"
import { useIsFetching } from "@tanstack/react-query"
import type { SourceID } from "@shared/types"
import { NavBar } from "../navbar"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { useTranslation } from "../TranslationProvider"
import { Menu } from "./menu"
import { currentSourcesAtom, goToTopAtom } from "~/atoms"

function GoTop() {
  const { ok, fn: goToTop } = useAtomValue(goToTopAtom)
  const { t } = useTranslation()
  return (
    <button
      type="button"
      title={t("回到顶部")}
      className={$("i-ph:arrow-fat-up-duotone", ok ? "op-50 btn" : "op-0")}
      onClick={goToTop}
    />
  )
}

function Refresh() {
  const currentSources = useAtomValue(currentSourcesAtom)
  const { refresh } = useRefetch()
  const refreshAll = useCallback(() => refresh(...currentSources), [refresh, currentSources])
  const { t } = useTranslation()

  const isFetching = useIsFetching({
    predicate: (query) => {
      const [type, id] = query.queryKey as ["source" | "entire", SourceID]
      return (type === "source" && currentSources.includes(id)) || type === "entire"
    },
  })

  return (
    <button
      type="button"
      title={t("刷新")}
      className={$("i-ph:arrow-counter-clockwise-duotone btn", isFetching && "animate-spin i-ph:circle-dashed-duotone")}
      onClick={refreshAll}
    />
  )
}

export function Header() {
  const { t } = useTranslation()
  return (
    <>
      <span className="flex justify-self-start">
        <Link to="/" className="flex gap-2 items-center">
          <div className="h-10 w-10 bg-cover" title={t("logo")} style={{ backgroundImage: "url(/icon.svg)" }} />
          <span className="text-2xl font-brand line-height-none!">
            <p>{t("News")}</p>
            <p className="mt--1">
              <span className="color-primary-6">N</span>
              <span>{t("ow")}</span>
            </p>
          </span>
        </Link>
      </span>
      <span className="justify-self-center">
        {/* 导航栏暂时不需要 */}
        {/* <span className="hidden md:(inline-block)">
          <NavBar />
        </span> */}
      </span>
      {/* 右侧功能按钮暂时不需要 */}
      {/* <span className="justify-self-end flex gap-2 items-center text-xl text-primary-600 dark:text-primary">
        <GoTop />
        <Refresh />
        <LanguageSwitcher />
        <Menu />
      </span> */}
    </>
  )
}
