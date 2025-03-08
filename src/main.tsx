import ReactDOM from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { routeTree } from "./routeTree.gen"
import { TranslationProvider } from "./components/TranslationProvider"

// 声明全局 window 类型扩展
declare global {
  interface Window {
    queryClient: QueryClient
  }
}

const queryClient = new QueryClient()

// 将 queryClient 添加到 window 对象中，以便在其他组件中访问
window.queryClient = queryClient

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <RouterProvider router={router} />
      </TranslationProvider>
    </QueryClientProvider>,
  )
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
