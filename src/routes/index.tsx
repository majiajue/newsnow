import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: IndexComponent,
  beforeLoad: () => {
    // 重定向到 all-sources 页面
    throw redirect({ to: '/news/all-sources' })
  }
})

function IndexComponent() {
  // 这个组件不会被渲染，因为会被重定向
  return null
}
