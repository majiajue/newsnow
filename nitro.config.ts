import process from "node:process"
import { join } from "node:path"
import viteNitro from "vite-plugin-with-nitro"
import { RollopGlob } from "./tools/rollup-glob"
import { projectDir } from "./shared/dir"

const nitroOption: Parameters<typeof viteNitro>[0] = {
  experimental: {
    database: true,
  },
  rollupConfig: {
    plugins: [RollopGlob()],
  },
  sourceMap: false,
  database: {
    default: {
      connector: "sqlite",
    },
  },
  imports: {
    dirs: ["server/utils", "shared"],
  },
  preset: "node-server",
  alias: {
    "@shared": join(projectDir, "shared"),
    "#": join(projectDir, "server"),
  },
  // 强制添加 routeRules 以调整开发模式下的 CSP (临时调试)
  routeRules: {
    '/**': {
      headers: {
        'content-security-policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; default-src 'self' https:"
      }
    }
  },
}

// 确保 nitroOption 在后续使用前已定义
if (nitroOption) {
  if (process.env.VERCEL) {
    nitroOption.preset = "vercel-edge"
    // You can use other online database, do it yourself. For more info: https://db0.unjs.io/connectors
    nitroOption.database = undefined
    // nitroOption.vercel = {
    //   config: {
    //     cache: []
    //   },
    // }
  } else if (process.env.CF_PAGES) {
    nitroOption.preset = "cloudflare-pages"
    nitroOption.database = {
      default: {
        connector: "cloudflare-d1",
        options: {
          bindingName: "NEWSNOW_DB",
        },
      },
    }
  } else if (process.env.BUN) {
    nitroOption.preset = "bun"
    nitroOption.database = {
      default: {
        connector: "bun-sqlite",
      },
    }
  }
}

export default function () {
  return viteNitro(nitroOption)
}