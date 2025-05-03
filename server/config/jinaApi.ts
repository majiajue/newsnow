/**
 * Jina AI API 配置
 */

// 从环境变量获取 Jina API 密钥
const jinaApiKey = process.env.JINA_API_KEY || ""

// 输出调试信息
console.log("Jina AI API 配置:")
console.log(`- API 密钥: ${jinaApiKey ? "已设置" : "未设置"}`)

// 如果环境变量缺失，输出警告
if (!jinaApiKey) {
  console.warn("警告: Jina AI API 密钥缺失，Jina API 功能可能无法正常工作")
  console.warn("请确保在 .env.server 文件中设置了 JINA_API_KEY")
}

// Jina API 配置
export const JINA_API = {
  // Jina API 密钥
  API_KEY: jinaApiKey,
  // API 超时设置（毫秒）
  TIMEOUT: 30000,
  // 最大重试次数
  MAX_RETRIES: 3,
  // API 基础 URL
  BASE_URLS: {
    READER: "https://r.jina.ai/",
    SEARCH: "https://s.jina.ai/",
    SEGMENT: "https://segment.jina.ai/",
    EMBEDDINGS: "https://api.jina.ai/v1/embeddings",
    CLASSIFY: "https://api.jina.ai/v1/classify",
    RERANK: "https://api.jina.ai/v1/rerank"
  },
  // 模型配置
  MODELS: {
    EMBEDDINGS: "jina-embeddings-v3",
    RERANKER: "jina-reranker-v2-base-multilingual"
  }
}

// 备用方案配置
export const JINA_BACKUP = {
  // 是否在 API 调用失败时使用模拟数据
  USE_MOCK: true,
  // 模拟数据的最大延迟（毫秒）
  MOCK_DELAY: 500
}
